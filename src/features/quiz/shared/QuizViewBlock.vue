<script setup lang="ts">
import { ref, reactive } from "vue"
import { useQuiz } from "@/features/quiz/store.ts"
import type { QuizIn } from "@/features/quiz/types.ts"
import { ByEdit, McDelete2Line, IoOutlineCopy } from "@kalimahapps/vue-icons"

const props = defineProps<{ quiz: QuizIn }>()

const emit = defineEmits<{
  updated: [quiz: QuizIn]
  deleted: []
}>()

const quizStore  = useQuiz()
const isEditing  = ref(false)
const loading    = ref(false)
const error      = ref("")
const copyHint   = ref(false)

const form = reactive({
  title:       props.quiz.title,
  description: props.quiz.description,
  time_limit:  props.quiz.time_limit,
})

// Синхронизируем форму при смене пропса
function startEdit() {
  form.title       = props.quiz.title
  form.description = props.quiz.description
  form.time_limit  = props.quiz.time_limit
  error.value      = ""
  isEditing.value  = true
}

async function save() {
  if (!form.title.trim()) { error.value = "Название обязательно"; return }
  error.value = ""
  loading.value = true
  try {
    const updated = await quizStore.updateQuiz({
      id:          props.quiz.id,
      title:       form.title.trim(),
      description: form.description.trim(),
      time_limit:  form.time_limit,
    })
    emit("updated", updated)
    isEditing.value = false
  } catch (e: any) {
    error.value = e?.response?.data?.detail ?? e?.message ?? "Ошибка сохранения"
  } finally {
    loading.value = false
  }
}

async function deleteQuiz() {
  if (!confirm("Удалить викторину? Все вопросы будут удалены.")) return
  try {
    await quizStore.deleteQuiz(props.quiz.id)
    emit("deleted")
  } catch (e) {
    console.error(e)
  }
}

async function copyHash() {
  await navigator.clipboard.writeText(props.quiz.hash_code)
  copyHint.value = true
  setTimeout(() => (copyHint.value = false), 1800)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "2-digit", month: "short", year: "numeric",
  })
}

function formatTime(sec: number) {
  if (!sec) return "без лимита"
  const m = Math.floor(sec / 60)
  const s = sec % 60
  if (m && s) return `${m} мин ${s} сек`
  return m ? `${m} мин` : `${s} сек`
}

const presets = [
  { label: "5 мин",  value: 300  },
  { label: "15 мин", value: 900  },
  { label: "30 мин", value: 1800 },
  { label: "1 час",  value: 3600 },
]
</script>

<template>
  <div class="qvb">

    <!-- ══ Режим просмотра ══════════════════════════════════════════ -->
    <template v-if="!isEditing">

      <div class="qvb__top">
        <!-- Хэш-код -->
        <button class="qvb__hash" type="button" @click="copyHash" title="Скопировать код">
          <IoOutlineCopy class="qvb__hash-icon" />
          <span class="qvb__hash-code">{{ quiz.hash_code }}</span>
          <transition name="fade">
            <span v-if="copyHint" class="qvb__copy-hint">Скопировано!</span>
          </transition>
        </button>

        <div class="qvb__actions">
          <button class="qvb__icon-btn" type="button" @click="startEdit" title="Редактировать">
            <ByEdit />
          </button>
          <button class="qvb__icon-btn qvb__icon-btn--danger" type="button" @click="deleteQuiz" title="Удалить">
            <McDelete2Line />
          </button>
        </div>
      </div>

      <p class="qvb__description">{{ quiz.description }}</p>

      <div class="qvb__meta">
        <span class="qvb__meta-pill">
          📅 {{ formatDate(quiz.created_at) }}
        </span>
        <span class="qvb__meta-pill">
          ⏱ {{ formatTime(quiz.time_limit) }}
        </span>
      </div>

    </template>

    <!-- ══ Режим редактирования ══════════════════════════════════════ -->
    <template v-else>
      <p class="qvb__edit-heading">Редактирование</p>

      <div class="qvb__field">
        <label class="qvb__label">Название</label>
        <input
          class="qvb__input"
          v-model="form.title"
          type="text"
          placeholder="Название викторины"
          :disabled="loading"
        />
      </div>

      <div class="qvb__field">
        <label class="qvb__label">Описание</label>
        <textarea
          class="qvb__textarea"
          v-model="form.description"
          rows="3"
          placeholder="Описание"
          :disabled="loading"
        />
      </div>

      <div class="qvb__field">
        <label class="qvb__label">Лимит времени</label>
        <div class="qvb__presets">
          <button
            v-for="p in presets" :key="p.value"
            type="button"
            class="qvb__preset"
            :class="{ 'qvb__preset--active': form.time_limit === p.value }"
            :disabled="loading"
            @click="form.time_limit = form.time_limit === p.value ? 0 : p.value"
          >{{ p.label }}</button>
        </div>
        <div class="qvb__time-row">
          <input
            class="qvb__input qvb__input--short"
            v-model.number="form.time_limit"
            type="number" min="0" step="60"
            :disabled="loading"
          />
          <span class="qvb__time-unit">сек</span>
          <span class="qvb__time-hint">{{ formatTime(form.time_limit) }}</span>
        </div>
      </div>

      <p class="qvb__error" v-if="error">{{ error }}</p>

      <div class="qvb__edit-actions">
        <button class="qvb__btn qvb__btn--cancel" type="button" @click="isEditing = false" :disabled="loading">
          Отмена
        </button>
        <button class="qvb__btn qvb__btn--save" type="button" @click="save" :disabled="loading || !form.title.trim()">
          <span v-if="loading" class="qvb__spinner" />
          {{ loading ? "Сохранение…" : "Сохранить" }}
        </button>
      </div>

    </template>
  </div>
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
$red:       #ef4444;
$radius:    16px;
$radius-sm: 10px;

.qvb {
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: $card;
  border-radius: $radius;
  padding: 18px 18px 16px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);

  // ── Просмотр ──
  &__top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }

  &__hash {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px 10px;
    border-radius: 30px;
    color: $teal;
    background: $teal-soft;
    transition: background 0.15s;

    &:hover { background: rgba(78,190,194,0.2); }
  }

  &__hash-icon { font-size: 13px; flex-shrink: 0; }

  &__hash-code {
    font-size: 12px;
    font-family: monospace;
    letter-spacing: 0.04em;
  }

  &__copy-hint {
    font-size: 11px;
    color: $accent;
    font-weight: 600;
  }

  &__actions {
    display: flex;
    gap: 6px;
  }

  &__icon-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: $radius-sm;
    border: 1.5px solid $border;
    background: $bg;
    color: $muted;
    font-size: 18px;
    cursor: pointer;
    transition: all 0.15s;

    &:hover { border-color: $teal; color: $accent; background: $teal-soft; }
    &--danger:hover { border-color: #fca5a5; color: $red; background: rgba(239,68,68,0.06); }
  }

  &__description {
    font-size: 14px;
    color: #4F4F4F;
    margin: 0;
    line-height: 1.65;
  }

  &__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  &__meta-pill {
    font-size: 12px;
    color: $muted;
    background: $bg;
    border: 1px solid $border;
    border-radius: 30px;
    padding: 4px 12px;
  }

  // ── Редактирование ──
  &__edit-heading {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: $teal;
    margin: 0;
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  &__label {
    font-size: 12px;
    font-weight: 600;
    color: $accent;
  }

  &__input,
  &__textarea {
    background: $bg;
    border: 1.5px solid $border;
    border-radius: $radius-sm;
    color: $text;
    font-size: 14px;
    padding: 10px 12px;
    outline: none;
    width: 100%;
    box-sizing: border-box;
    font-family: inherit;
    transition: border-color 0.15s, box-shadow 0.15s;

    &:focus { border-color: $teal; box-shadow: 0 0 0 3px rgba(78,190,194,0.1); }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
    &::placeholder { color: rgba(0,0,0,0.2); }
  }

  &__input--short { width: 90px; }

  &__textarea {
    resize: vertical;
    min-height: 80px;
    line-height: 1.6;
  }

  &__presets {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }

  &__preset {
    padding: 5px 12px;
    border-radius: 30px;
    border: 1.5px solid $border;
    background: $bg;
    color: $muted;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    font-family: inherit;
    transition: all 0.15s;

    &--active { border-color: $teal; background: $teal-soft; color: $accent; font-weight: 700; }
    &:hover:not(:disabled):not(.qvb__preset--active) { border-color: $teal; color: $accent; }
    &:disabled { opacity: 0.4; cursor: not-allowed; }
  }

  &__time-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__time-unit { font-size: 12px; color: $muted; }
  &__time-hint { font-size: 12px; color: $accent; font-weight: 500; }

  &__error {
    font-size: 13px;
    color: $red;
    margin: 0;
    padding: 8px 12px;
    background: rgba(239,68,68,0.06);
    border-radius: $radius-sm;
    border: 1px solid rgba(239,68,68,0.15);
  }

  &__edit-actions {
    display: flex;
    gap: 8px;
    margin-top: 4px;
  }

  &__btn {
    flex: 1;
    height: 42px;
    border-radius: $radius-sm;
    border: none;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
    transition: all 0.15s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;

    &--cancel {
      background: $bg;
      color: $muted;
      border: 1.5px solid $border;
      &:hover:not(:disabled) { color: $text; border-color: rgba(0,0,0,0.15); }
    }

    &--save {
      background: linear-gradient(135deg, $teal, $accent);
      color: #fff;
      box-shadow: 0 3px 12px rgba(78,190,194,0.3);
      &:hover:not(:disabled) { opacity: 0.9; }
      &:disabled { opacity: 0.45; cursor: not-allowed; }
    }
  }

  &__spinner {
    width: 16px; height: 16px;
    border: 2px solid rgba(255,255,255,0.35);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
    flex-shrink: 0;
  }
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

@keyframes spin { to { transform: rotate(360deg); } }
</style>
