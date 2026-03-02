<script setup lang="ts">
import { ref, computed, onMounted, defineComponent, h } from "vue"
import { useQuiz } from "@/features/quiz/store.ts"
import type { QuestionIn, ContextIn } from "@/features/quiz/types.ts"
import QuestionEditor from "@/features/quiz/components/QuestionEditor.vue"
import QuestionPreview from "@/features/quiz/components/QuestionPreview.vue"
import ContextEditor from "@/features/quiz/components/ContextEditor.vue"
import { McDelete2Line, FlPenSparkle } from "@kalimahapps/vue-icons"

const props = defineProps<{ quiz_id: number }>()

const quizStore = useQuiz()

// ─── Состояние ───────────────────────────────────────────────────────────────
const questions  = ref<QuestionIn[]>([])
const contexts   = ref<ContextIn[]>([])
const loading    = ref(true)

// Редактор нового вопроса: contextId = null → без контекста, число → id контекста
const newEditorFor    = ref<{ contextId: number | null } | null>(null)
const editingQuestion = ref<QuestionIn | null>(null)
const previewQuestion = ref<QuestionIn | null>(null)

// Редактор контекста: 'new' | id контекста (редактировать) | null
const contextEditorState = ref<"new" | number | null>(null)

const TYPE_LABELS: Record<string, string> = {
  single_choice:   "Один ответ",
  multiple_choice: "Несколько ответов",
  matching:        "Соответствие",
  input:           "Ввод",
}

// ─── Загрузка ─────────────────────────────────────────────────────────────────
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

// ─── Группировка ─────────────────────────────────────────────────────────────
const freeQuestions = computed(() =>
    questions.value.filter(q => !q.context_id)
)

function questionsForContext(ctxId: number) {
  return questions.value.filter(q => q.context_id === ctxId)
}

// ─── Флаг «что-то открыто» ───────────────────────────────────────────────────
const somethingOpen = computed(() =>
    !!newEditorFor.value || !!editingQuestion.value || contextEditorState.value !== null
)

// ─── Управление состояниями ───────────────────────────────────────────────────
function closeAll() {
  newEditorFor.value       = null
  editingQuestion.value    = null
  previewQuestion.value    = null
  contextEditorState.value = null
}

function openNewQuestion(contextId: number | null) {
  closeAll()
  newEditorFor.value = { contextId }
}

function openEditQuestion(q: QuestionIn) {
  closeAll()
  editingQuestion.value = q
}

function openPreview(q: QuestionIn) {
  if (previewQuestion.value?.id === q.id) { previewQuestion.value = null; return }
  // Превью не закрывает редакторы — только переключается
  previewQuestion.value = q
  editingQuestion.value = null
  newEditorFor.value    = null
}

function openNewContext()         { closeAll(); contextEditorState.value = "new" }
function openEditContext(id: number) { closeAll(); contextEditorState.value = id }

// ─── Коллбэки ────────────────────────────────────────────────────────────────
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
  if (!confirm("Удалить контекст? Вопросы внутри останутся без привязки к контексту.")) return
  await quizStore.deleteContext(id)
  contexts.value  = contexts.value.filter(c => c.id !== id)
  questions.value = questions.value.map(q =>
      q.context_id === id ? { ...q, context_id: null } : q
  )
}
</script>

<template>
  <div class="ql">

    <!-- ── Заголовок ── -->
    <div class="ql__header">
      <h3 class="ql__title">Вопросы ({{ questions.length }})</h3>
      <div class="ql__header-actions" v-if="!somethingOpen">
        <button class="ql__btn-ctx" type="button" @click="openNewContext">
          + Контекст
        </button>
        <button class="ql__btn-new" type="button" @click="openNewQuestion(null)">
          + Вопрос
        </button>
      </div>
    </div>

    <div v-if="loading" class="ql__loading">Загрузка…</div>

    <template v-else>

      <!-- ══ КОНТЕКСТЫ ══════════════════════════════════════════════════ -->
      <div v-for="ctx in contexts" :key="ctx.id" class="ql__context">

        <!-- Редактор контекста инлайн -->
        <template v-if="contextEditorState === ctx.id">
          <div class="ql__panel">
            <ContextEditor
                :quiz_id="quiz_id" :order="ctx.order" :context="ctx"
                @saved="onContextSaved" @cancelled="closeAll"
            />
          </div>
        </template>

        <template v-else>
          <!-- Заголовок контекста -->
          <div class="ql__ctx-header">
            <div class="ql__ctx-meta">
              <span class="ql__ctx-badge">Контекст</span>
              <span class="ql__ctx-title">{{ ctx.title }}</span>
              <span class="ql__ctx-count">{{ questionsForContext(ctx.id).length }} вопр.</span>
            </div>
            <div class="ql__ctx-actions" v-if="!somethingOpen">
              <button class="ql__icon-btn" type="button" @click="openEditContext(ctx.id)" title="Редактировать">
                <FlPenSparkle />
              </button>
              <button class="ql__icon-btn ql__icon-btn--danger" type="button" @click="deleteContext(ctx.id)" title="Удалить контекст">
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

        <!-- Вопросы этого контекста -->
        <ul class="ql__list" v-if="questionsForContext(ctx.id).length > 0">
          <li
              v-for="(q, idx) in questionsForContext(ctx.id)" :key="q.id"
              class="ql__item"
              :class="{
              'ql__item--open':   editingQuestion?.id === q.id || previewQuestion?.id === q.id,
              'ql__item--dimmed': somethingOpen && editingQuestion?.id !== q.id && previewQuestion?.id !== q.id,
            }"
          >
            <template v-if="editingQuestion?.id === q.id">
              <div class="ql__panel">
                <QuestionEditor :key="q.id" :quiz_id="quiz_id" :question="editingQuestion"
                                @saved="onQuestionUpdated" @cancelled="closeAll" />
              </div>
            </template>
            <template v-else-if="previewQuestion?.id === q.id">
              <div class="ql__preview-wrap">
                <QuestionPreview :question="previewQuestion" :index="idx + 1"
                                 @edit="openEditQuestion(q)" @delete="deleteQuestion(q.id)" @close="closeAll" />
              </div>
            </template>
            <template v-else>
              <button class="ql__item-row" type="button" :disabled="somethingOpen" @click="openPreview(q)">
                <div class="ql__item-index">{{ idx + 1 }}</div>
                <div class="ql__item-body">
                  <p class="ql__item-text">{{ q.text }}</p>
                  <span class="ql__item-type">{{ TYPE_LABELS[q.type] }}</span>
                </div>
                <span v-if="q.image_url" class="ql__item-img-icon">🖼</span>
              </button>
              <div class="ql__item-actions">
                <button class="ql__item-edit" type="button" :disabled="somethingOpen" @click.stop="openEditQuestion(q)">
                  <FlPenSparkle class="edit-icon" />
                </button>
                <button class="ql__item-delete" type="button" :disabled="somethingOpen" @click.stop="deleteQuestion(q.id)">
                  <McDelete2Line class="delete-icon" />
                </button>
              </div>
            </template>
          </li>
        </ul>

        <!-- Редактор нового вопроса в этот контекст -->
        <div v-if="newEditorFor?.contextId === ctx.id" class="ql__panel ql__panel--ctx">
          <QuestionEditor
              :quiz_id="quiz_id"
              :order="questionsForContext(ctx.id).length"
              :context_id="ctx.id"
              @saved="onQuestionCreated"
              @cancelled="closeAll"
          />
        </div>

        <!-- Кнопка "добавить вопрос в контекст" -->
        <button
            v-else-if="!somethingOpen"
            class="ql__btn-add-q"
            type="button"
            @click="openNewQuestion(ctx.id)"
        >
          + Вопрос в этот контекст
        </button>

      </div>
      <!-- ══ /КОНТЕКСТЫ ════════════════════════════════════════════════ -->

      <!-- ── Редактор нового контекста ── -->
      <div v-if="contextEditorState === 'new'" class="ql__panel">
        <ContextEditor
            :quiz_id="quiz_id" :order="contexts.length"
            @saved="onContextSaved" @cancelled="closeAll"
        />
      </div>

      <!-- ══ БЕЗ КОНТЕКСТА ════════════════════════════════════════════ -->
      <div
          class="ql__free"
          :class="{ 'ql__free--empty': freeQuestions.length === 0 && !(newEditorFor?.contextId === null) }"
      >
        <div class="ql__free-header">
          <span class="ql__free-label">Без контекста</span>
          <span class="ql__ctx-count">{{ freeQuestions.length }} вопр.</span>
        </div>

        <ul class="ql__list" v-if="freeQuestions.length > 0">
          <li
              v-for="(q, idx) in freeQuestions" :key="q.id"
              class="ql__item"
              :class="{
              'ql__item--open':   editingQuestion?.id === q.id || previewQuestion?.id === q.id,
              'ql__item--dimmed': somethingOpen && editingQuestion?.id !== q.id && previewQuestion?.id !== q.id,
            }"
          >
            <template v-if="editingQuestion?.id === q.id">
              <div class="ql__panel">
                <QuestionEditor :key="q.id" :quiz_id="quiz_id" :question="editingQuestion"
                                @saved="onQuestionUpdated" @cancelled="closeAll" />
              </div>
            </template>
            <template v-else-if="previewQuestion?.id === q.id">
              <div class="ql__preview-wrap">
                <QuestionPreview :question="previewQuestion" :index="idx + 1"
                                 @edit="openEditQuestion(q)" @delete="deleteQuestion(q.id)" @close="closeAll" />
              </div>
            </template>
            <template v-else>
              <button class="ql__item-row" type="button" :disabled="somethingOpen" @click="openPreview(q)">
                <div class="ql__item-index">{{ idx + 1 }}</div>
                <div class="ql__item-body">
                  <p class="ql__item-text">{{ q.text }}</p>
                  <span class="ql__item-type">{{ TYPE_LABELS[q.type] }}</span>
                </div>
                <span v-if="q.image_url" class="ql__item-img-icon">🖼</span>
              </button>
              <div class="ql__item-actions">
                <button class="ql__item-edit" type="button" :disabled="somethingOpen" @click.stop="openEditQuestion(q)">
                  <FlPenSparkle class="edit-icon" />
                </button>
                <button class="ql__item-delete" type="button" :disabled="somethingOpen" @click.stop="deleteQuestion(q.id)">
                  <McDelete2Line class="delete-icon" />
                </button>
              </div>
            </template>
          </li>
        </ul>

        <p v-else-if="newEditorFor?.contextId !== null" class="ql__empty-hint">
          Нет вопросов без контекста
        </p>

        <!-- Редактор нового вопроса без контекста -->
        <div v-if="newEditorFor?.contextId === null" class="ql__panel">
          <QuestionEditor
              :quiz_id="quiz_id"
              :order="freeQuestions.length"
              :context_id="null"
              @saved="onQuestionCreated"
              @cancelled="closeAll"
          />
        </div>
      </div>
      <!-- ══ /БЕЗ КОНТЕКСТА ══════════════════════════════════════════ -->

      <!-- Заглушка когда пусто -->
      <p v-if="!somethingOpen && contexts.length === 0 && questions.length === 0" class="ql__empty">
        Вопросов пока нет. Добавьте первый или создайте контекст!
      </p>

    </template>
  </div>
</template>

<style scoped lang="scss">
$bg: #172035;
$bg-light: #1e2d47;
$accent: #FFC02D;
$ctx-color: #60a5fa;
$ctx-dim: rgba(96, 165, 250, 0.1);
$text: #e2e8f0;
$muted: rgba(226, 232, 240, 0.55);
$radius: 10px;
$radius-sm: 6px;

.ql {
  display: flex;
  flex-direction: column;
  gap: 10px;

  // ── Заголовок ──
  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 8px;
  }

  &__title {
    font-size: 16px;
    font-weight: 700;
    margin: 0;
    color: $text;
  }

  &__header-actions {
    display: flex;
    gap: 8px;
  }

  &__btn-new {
    background: $accent;
    border: none;
    border-radius: $radius;
    color: #111827;
    cursor: pointer;
    font-size: 13px;
    font-weight: 600;
    padding: 7px 14px;
    transition: opacity 0.15s;
    &:hover { opacity: 0.85; }
  }

  &__btn-ctx {
    background: $ctx-dim;
    border: 1px solid rgba(96,165,250,0.25);
    border-radius: $radius;
    color: $ctx-color;
    cursor: pointer;
    font-size: 13px;
    font-weight: 600;
    padding: 7px 14px;
    transition: background 0.15s;
    &:hover { background: rgba(96,165,250,0.18); }
  }

  // ── Панели (редакторы) ──
  &__panel {
    background: $bg-light;
    border-radius: $radius;
    padding: 20px;
    border: 1.5px solid rgba(255,192,45,0.2);

    &--ctx {
      border-color: rgba(96,165,250,0.2);
    }
  }

  &__preview-wrap {
    width: 100%;
    background: $bg-light;
    border-radius: $radius;
    padding: 20px;
    border: 1.5px solid rgba(255,192,45,0.12);
  }

  // ── Блок контекста ──
  &__context {
    display: flex;
    flex-direction: column;
    gap: 8px;
    background: $bg;
    border-radius: $radius;
    border: 1.5px solid rgba(96,165,250,0.2);
    padding: 14px 16px;
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
    flex-wrap: wrap;
    min-width: 0;
  }

  &__ctx-badge {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: $ctx-color;
    background: $ctx-dim;
    padding: 2px 8px;
    border-radius: 20px;
    flex-shrink: 0;
  }

  &__ctx-title {
    font-size: 14px;
    font-weight: 600;
    color: $text;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__ctx-count {
    font-size: 11px;
    color: $muted;
    flex-shrink: 0;
  }

  &__ctx-actions {
    display: flex;
    gap: 2px;
    flex-shrink: 0;
  }

  &__ctx-body {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 10px 12px;
    background: rgba(96,165,250,0.05);
    border-radius: $radius-sm;
    border-left: 3px solid rgba(96,165,250,0.3);
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
    opacity: 0.85;
  }

  &__icon-btn {
    background: none;
    border: none;
    cursor: pointer;
    width: 30px;
    height: 30px;
    border-radius: $radius-sm;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 17px;
    color: $muted;
    transition: background 0.15s, color 0.15s;

    &:hover { background: rgba(255,255,255,0.06); color: $text; }
    &--danger:hover { color: #ff6b6b; background: rgba(255,107,107,0.08); }
  }

  &__btn-add-q {
    align-self: flex-start;
    background: none;
    border: 1.5px dashed rgba(96,165,250,0.28);
    border-radius: $radius-sm;
    color: $ctx-color;
    cursor: pointer;
    font-size: 12px;
    font-weight: 500;
    padding: 5px 14px;
    transition: border-color 0.15s, background 0.15s;
    &:hover { border-color: $ctx-color; background: $ctx-dim; }
  }

  // ── Секция без контекста ──
  &__free {
    display: flex;
    flex-direction: column;
    gap: 8px;
    background: $bg;
    border-radius: $radius;
    border: 1.5px solid rgba(255,255,255,0.07);
    padding: 14px 16px;

    &--empty { border-style: dashed; }
  }

  &__free-header {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__free-label {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: $muted;
  }

  &__empty-hint {
    font-size: 13px;
    color: rgba(255,255,255,0.18);
    margin: 0;
    text-align: center;
    padding: 8px 0;
  }

  // ── Список вопросов ──
  &__list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  &__item {
    display: flex;
    align-items: stretch;
    background: $bg-light;
    border-radius: $radius-sm;
    overflow: hidden;
    transition: opacity 0.2s;

    &--open { background: transparent; }
    &--dimmed { opacity: 0.35; pointer-events: none; }
  }

  &__item-row {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    background: none;
    border: none;
    color: inherit;
    cursor: pointer;
    text-align: left;
    transition: background 0.15s;

    &:hover:not(:disabled) { background: rgba(255,255,255,0.03); }
    &:disabled { cursor: default; }
  }

  &__item-index {
    flex-shrink: 0;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: rgba(255,255,255,0.07);
    color: $muted;
    font-size: 11px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__item-body { flex: 1; min-width: 0; }

  &__item-text {
    margin: 0 0 3px;
    font-size: 13px;
    color: $text;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__item-type {
    font-size: 10px;
    color: $muted;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  &__item-img-icon { font-size: 13px; flex-shrink: 0; opacity: 0.5; }

  &__item-actions {
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 0 6px;
    flex-shrink: 0;
    align-self: stretch;
    border-left: 1px solid rgba(255,255,255,0.05);
  }

  &__item-edit,
  &__item-delete {
    background: none;
    border: none;
    color: rgba(255,255,255,0.18);
    cursor: pointer;
    padding: 4px 5px;
    border-radius: 5px;
    display: flex;
    align-items: center;
    transition: color 0.15s, background 0.15s;

    .edit-icon   { font-size: 18px; }
    .delete-icon { font-size: 20px; }

    &:disabled { opacity: 0.3; cursor: not-allowed; }
  }

  &__item-edit:hover:not(:disabled)   { color: $accent;  background: rgba(255,192,45,0.08); }
  &__item-delete:hover:not(:disabled) { color: #ff6b6b; background: rgba(255,107,107,0.08); }

  &__loading,
  &__empty {
    color: $muted;
    font-size: 14px;
    text-align: center;
    padding: 32px 0;
  }
}
</style>