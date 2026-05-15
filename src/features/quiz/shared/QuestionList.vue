<script setup lang="ts">
import { ref, computed, onMounted } from "vue"
import { useQuiz } from "@/features/quiz/store.ts"
import type { QuestionIn, ContextIn } from "@/features/quiz/types.ts"
import QuestionEditorModal from "@/features/quiz/shared/QuestionEditorModal.vue"
import QuestionPreview     from "@/features/quiz/shared/Questionpreview.vue"
import ContextEditor       from "@/features/quiz/shared/ContextEditor.vue"
import { McDelete2Line, FlPenSparkle } from "@kalimahapps/vue-icons"

const props = defineProps<{ quiz_id: number }>()

const quizStore = useQuiz()
const questions  = ref<QuestionIn[]>([])
const contexts   = ref<ContextIn[]>([])
const loading    = ref(true)

const newEditorFor       = ref<{ contextId: number | null } | null>(null)
const editingQuestion    = ref<QuestionIn | null>(null)
const previewQuestion    = ref<QuestionIn | null>(null)
const contextEditorState = ref<"new" | number | null>(null)

const TYPE_LABELS: Record<string, string> = {
  single_choice:   "Один",
  multiple_choice: "Несколько",
  matching:        "Соответствие",
  input:           "Ввод",
}

const TYPE_COLORS: Record<string, string> = {
  single_choice:   "#4EBEC2",
  multiple_choice: "#234970",
  matching:        "#f59e0b",
  input:           "#10b981",
}

onMounted(async () => {
  try {
    const [q, c] = await Promise.all([
      quizStore.fetchQuestions(props.quiz_id),
      quizStore.fetchContexts(props.quiz_id),
    ])
    questions.value = q
    contexts.value  = c
  } finally {
    loading.value = false
  }
})

const freeQuestions = computed(() => questions.value.filter(q => !q.context_id))

function questionsForContext(ctxId: number) {
  return questions.value.filter(q => q.context_id === ctxId)
}

const somethingOpen = computed(() =>
    !!previewQuestion.value || contextEditorState.value !== null
)

// ── Modal state ──
const modalOpen = computed(() => !!newEditorFor.value || !!editingQuestion.value)

const modalQuestion = computed(() => editingQuestion.value ?? undefined)

const modalOrder = computed(() => {
  if (editingQuestion.value) return editingQuestion.value.order
  const ctxId = newEditorFor.value?.contextId
  if (ctxId !== null && ctxId !== undefined) return questionsForContext(ctxId).length
  return freeQuestions.value.length
})

const modalContextId = computed<number | null>(():any => {
  if (editingQuestion.value) return editingQuestion.value.context_id
  return newEditorFor.value?.contextId ?? null
})

function closeAll() {
  newEditorFor.value       = null
  editingQuestion.value    = null
  previewQuestion.value    = null
  contextEditorState.value = null
}

function openNewQuestion(contextId: number | null) { closeAll(); newEditorFor.value = { contextId } }
function openEditQuestion(q: QuestionIn)           { closeAll(); editingQuestion.value = q }

function openPreview(q: QuestionIn) {
  if (previewQuestion.value?.id === q.id) { previewQuestion.value = null; return }
  previewQuestion.value = q
  editingQuestion.value = null
  newEditorFor.value    = null
}

function openNewContext()           { closeAll(); contextEditorState.value = "new" }
function openEditContext(id: number){ closeAll(); contextEditorState.value = id }

function onQuestionCreated(q: QuestionIn) {
  questions.value.push(q)
  newEditorFor.value = null
}

function onQuestionUpdated(updated: QuestionIn) {
  const idx = questions.value.findIndex(q => q.id === updated.id)
  if (idx !== -1) questions.value[idx] = updated
  if (previewQuestion.value?.id === updated.id) previewQuestion.value = updated
  editingQuestion.value = null
}

async function deleteQuestion(id: number) {
  if (!confirm("Удалить вопрос?")) return
  await quizStore.deleteQuestion(id)
  questions.value = questions.value.filter(q => q.id !== id)
  if (editingQuestion.value?.id === id) editingQuestion.value = null
  if (previewQuestion.value?.id === id) previewQuestion.value = null
}

function onContextSaved(ctx: ContextIn) {
  if (contextEditorState.value === "new") {
    contexts.value.push(ctx)
  } else {
    const idx = contexts.value.findIndex(c => c.id === ctx.id)
    if (idx !== -1) contexts.value[idx] = ctx
  }
  contextEditorState.value = null
}

async function deleteContext(id: number) {
  if (!confirm("Удалить контекст? Вопросы останутся без привязки.")) return
  await quizStore.deleteContext(id)
  contexts.value  = contexts.value.filter(c => c.id !== id)
  questions.value = questions.value.map(q =>
      q.context_id === id ? { ...q, context_id: null } : q
  )
}
</script>

<template>
  <div class="ql">

    <!-- ── Заголовок секции ── -->
    <div class="ql__header">
      <div class="ql__header-left">
        <span class="ql__title">Вопросы</span>
        <span class="ql__count">{{ questions.length }}</span>
      </div>
      <div class="ql__header-actions" v-if="!somethingOpen && !loading">
        <button class="ql__btn-ctx" type="button" @click="openNewContext">
          + Контекст
        </button>
        <button class="ql__btn-new" type="button" @click="openNewQuestion(null)">
          + Вопрос
        </button>
      </div>
    </div>

    <!-- ── Загрузка ── -->
    <template v-if="loading">
      <div class="ql__skeleton" v-for="i in 3" :key="i" />
    </template>

    <template v-else>

      <!-- ══ КОНТЕКСТЫ ══════════════════════════════════════════════ -->
      <div v-for="ctx in contexts" :key="ctx.id" class="ql__context">

        <!-- Редактор контекста инлайн -->
        <div v-if="contextEditorState === ctx.id" class="ql__panel ql__panel--ctx">
          <ContextEditor
              :quiz_id="quiz_id" :order="ctx.order" :context="ctx"
              @saved="onContextSaved" @cancelled="closeAll"
          />
        </div>

        <template v-else>
          <!-- Заголовок контекста -->
          <div class="ql__ctx-header">
            <div class="ql__ctx-meta">
              <span class="ql__ctx-badge">Контекст</span>
              <span class="ql__ctx-title">{{ ctx.title }}</span>
            </div>
            <div class="ql__ctx-actions" v-if="!somethingOpen">
              <button class="ql__icon-btn" type="button" @click="openEditContext(ctx.id)">
                <FlPenSparkle />
              </button>
              <button class="ql__icon-btn ql__icon-btn--danger" type="button" @click="deleteContext(ctx.id)">
                <McDelete2Line />
              </button>
            </div>
          </div>

          <!-- Текст контекста -->
          <div class="ql__ctx-body">
            <p class="ql__ctx-text">{{ ctx.text }}</p>
            <p v-if="ctx.rule" class="ql__ctx-rule">📌 {{ ctx.rule }}</p>
          </div>
        </template>

        <!-- Вопросы контекста -->
        <div class="ql__ctx-questions" v-if="questionsForContext(ctx.id).length > 0 || newEditorFor?.contextId === ctx.id">
          <div
              v-for="(q, idx) in questionsForContext(ctx.id)"
              :key="q.id"
              class="ql__item-wrap"
              :class="{ 'ql__item-wrap--dimmed': somethingOpen && previewQuestion?.id !== q.id }"
          >
            <!-- Превью -->
            <div v-if="previewQuestion?.id === q.id" class="ql__panel ql__panel--preview">
              <QuestionPreview
                  :question="previewQuestion" :index="idx + 1"
                  @edit="openEditQuestion(q)" @delete="deleteQuestion(q.id)" @close="closeAll"
              />
            </div>
            <!-- Строка вопроса -->
            <div v-else class="ql__item" @click="!somethingOpen && openPreview(q)">
              <span class="ql__item-num">{{ idx + 1 }}</span>
              <div class="ql__item-body">
                <p class="ql__item-text">{{ q.text }}</p>
                <span
                    class="ql__item-type"
                    :style="{ color: TYPE_COLORS[q.type], background: TYPE_COLORS[q.type] + '18' }"
                >{{ TYPE_LABELS[q.type] }}</span>
              </div>
              <span v-if="q.image_url" class="ql__item-img">🖼</span>
              <div class="ql__item-btns" v-if="!somethingOpen">
                <button class="ql__icon-btn" type="button" @click.stop="openEditQuestion(q)">
                  <FlPenSparkle />
                </button>
                <button class="ql__icon-btn ql__icon-btn--danger" type="button" @click.stop="deleteQuestion(q.id)">
                  <McDelete2Line />
                </button>
              </div>
            </div>
          </div>

        </div>

        <!-- Кнопка добавить вопрос в контекст -->
        <button
            v-if="!somethingOpen"
            class="ql__btn-add-q"
            type="button"
            @click="openNewQuestion(ctx.id)"
        >
          + Вопрос в контекст
        </button>

      </div>
      <!-- ══ /КОНТЕКСТЫ ════════════════════════════════════════════ -->

      <!-- Редактор нового контекста -->
      <div v-if="contextEditorState === 'new'" class="ql__panel ql__panel--ctx">
        <ContextEditor
            :quiz_id="quiz_id" :order="contexts.length"
            @saved="onContextSaved" @cancelled="closeAll"
        />
      </div>

      <!-- ══ БЕЗ КОНТЕКСТА ══════════════════════════════════════════ -->
      <div
          v-if="freeQuestions.length > 0 || newEditorFor?.contextId === null"
          class="ql__free"
      >
        <div class="ql__free-header">
          <span class="ql__free-label">Без контекста</span>
          <span class="ql__count">{{ freeQuestions.length }}</span>
        </div>

        <div
            v-for="(q, idx) in freeQuestions"
            :key="q.id"
            class="ql__item-wrap"
            :class="{ 'ql__item-wrap--dimmed': somethingOpen && previewQuestion?.id !== q.id }"
        >
          <div v-if="previewQuestion?.id === q.id" class="ql__panel ql__panel--preview">
            <QuestionPreview
                :question="previewQuestion" :index="idx + 1"
                @edit="openEditQuestion(q)" @delete="deleteQuestion(q.id)" @close="closeAll"
            />
          </div>
          <div v-else class="ql__item" @click="!somethingOpen && openPreview(q)">
            <span class="ql__item-num">{{ idx + 1 }}</span>
            <div class="ql__item-body">
              <p class="ql__item-text">{{ q.text }}</p>
              <span
                  class="ql__item-type"
                  :style="{ color: TYPE_COLORS[q.type], background: TYPE_COLORS[q.type] + '18' }"
              >{{ TYPE_LABELS[q.type] }}</span>
            </div>
            <span v-if="q.image_url" class="ql__item-img">🖼</span>
            <div class="ql__item-btns" v-if="!somethingOpen">
              <button class="ql__icon-btn" type="button" @click.stop="openEditQuestion(q)">
                <FlPenSparkle />
              </button>
              <button class="ql__icon-btn ql__icon-btn--danger" type="button" @click.stop="deleteQuestion(q.id)">
                <McDelete2Line />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Заглушка пустого состояния -->
      <div
          v-if="!somethingOpen && !modalOpen && contexts.length === 0 && questions.length === 0"
          class="ql__empty"
      >
        <p class="ql__empty-icon">🗂️</p>
        <p class="ql__empty-text">Вопросов пока нет</p>
        <p class="ql__empty-hint">Нажмите «+ Вопрос» чтобы начать</p>
      </div>

    </template>
  </div>

  <!-- ══ МОДАЛЬНЫЙ РЕДАКТОР ВОПРОСА ══════════════════════════════════════════ -->
  <QuestionEditorModal
      :show="modalOpen"
      :quiz_id="quiz_id"
      :order="modalOrder"
      :context_id="modalContextId"
      :question="modalQuestion"
      @saved="editingQuestion ? onQuestionUpdated($event) : onQuestionCreated($event)"
      @cancelled="closeAll"
  />
</template>

<style scoped lang="scss">
$bg:        #F6F6F6;
$card:      #ffffff;
$text:      #222222;
$muted:     #6B7280;
$border:    rgba(0,0,0,0.08);
$accent:    #234970;
$teal:      #4EBEC2;
$teal-soft: rgba(78, 190, 194, 0.12);
$teal-mid:  rgba(78, 190, 194, 0.22);
$ctx-color: #3b82f6;
$ctx-soft:  rgba(59, 130, 246, 0.1);
$red:       #ef4444;
$radius:    16px;
$radius-sm: 10px;
$radius-xs: 6px;

.ql {
  display: flex;
  flex-direction: column;
  gap: 10px;

  // ── Заголовок ──
  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 14px 18px;
    background: $card;
    border-radius: $radius;
    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  }

  &__header-left {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__title {
    font-size: 15px;
    font-weight: 700;
    color: $text;
  }

  &__count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 22px;
    height: 22px;
    padding: 0 6px;
    background: $teal-soft;
    color: $accent;
    font-size: 12px;
    font-weight: 700;
    border-radius: 30px;
  }

  &__header-actions {
    display: flex;
    gap: 8px;
  }

  &__btn-new {
    padding: 7px 14px;
    background: $teal-soft;
    border: 1.5px solid rgba(78,190,194,0.3);
    border-radius: 30px;
    color: $accent;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    font-family: inherit;
    transition: background 0.15s;
    &:hover { background: $teal-mid; }
  }

  &__btn-ctx {
    padding: 7px 14px;
    background: $ctx-soft;
    border: 1.5px solid rgba(59,130,246,0.2);
    border-radius: 30px;
    color: $ctx-color;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    font-family: inherit;
    transition: background 0.15s;
    &:hover { background: rgba(59,130,246,0.16); }
  }

  // ── Панели (редакторы) ──
  &__panel {
    background: $card;
    border-radius: $radius;
    padding: 18px;
    border: 1.5px solid rgba(78,190,194,0.2);
    box-shadow: 0 2px 12px rgba(78,190,194,0.08);

    &--ctx {
      border-color: rgba(59,130,246,0.2);
      box-shadow: 0 2px 12px rgba(59,130,246,0.06);
    }

    &--preview {
      border-color: $border;
      box-shadow: 0 2px 12px rgba(0,0,0,0.06);
    }
  }

  // ── Блок контекста ──
  &__context {
    display: flex;
    flex-direction: column;
    gap: 8px;
    background: $card;
    border-radius: $radius;
    border: 1.5px solid rgba(59,130,246,0.18);
    padding: 14px 16px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.04);
  }

  &__ctx-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }

  &__ctx-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    flex: 1;
  }

  &__ctx-badge {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: $ctx-color;
    background: $ctx-soft;
    padding: 2px 8px;
    border-radius: 20px;
    flex-shrink: 0;
  }

  &__ctx-title {
    font-size: 13px;
    font-weight: 600;
    color: $text;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__ctx-actions { display: flex; gap: 4px; flex-shrink: 0; }

  &__ctx-body {
    padding: 10px 12px;
    background: rgba(59,130,246,0.04);
    border-radius: $radius-sm;
    border-left: 3px solid rgba(59,130,246,0.25);
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__ctx-text {
    font-size: 13px;
    color: $muted;
    margin: 0;
    line-height: 1.65;
    white-space: pre-wrap;
  }

  &__ctx-rule {
    font-size: 12px;
    color: $ctx-color;
    margin: 4px 0 0;
  }

  &__ctx-questions {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  &__btn-add-q {
    align-self: flex-start;
    background: none;
    border: 1.5px dashed rgba(59,130,246,0.25);
    border-radius: $radius-xs;
    color: $ctx-color;
    cursor: pointer;
    font-size: 12px;
    font-weight: 500;
    padding: 5px 14px;
    font-family: inherit;
    transition: border-color 0.15s, background 0.15s;
    &:hover { border-color: $ctx-color; background: $ctx-soft; }
  }

  // ── Секция без контекста ──
  &__free {
    display: flex;
    flex-direction: column;
    gap: 6px;
    background: $card;
    border-radius: $radius;
    border: 1.5px solid $border;
    padding: 14px 16px;
    margin-bottom: 100px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.04);
  }

  &__free-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;
  }

  &__free-label {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: $muted;
  }

  // ── Обёртка вопроса (dimmed) ──
  &__item-wrap {
    transition: opacity 0.2s;
    &--dimmed { opacity: 0.3; pointer-events: none; }
  }

  // ── Строка вопроса ──
  &__item {
    display: flex;
    align-items: center;
    gap: 10px;
    background: $bg;
    border: 1.5px solid $border;
    border-radius: $radius-sm;
    padding: 10px 12px;
    cursor: pointer;
    transition: border-color 0.15s, box-shadow 0.15s;

    &:hover { border-color: rgba(78,190,194,0.4); box-shadow: 0 2px 8px rgba(78,190,194,0.1); }
  }

  &__item-num {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: $card;
    border: 1.5px solid $border;
    color: $muted;
    font-size: 11px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &__item-body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__item-text {
    font-size: 13px;
    font-weight: 500;
    color: $text;
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__item-type {
    display: inline-flex;
    align-items: center;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 2px 8px;
    border-radius: 20px;
    width: max-content;
  }

  &__item-img { font-size: 13px; opacity: 0.4; flex-shrink: 0; }

  &__item-btns {
    display: flex;
    gap: 4px;
    flex-shrink: 0;
  }

  // ── Иконка-кнопка ──
  &__icon-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    border-radius: $radius-xs;
    border: 1.5px solid $border;
    background: $card;
    color: $muted;
    font-size: 16px;
    cursor: pointer;
    transition: all 0.15s;

    &:hover { border-color: $teal; color: $accent; background: $teal-soft; }
    &--danger:hover { border-color: #fca5a5; color: $red; background: rgba(239,68,68,0.06); }
  }

  // ── Скелетон ──
  &__skeleton {
    height: 64px;
    border-radius: $radius;
    background: linear-gradient(
            90deg,
            rgba(0,0,0,0.04) 25%,
            rgba(0,0,0,0.07) 50%,
            rgba(0,0,0,0.04) 75%
    );
    background-size: 200% 100%;
    animation: shimmer 1.4s infinite;
  }

  // ── Пустое состояние ──
  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 40px 20px;
    text-align: center;
  }

  &__empty-icon { font-size: 40px; margin: 0; line-height: 1; }
  &__empty-text { font-size: 15px; font-weight: 600; color: $text; margin: 0; }
  &__empty-hint { font-size: 13px; color: $muted; margin: 0; }
}

@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>