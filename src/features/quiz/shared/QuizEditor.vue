<script setup lang="ts">
import { ref, reactive } from "vue"
import { useQuiz } from "@/features/quiz/store.ts"
import type { QuizIn } from "@/features/quiz/types.ts"

const props = defineProps<{ quiz: QuizIn }>()

const emit = defineEmits<{
  saved:     [quiz: QuizIn]
  cancelled: []
}>()

const quizStore = useQuiz()
const loading   = ref(false)
const error     = ref("")

const form = reactive({
  title:       props.quiz.title,
  description: props.quiz.description,
  time_limit:  props.quiz.time_limit,
})

const presets = [
  { label: "5 мин",  value: 300  },
  { label: "15 мин", value: 900  },
  { label: "30 мин", value: 1800 },
  { label: "1 час",  value: 3600 },
]

function formatTime(s: number) {
  if (!s) return ""
  const m = Math.floor(s / 60), sec = s % 60
  if (m && sec) return `${m} мин ${sec} сек`
  if (m)        return `${m} мин`
  return `${sec} сек`
}

async function submit() {
  if (!form.title.trim()) { error.value = "Название не может быть пустым"; return }
  error.value = ""
  loading.value = true
  try {
    const updated = await quizStore.updateQuiz({
      id:          props.quiz.id,
      title:       form.title.trim(),
      description: form.description.trim(),
      time_limit:  form.time_limit,
    })
    emit("saved", updated)
  } catch (e: any) {
    error.value = e?.response?.data?.detail ?? e?.message ?? "Ошибка при сохранении"
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="qed">

    <p class="qed__heading">Редактирование викторины</p>

    <!-- Название -->
    <div class="qed__field">
      <label class="qed__label">Название</label>
      <input
          class="qed__input"
          v-model="form.title"
          type="text"
          placeholder="Название викторины"
          :disabled="loading"
          maxlength="120"
      />
    </div>

    <!-- Описание -->
    <div class="qed__field">
      <label class="qed__label">Описание</label>
      <textarea
          class="qed__textarea"
          v-model="form.description"
          rows="3"
          placeholder="Описание"
          :disabled="loading"
          maxlength="500"
      />
    </div>

    <!-- Лимит времени -->
    <div class="qed__field">
      <label class="qed__label">
        Лимит времени
        <span class="qed__optional">необязательно</span>
      </label>
      <div class="qed__presets">
        <button
            v-for="p in presets" :key="p.value"
            type="button"
            class="qed__preset"
            :class="{ 'qed__preset--active': form.time_limit === p.value }"
            :disabled="loading"
            @click="form.time_limit = form.time_limit === p.value ? 0 : p.value"
        >{{ p.label }}</button>
      </div>
      <div class="qed__time-row">
        <input
            class="qed__input qed__input--short"
            v-model.number="form.time_limit"
            type="number" min="0" step="60"
            :disabled="loading"
        />
        <span class="qed__time-unit">сек</span>
        <span class="qed__time-hint" v-if="form.time_limit > 0">= {{ formatTime(form.time_limit) }}</span>
        <span class="qed__time-hint qed__time-hint--muted" v-else>без ограничений</span>
      </div>
    </div>

    <p class="qed__error" v-if="error">{{ error }}</p>

    <div class="qed__actions">
      <button class="qed__btn qed__btn--cancel" type="button" @click="emit('cancelled')" :disabled="loading">
        Отмена
      </button>
      <button
          class="qed__btn qed__btn--save"
          type="button"
          @click="submit"
          :disabled="loading || !form.title.trim()"
      >
        <span v-if="loading" class="qed__spinner" />
        {{ loading ? "Сохранение…" : "Сохранить" }}
      </button>
    </div>

  </div>
</template>

<style scoped lang="scss">
$bg:        #F6F6F6;
$text:      #222222;
$muted:     #6B7280;
$border:    rgba(0, 0, 0, 0.08);
$accent:    #234970;
$teal:      #4EBEC2;
$teal-soft: rgba(78, 190, 194, 0.12);
$red:       #ef4444;
$r-md:      12px;
$r-sm:      8px;

.qed {
  display: flex;
  flex-direction: column;
  gap: 14px;
  animation: slide-in 0.18s ease;

  @keyframes slide-in {
    from { opacity: 0; transform: translateY(4px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  &__heading {
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: $teal;
    margin: 0;
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__label {
    font-size: 12px;
    font-weight: 600;
    color: $accent;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  &__optional {
    font-size: 11px;
    font-weight: 400;
    color: $muted;
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

    &::placeholder { color: rgba(0,0,0,0.22); }
    &:focus {
      border-color: $teal;
      box-shadow: 0 0 0 3px rgba(78,190,194,0.12);
    }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
  }

  &__textarea {
    resize: vertical;
    min-height: 80px;
    line-height: 1.6;
  }

  &__input--short { width: 90px; }

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
    transition: all 0.15s;
    font-family: inherit;

    &:hover:not(:disabled) { border-color: $teal; color: $accent; background: $teal-soft; }
    &--active { border-color: $teal; background: $teal-soft; color: $accent; font-weight: 700; }
    &:disabled { opacity: 0.45; cursor: not-allowed; }
  }

  &__time-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__time-unit { font-size: 12px; color: $muted; }

  &__time-hint {
    font-size: 12px;
    color: $accent;
    font-weight: 500;
    &--muted { color: $muted; font-weight: 400; }
  }

  &__error {
    color: $red;
    font-size: 13px;
    margin: 0;
    padding: 8px 12px;
    background: rgba(239,68,68,0.06);
    border-radius: $r-sm;
    border: 1px solid rgba(239,68,68,0.18);
  }

  &__actions {
    display: flex;
    gap: 8px;
    margin-top: 2px;
  }

  &__btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 9px 20px;
    border-radius: $r-sm;
    border: none;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
    transition: all 0.15s;

    &--cancel {
      background: $bg;
      color: $muted;
      border: 1.5px solid $border;
      &:hover:not(:disabled) { color: $text; border-color: rgba(0,0,0,0.15); }
    }

    &--save {
      background: linear-gradient(135deg, $teal 0%, $accent 100%);
      color: #fff;
      box-shadow: 0 3px 12px rgba(78,190,194,0.3);
      &:hover:not(:disabled) { opacity: 0.9; }
      &:disabled { opacity: 0.4; cursor: not-allowed; box-shadow: none; }
    }
  }

  &__spinner {
    width: 14px;
    height: 14px;
    border: 2px solid rgba(255,255,255,0.35);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
    flex-shrink: 0;
  }
}

@keyframes spin { to { transform: rotate(360deg); } }
</style>
