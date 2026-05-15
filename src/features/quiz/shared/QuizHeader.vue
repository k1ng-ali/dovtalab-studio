<script setup lang="ts">
import { ref, reactive } from "vue"
import { useQuiz } from "@/features/quiz/store.ts"
import type { QuizIn } from "@/features/quiz/types.ts"
import { IoOutlineCopy, ByEdit, McDelete2Line } from "@kalimahapps/vue-icons"
import { useRouter } from "vue-router"

const props = defineProps<{ quiz: QuizIn }>()

const emit = defineEmits<{
  updated: [quiz: QuizIn]
  deleted: []
}>()

const quizStore  = useQuiz()
const router     = useRouter()
const isEditing  = ref(false)
const loading    = ref(false)
const error      = ref("")
const copyHint   = ref(false)

const form = reactive({
  title:       props.quiz.title,
  description: props.quiz.description,
  time_limit:  props.quiz.time_limit,
})

// Синхронизируем форму если props меняется
function resetForm() {
  form.title       = props.quiz.title
  form.description = props.quiz.description
  form.time_limit  = props.quiz.time_limit
  error.value = ""
}

function startEdit() {
  resetForm()
  isEditing.value = true
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

async function onDelete() {
  if (!confirm(`Удалить викторину «${props.quiz.title}»?`)) return
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

function formatTime(s: number) {
  if (!s) return "без лимита"
  const m = Math.floor(s / 60)
  const sec = s % 60
  if (m && sec) return `${m} мин ${sec} сек`
  if (m) return `${m} мин`
  return `${sec} сек`
}

const timePresets = [
  { label: "5 мин",  value: 300  },
  { label: "15 мин", value: 900  },
  { label: "30 мин", value: 1800 },
  { label: "1 час",  value: 3600 },
]
</script>

<template>
  <div class="qh" :class="{ 'qh--editing': isEditing }">

    <!-- ── VIEW MODE ─────────────────────────────────────────── -->
    <template v-if="!isEditing">
      <div class="qh__top">
        <button class="qh__back" type="button" @click="router.push({ name: 'my-quizzes' })">‹</button>
        <h2 class="qh__title">{{ quiz.title }}</h2>
        <div class="qh__actions">
          <button class="qh__icon-btn" type="button" @click="startEdit" title="Редактировать">
            <ByEdit />
          </button>
          <button class="qh__icon-btn qh__icon-btn--danger" type="button" @click="onDelete" title="Удалить">
            <McDelete2Line />
          </button>
        </div>
      </div>

      <p class="qh__desc" v-if="quiz.description">{{ quiz.description }}</p>

      <div class="qh__meta">
        <button class="qh__hash" type="button" @click="copyHash">
          <IoOutlineCopy class="qh__hash-icon" />
          <span>{{ quiz.hash_code }}</span>
          <span v-if="copyHint" class="qh__copy-hint">Скопировано!</span>
        </button>
        <span class="qh__dot">·</span>
        <span class="qh__meta-item">⏱ {{ formatTime(quiz.time_limit) }}</span>
        <span class="qh__dot">·</span>
        <span class="qh__meta-item">📅 {{ formatDate(quiz.created_at) }}</span>
      </div>
    </template>

    <!-- ── EDIT MODE ─────────────────────────────────────────── -->
    <template v-else>
      <div class="qh__edit-heading">
        <span class="qh__edit-label">Редактирование</span>
      </div>

      <div class="qh__field">
        <label class="qh__flabel">Название</label>
        <input
          class="qh__input"
          v-model="form.title"
          type="text"
          placeholder="Название викторины"
          :disabled="loading"
        />
      </div>

      <div class="qh__field">
        <label class="qh__flabel">Описание</label>
        <textarea
          class="qh__textarea"
          v-model="form.description"
          rows="3"
          placeholder="Описание"
          :disabled="loading"
        />
      </div>

      <div class="qh__field">
        <label class="qh__flabel">Лимит времени</label>
        <div class="qh__presets">
          <button
            v-for="p in timePresets" :key="p.value"
            type="button"
            class="qh__preset"
            :class="{ 'qh__preset--active': form.time_limit === p.value }"
            @click="form.time_limit = form.time_limit === p.value ? 0 : p.value"
            :disabled="loading"
          >{{ p.label }}</button>
        </div>
        <div class="qh__time-row">
          <input class="qh__input qh__input--xs" v-model.number="form.time_limit"
            type="number" min="0" step="60" :disabled="loading" />
          <span class="qh__time-unit">сек = {{ formatTime(form.time_limit) }}</span>
        </div>
      </div>

      <p v-if="error" class="qh__error">{{ error }}</p>

      <div class="qh__edit-actions">
        <button class="qh__btn qh__btn--cancel" type="button"
          @click="isEditing = false" :disabled="loading">
          Отмена
        </button>
        <button class="qh__btn qh__btn--save" type="button"
          @click="save" :disabled="loading || !form.title.trim()">
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
$text-2:    #4B5563;
$muted:     #9CA3AF;
$accent:    #234970;
$teal:      #4EBEC2;
$teal-soft: rgba(78, 190, 194, 0.12);
$teal-bdr:  rgba(78, 190, 194, 0.3);
$border:    rgba(0, 0, 0, 0.07);
$red:       #EF4444;
$r-md:      14px;
$r-sm:      10px;

.qh {
  background: $card;
  border-radius: 18px;
  padding: 18px 18px 16px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: box-shadow 0.2s;

  &--editing {
    box-shadow: 0 4px 20px rgba(78,190,194,0.15);
    border: 1.5px solid $teal-bdr;
  }

  // ── View ──
  &__top {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  &__back {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    border: 1.5px solid $border;
    background: $bg;
    color: $text;
    font-size: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    flex-shrink: 0;
    padding: 0 0 2px;
    transition: border-color 0.15s, background 0.15s;

    &:hover { border-color: $teal; background: $teal-soft; }
    &:active { transform: scale(0.93); }
  }

  &__title {
    flex: 1;
    font-size: 18px;
    font-weight: 700;
    color: $text;
    margin: 0;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__actions {
    display: flex;
    gap: 4px;
    flex-shrink: 0;
  }

  &__icon-btn {
    width: 34px;
    height: 34px;
    border-radius: $r-sm;
    border: 1.5px solid $border;
    background: $bg;
    color: $text-2;
    font-size: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.15s;

    &:hover { border-color: $teal; color: $accent; background: $teal-soft; }
    &--danger:hover { border-color: $red; color: $red; background: rgba(239,68,68,0.06); }
  }

  &__desc {
    font-size: 14px;
    color: $text-2;
    margin: 0;
    line-height: 1.6;
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  &__hash {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    background: none;
    border: none;
    padding: 0;
    color: $muted;
    font-size: 12px;
    font-family: monospace;
    cursor: pointer;
    transition: color 0.15s;

    &:hover { color: $accent; }
  }

  &__hash-icon { font-size: 13px; }

  &__copy-hint {
    font-size: 11px;
    color: $teal;
    animation: fade-pop 1.8s ease forwards;
  }

  &__dot { color: rgba(0,0,0,0.15); font-size: 12px; }

  &__meta-item {
    font-size: 12px;
    color: $muted;
  }

  // ── Edit ──
  &__edit-heading {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__edit-label {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: $teal;
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  &__flabel {
    font-size: 12px;
    font-weight: 600;
    color: $accent;
  }

  &__input,
  &__textarea {
    background: $bg;
    border: 1.5px solid $border;
    border-radius: $r-sm;
    color: $text;
    font-size: 14px;
    padding: 10px 12px;
    outline: none;
    width: 100%;
    box-sizing: border-box;
    font-family: inherit;
    transition: border-color 0.15s, box-shadow 0.15s;

    &:focus { border-color: $teal; box-shadow: 0 0 0 3px $teal-soft; }
    &:disabled { opacity: 0.5; }
    &::placeholder { color: rgba(0,0,0,0.2); }
  }

  &__textarea { resize: vertical; min-height: 80px; line-height: 1.6; }
  &__input--xs { width: 90px; }

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

    &:hover:not(:disabled) { border-color: $teal; color: $accent; background: $teal-soft; }
    &--active { border-color: $teal; background: $teal-soft; color: $accent; font-weight: 700; }
    &:disabled { opacity: 0.45; }
  }

  &__time-row {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  &__time-unit {
    font-size: 12px;
    color: $muted;
  }

  &__error {
    color: $red;
    font-size: 13px;
    margin: 0;
    padding: 8px 12px;
    background: rgba(239,68,68,0.06);
    border-radius: $r-sm;
  }

  &__edit-actions {
    display: flex;
    gap: 8px;
    margin-top: 4px;
  }

  &__btn {
    flex: 1;
    height: 42px;
    border-radius: $r-sm;
    border: none;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
    transition: all 0.15s;

    &--cancel {
      background: $bg;
      color: $muted;
      border: 1.5px solid $border;
      &:hover:not(:disabled) { color: $text; }
    }

    &--save {
      background: linear-gradient(135deg, $teal, $accent);
      color: #fff;
      box-shadow: 0 3px 12px rgba(78,190,194,0.3);
      &:hover:not(:disabled) { opacity: 0.92; }
      &:disabled { opacity: 0.4; cursor: not-allowed; }
    }
  }
}

@keyframes fade-pop {
  0%   { opacity: 0; transform: translateY(-2px); }
  15%  { opacity: 1; transform: translateY(0); }
  80%  { opacity: 1; }
  100% { opacity: 0; }
}
</style>
