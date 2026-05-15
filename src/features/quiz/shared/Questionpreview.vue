<script setup lang="ts">
import type { QuestionIn } from "@/features/quiz/types.ts"
import { FlPenSparkle, McDelete2Line } from "@kalimahapps/vue-icons"

const props = defineProps<{
  question: QuestionIn
  index: number
}>()

const emit = defineEmits<{
  edit: []
  delete: []
  close: []
}>()

const TYPE_LABELS: Record<string, string> = {
  single_choice:   "Один ответ",
  multiple_choice: "Несколько ответов",
  matching:        "Соответствие",
  input:           "Ввод текста",
}

const p = props.question.payload
const sc = p.single_choice
const mc = p.multiple_choice
const mt = p.matching
const inp = p.input
</script>

<template>
  <div class="qp">

    <!-- Header -->
    <div class="qp__header">
      <div class="qp__meta">
        <span class="qp__index">{{ index }}</span>
        <span class="qp__type-badge">{{ TYPE_LABELS[question.type] }}</span>
      </div>
      <div class="qp__actions">
        <button class="qp__btn qp__btn--edit" type="button" @click="emit('edit')" title="Редактировать">
          <FlPenSparkle />
        </button>
        <button class="qp__btn qp__btn--delete" type="button" @click="emit('delete')" title="Удалить">
          <McDelete2Line />
        </button>
        <button class="qp__btn qp__btn--close" type="button" @click="emit('close')" title="Закрыть">✕</button>
      </div>
    </div>

    <!-- Question text -->
    <p class="qp__text">{{ question.text }}</p>

    <!-- Image -->
    <div v-if="question.image_url" class="qp__image-wrap">
      <img :src="question.image_url" alt="Изображение к вопросу" class="qp__image" />
    </div>

    <div class="qp__divider" />

    <!-- ── Single choice ── -->
    <div v-if="question.type === 'single_choice' && sc" class="qp__body">
      <p class="qp__section-label">Варианты ответа</p>
      <ul class="qp__options">
        <li
            v-for="opt in sc.options"
            :key="opt.id"
            class="qp__option"
            :class="{ 'qp__option--correct': opt.id === sc.correct }"
        >
          <span class="qp__option-mark">
            <span class="qp__radio" :class="{ 'qp__radio--checked': opt.id === sc.correct }"></span>
          </span>
          <span class="qp__option-text">{{ opt.text }}</span>
          <span v-if="opt.id === sc.correct" class="qp__correct-tag">✓ Правильный</span>
          <span v-if="opt.explanation" class="qp__explanation">{{ opt.explanation }}</span>
        </li>
      </ul>
      <p v-if="sc.shuffle" class="qp__hint">↺ Варианты перемешиваются</p>
    </div>

    <!-- ── Multiple choice ── -->
    <div v-else-if="question.type === 'multiple_choice' && mc" class="qp__body">
      <p class="qp__section-label">Варианты ответа</p>
      <ul class="qp__options">
        <li
            v-for="opt in mc.options"
            :key="opt.id"
            class="qp__option"
            :class="{ 'qp__option--correct': mc.correct.includes(opt.id) }"
        >
          <span class="qp__option-mark">
            <span class="qp__checkbox" :class="{ 'qp__checkbox--checked': mc.correct.includes(opt.id) }"></span>
          </span>
          <span class="qp__option-text">{{ opt.text }}</span>
          <span v-if="mc.correct.includes(opt.id)" class="qp__correct-tag">✓</span>
          <span v-if="opt.explanation" class="qp__explanation">{{ opt.explanation }}</span>
        </li>
      </ul>
      <div class="qp__mc-meta">
        <span class="qp__pill">Мин: {{ mc.min_choices }}</span>
        <span class="qp__pill">Макс: {{ mc.max_choices }}</span>
        <span v-if="mc.partial_scoring" class="qp__pill qp__pill--accent">Частичный балл</span>
        <span v-if="mc.shuffle" class="qp__pill">↺ Перемешивать</span>
      </div>
    </div>

    <!-- ── Matching ── -->
    <div v-else-if="question.type === 'matching' && mt" class="qp__body">
      <p class="qp__section-label">Соответствия</p>
      <div class="qp__matching">
        <div
            v-for="leftItem in mt.left"
            :key="leftItem.id"
            class="qp__match-row"
        >
          <span class="qp__match-cell qp__match-cell--left">{{ leftItem.text }}</span>
          <span class="qp__match-arrow">→</span>
          <span class="qp__match-cell qp__match-cell--right">
            {{ mt!.right.find(r => r.id === mt!.pairs[leftItem.id])?.text ?? '—' }}
          </span>
        </div>
      </div>
      <div class="qp__mc-meta">
        <span v-if="mt.shuffle_left" class="qp__pill">↺ Левые</span>
        <span v-if="mt.shuffle_right" class="qp__pill">↺ Правые</span>
      </div>
    </div>

    <!-- ── Input ── -->
    <div v-else-if="question.type === 'input' && inp" class="qp__body">
      <p class="qp__section-label">Правильные ответы</p>
      <ul class="qp__input-answers">
        <li v-for="(ans, i) in inp.answers" :key="i" class="qp__input-answer">
          <span class="qp__input-value">{{ ans.value }}</span>
          <template v-if="ans.aliases.length">
            <span class="qp__alias-label">Псевдонимы:</span>
            <div class="qp__aliases">
              <span v-for="(alias, j) in ans.aliases" :key="j" class="qp__alias">{{ alias }}</span>
            </div>
          </template>
        </li>
      </ul>
      <div class="qp__mc-meta">
        <span v-if="inp.case_sensitive" class="qp__pill">Aa Регистр важен</span>
        <span v-if="inp.trim" class="qp__pill">⇥ Trim</span>
        <span v-if="inp.normalize_space" class="qp__pill">Нормализация пробелов</span>
        <span v-if="inp.numeric" class="qp__pill qp__pill--accent">Числовой · ±{{ inp.tolerance }}</span>
      </div>
    </div>

  </div>
</template>

<style scoped lang="scss">
@use "@/shared/styles/tokens" as *;

.qp {
  display: flex;
  flex-direction: column;
  gap: 16px;
  animation: qp-in 0.2s ease;

  @keyframes qp-in {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  &__index {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: rgba(35, 73, 112, 0.37);
    color: #4F4F4F;
    font-size: 13px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &__type-badge {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: #234970;
    background: rgba(35, 73, 112, 0.3);
    padding: 3px 10px;
    border-radius: 20px;
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  &__btn {
    background: none;
    border: none;
    cursor: pointer;
    width: 32px;
    height: 32px;
    border-radius: $r-sm;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    transition: background 0.15s, color 0.15s;
    color: #4F4F4F;

    &:hover { background: rgba(255,255,255,0.3); }

    &--edit:hover  { color: #234970; }
    &--delete:hover { color: #ff6b6b; }
    &--close {
      font-size: 13px;
      &:hover { color: #4F4F4F; }
    }
  }

  &__text {
    font-size: 16px;
    font-weight: 600;
    line-height: 1.55;
    margin: 0;
  }

  &__image-wrap {
    border-radius: $r-md;
    overflow: hidden;
    border: 1.5px solid rgba(255,255,255,0.08);
    max-width: 400px;
  }

  &__image {
    display: block;
    width: 100%;
    max-height: 240px;
    object-fit: cover;
  }

  &__divider {
    height: 1px;
    background: rgba(255,255,255,0.06);
    margin: 0;
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  &__section-label {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: #4F4F4F;
    margin: 0;
  }

  &__options {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  &__option {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    background: $bg-subtle;
    border-radius: $r-sm;
    padding: 10px 12px;
    border: $border-md 1px solid;
    flex-wrap: wrap;
    transition: border-color 0.15s, background 0.15s;

    &--correct {
      background: $green-soft;
      border-color: rgba(52, 211, 153, 0.25);
    }
  }

  &__option-mark {
    padding-top: 2px;
    flex-shrink: 0;
  }

  &__radio,
  &__checkbox {
    display: block;
    width: 16px;
    height: 16px;
    border: 2px solid #6B7280;
    background: transparent;
    transition: border-color 0.15s;

    &--checked {
      border-color: $green;
      background: $green;
      position: relative;

      &::after {
        content: '';
        position: absolute;
        inset: 2px;
        background: #234970;
      }
    }
  }

  &__radio {
    border-radius: 50%;
    &--checked::after { border-radius: 50%; }
  }

  &__checkbox {
    border-radius: 3px;
    &--checked::after {
      border-radius: 1px;
      background: transparent;
      inset: 1px 2px;
      border-left: 2px solid #fff;
      border-bottom: 2px solid #fff;
      transform: rotate(-45deg) translateY(-2px);
    }
  }

  &__option-text {
    flex: 1;
    font-size: 14px;
    color: #1F2937;
    min-width: 0;
  }

  &__correct-tag {
    font-size: 11px;
    font-weight: 600;
    color: $green;
    flex-shrink: 0;
  }

  &__explanation {
    width: 100%;
    font-size: 12px;
    color: $muted;
    padding-left: 26px;
    font-style: italic;
  }

  &__hint {
    font-size: 12px;
    color: $muted;
    margin: 0;
  }

  &__mc-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  &__pill {
    font-size: 11px;
    color: $muted;
    background: $bg;
    border-radius: 20px;
    padding: 3px 10px;
    border: 1px solid rgba(255,255,255,0.07);

    &--accent {
      color: $accent;
      background: $accent-soft;
      border-color: rgba(255,192,45,0.2);
    }
  }

  // ── Matching ──
  &__matching {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  &__match-row {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  &__match-cell {
    flex: 1;
    font-size: 14px;
    color: $text;
    background: $bg;
    border-radius: $r-sm;
    padding: 8px 12px;
    min-width: 0;

    &--right {
      color: $green;
      background: $green-soft;
    }
  }

  &__match-arrow {
    color: $accent;
    font-size: 16px;
    flex-shrink: 0;
  }

  // ── Input ──
  &__input-answers {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__input-answer {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  &__input-value {
    font-size: 14px;
    font-weight: 600;
    color: $green;
    background: $green-soft;
    border-radius: $r-sm;
    padding: 8px 12px;
    border: 1px solid rgba(52,211,153,0.2);
  }

  &__alias-label {
    font-size: 11px;
    color: $muted;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  &__aliases {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  &__alias {
    font-size: 13px;
    color: $muted;
    background: $bg;
    border-radius: $r-sm;
    padding: 4px 10px;
    border: 1px solid rgba(255,255,255,0.07);
  }
}
</style>