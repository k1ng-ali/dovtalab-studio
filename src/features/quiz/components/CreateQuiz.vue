<script setup lang="ts">
import { reactive, ref } from "vue"
import { useQuiz } from "@/features/quiz/store.ts"
import type { QuizOut } from "@/features/quiz/types.ts"
import { useRouter } from "vue-router"

const quizStore = useQuiz()
const router = useRouter()
const loading = ref(false)
const error = ref("")

const form = reactive<QuizOut>({
  title:       "",
  description: "",
  time_limit:  0,
})

const isValid = () => form.title.trim() && form.description.trim()

async function submit() {
  if (!isValid() || loading.value) return
  error.value = ""
  loading.value = true
  try {
    const quiz = await quizStore.uploadQuiz(form)
    if (quiz) {
      await router.push({ name: "quiz-info", params: { quiz_id: quiz.id } })
    }
  } catch (e: any) {
    error.value = e?.response?.data?.detail ?? e?.message ?? "Ошибка при создании"
  } finally {
    loading.value = false
  }
}

// Форматирование лимита времени для отображения
function formatTime(seconds: number): string {
  if (!seconds) return ""
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m && s) return `${m} мин ${s} сек`
  if (m) return `${m} мин`
  return `${s} сек`
}

// Быстрые пресеты времени
const presets = [
  { label: "5 мин",  value: 300  },
  { label: "15 мин", value: 900  },
  { label: "30 мин", value: 1800 },
  { label: "1 час",  value: 3600 },
]
</script>

<template>
  <div class="page">

    <!-- ── Шапка ── -->
    <div class="page__header">
      <button class="page__back" type="button" @click="router.back()">
        ‹
      </button>
      <h1 class="page__title">Новая викторина</h1>
    </div>

    <!-- ── Форма ── -->
    <div class="form">

      <!-- Название -->
      <div class="form__field" :class="{ 'form__field--filled': form.title.trim() }">
        <label class="form__label">Название <span class="form__req">*</span></label>
        <input
            class="form__input"
            v-model="form.title"
            type="text"
            placeholder="Например: История России XIX века"
            :disabled="loading"
            maxlength="120"
        />
        <span class="form__counter">{{ form.title.length }}/120</span>
      </div>

      <!-- Описание -->
      <div class="form__field" :class="{ 'form__field--filled': form.description.trim() }">
        <label class="form__label">Описание <span class="form__req">*</span></label>
        <textarea
            class="form__textarea"
            v-model="form.description"
            rows="4"
            placeholder="Кратко опишите тему и цель викторины…"
            :disabled="loading"
            maxlength="500"
        />
        <span class="form__counter">{{ form.description.length }}/500</span>
      </div>

      <!-- Лимит времени -->
      <div class="form__field">
        <label class="form__label">
          Лимит времени
          <span class="form__optional">необязательно</span>
        </label>

        <!-- Пресеты -->
        <div class="form__presets">
          <button
              v-for="preset in presets"
              :key="preset.value"
              type="button"
              class="form__preset"
              :class="{ 'form__preset--active': form.time_limit === preset.value }"
              :disabled="loading"
              @click="form.time_limit = form.time_limit === preset.value ? 0 : preset.value"
          >
            {{ preset.label }}
          </button>
        </div>

        <!-- Ручной ввод -->
        <div class="form__time-row">
          <input
              class="form__input form__input--time"
              v-model.number="form.time_limit"
              type="number"
              min="0"
              step="60"
              placeholder="0"
              :disabled="loading"
          />
          <span class="form__time-unit">сек</span>
          <span class="form__time-hint" v-if="form.time_limit > 0">
            = {{ formatTime(form.time_limit) }}
          </span>
          <span class="form__time-hint form__time-hint--muted" v-else>
            без ограничений
          </span>
        </div>
      </div>

      <!-- Ошибка -->
      <p class="form__error" v-if="error">{{ error }}</p>

      <!-- Кнопка -->
      <button
          class="form__submit"
          :class="{ 'form__submit--active': isValid() && !loading }"
          type="button"
          :disabled="!isValid() || loading"
          @click="submit"
      >
        <span v-if="loading" class="form__spinner" />
        <span>{{ loading ? "Создание…" : "Создать викторину" }}</span>
      </button>

    </div>
  </div>
</template>

<style scoped lang="scss">
$bg:        #F6F6F6;
$card:      #ffffff;
$text:      #222222;
$muted:     #6B7280;
$border:    rgba(0, 0, 0, 0.08);
$accent:    #234970;
$teal:      #4EBEC2;
$teal-soft: rgba(78, 190, 194, 0.12);
$red:       #ef4444;
$radius:    16px;
$radius-sm: 10px;

// ── Страница ──────────────────────────────────────────────────────────────────
.page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  max-width: 560px;
  margin: 0 auto;
  padding: 20px 16px 100px;
  box-sizing: border-box;

  &__header {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  &__back {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 38px;
    border-radius: 50%;
    border: 1.5px solid $border;
    background: $card;
    color: $text;
    font-size: 22px;
    cursor: pointer;
    flex-shrink: 0;
    transition: background 0.15s, border-color 0.15s;
    box-shadow: 0 1px 4px rgba(0,0,0,0.06);
    line-height: 1;
    padding: 0 0 2px 0;

    &:hover { border-color: $teal; background: $teal-soft; }
    &:active { transform: scale(0.94); }
  }

  &__title {
    font-size: 20px;
    font-weight: 700;
    color: $text;
    margin: 0;
  }
}

// ── Форма ─────────────────────────────────────────────────────────────────────
.form {
  display: flex;
  flex-direction: column;
  gap: 14px;
  background: $card;
  border-radius: $radius;
  padding: 20px 18px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);

  &__field {
    display: flex;
    flex-direction: column;
    gap: 8px;
    position: relative;
  }

  &__label {
    font-size: 13px;
    font-weight: 600;
    color: $accent;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  &__req {
    color: $red;
    font-size: 14px;
  }

  &__optional {
    font-size: 11px;
    font-weight: 400;
    color: $muted;
  }

  &__input,
  &__textarea {
    width: 100%;
    background: $bg;
    border: 1.5px solid $border;
    border-radius: $radius-sm;
    color: $text;
    font-size: 15px;
    padding: 12px 14px;
    outline: none;
    box-sizing: border-box;
    font-family: inherit;
    transition: border-color 0.15s, box-shadow 0.15s;

    &::placeholder { color: rgba(0,0,0,0.25); }
    &:focus {
      border-color: $teal;
      box-shadow: 0 0 0 3px rgba(78, 190, 194, 0.12);
    }
    &:disabled { opacity: 0.55; cursor: not-allowed; }
  }

  &__textarea {
    resize: vertical;
    min-height: 100px;
    line-height: 1.6;
  }

  &__input--time {
    width: 100px;
    flex-shrink: 0;
  }

  &__counter {
    position: absolute;
    right: 12px;
    bottom: 10px;
    font-size: 11px;
    color: rgba(0,0,0,0.2);
    pointer-events: none;
  }

  // ── Пресеты ──
  &__presets {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  &__preset {
    padding: 6px 14px;
    border-radius: 30px;
    border: 1.5px solid $border;
    background: $bg;
    color: $muted;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;
    font-family: inherit;

    &:hover:not(:disabled) {
      border-color: $teal;
      color: $accent;
      background: $teal-soft;
    }

    &--active {
      border-color: $teal;
      background: $teal-soft;
      color: $accent;
      font-weight: 700;
    }

    &:disabled { opacity: 0.45; cursor: not-allowed; }
  }

  // ── Строка времени ──
  &__time-row {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  &__time-unit {
    font-size: 13px;
    color: $muted;
    flex-shrink: 0;
  }

  &__time-hint {
    font-size: 13px;
    color: $accent;
    font-weight: 500;

    &--muted { color: $muted; font-weight: 400; }
  }

  // ── Ошибка ──
  &__error {
    color: $red;
    font-size: 13px;
    margin: 0;
    padding: 10px 14px;
    background: rgba(239, 68, 68, 0.06);
    border-radius: $radius-sm;
    border: 1px solid rgba(239, 68, 68, 0.2);
  }

  // ── Кнопка submit ──
  &__submit {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    height: 50px;
    border-radius: $radius-sm;
    border: none;
    background: rgba(0,0,0,0.07);
    color: rgba(0,0,0,0.3);
    font-size: 15px;
    font-weight: 700;
    font-family: inherit;
    cursor: not-allowed;
    transition: all 0.2s;
    margin-top: 4px;

    &--active {
      background: linear-gradient(135deg, $teal 0%, $accent 100%);
      color: #fff;
      cursor: pointer;
      box-shadow: 0 4px 16px rgba(78, 190, 194, 0.35);

      &:hover  { opacity: 0.92; }
      &:active { transform: scale(0.98); }
    }
  }

  // ── Спиннер ──
  &__spinner {
    width: 18px;
    height: 18px;
    border: 2px solid rgba(255,255,255,0.35);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
    flex-shrink: 0;
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>