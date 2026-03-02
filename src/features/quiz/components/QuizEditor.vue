<script setup lang="ts">
import { ref, reactive } from "vue"
import { useQuiz } from "@/features/quiz/store.ts"
import type { QuizIn } from "@/features/quiz/types.ts"

const props = defineProps<{
  quiz: QuizIn
}>()

const emit = defineEmits<{
  saved: [quiz: QuizIn]
  cancelled: []
}>()

const quizStore = useQuiz()
const loading = ref(false)
const error = ref("")

const form = reactive({
  title:       props.quiz.title,
  description: props.quiz.description,
  time_limit:  props.quiz.time_limit,
})

async function submit() {
  if (!form.title.trim()) {
    error.value = "Название не может быть пустым"
    return
  }
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

    <label class="qed__field">
      <span class="qed__label">Название</span>
      <input
          class="qed__input"
          v-model="form.title"
          type="text"
          placeholder="Название викторины"
          :disabled="loading"
      />
    </label>

    <label class="qed__field">
      <span class="qed__label">Описание</span>
      <textarea
          class="qed__textarea"
          v-model="form.description"
          rows="3"
          placeholder="Описание"
          :disabled="loading"
      />
    </label>

    <label class="qed__field qed__field--row">
      <span class="qed__label">Ограничение времени (сек)</span>
      <input
          class="qed__input qed__input--short"
          v-model.number="form.time_limit"
          type="number"
          min="0"
          :disabled="loading"
      />
    </label>

    <p v-if="error" class="qed__error">{{ error }}</p>

    <div class="qed__actions">
      <button
          class="qed__btn qed__btn--cancel"
          type="button"
          @click="emit('cancelled')"
          :disabled="loading"
      >Отмена</button>
      <button
          class="qed__btn qed__btn--save"
          type="button"
          @click="submit"
          :disabled="loading || !form.title.trim()"
      >{{ loading ? "Сохранение…" : "Сохранить" }}</button>
    </div>
  </div>
</template>

<style scoped lang="scss">
$bg-light: #1e2d47;
$accent: #FFC02D;
$text: #e2e8f0;
$muted: rgba(226, 232, 240, 0.55);
$radius: 8px;

.qed {
  display: flex;
  flex-direction: column;
  gap: 14px;
  animation: fade-in 0.18s ease;

  @keyframes fade-in {
    from { opacity: 0; transform: translateY(4px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  &__heading {
    font-size: 13px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: $accent;
    margin: 0;
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: 6px;

    &--row {
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
    }
  }

  &__label {
    font-size: 12px;
    color: $muted;
  }

  &__input,
  &__textarea {
    background: #111c2e;
    border: 1.5px solid rgba(255, 255, 255, 0.08);
    border-radius: $radius;
    color: $text;
    font-size: 14px;
    padding: 9px 12px;
    outline: none;
    transition: border-color 0.15s;
    resize: vertical;
    font-family: inherit;
    width: 100%;
    box-sizing: border-box;

    &:focus { border-color: rgba(255, 192, 45, 0.5); }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
    &::placeholder { color: rgba(255,255,255,0.2); }
  }

  &__input--short {
    width: 100px;
  }

  &__error {
    color: #ff6b6b;
    font-size: 13px;
    margin: 0;
  }

  &__actions {
    display: flex;
    gap: 10px;
    margin-top: 4px;
  }

  &__btn {
    padding: 8px 20px;
    border-radius: $radius;
    border: none;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s, opacity 0.15s;

    &--cancel {
      background: rgba(255,255,255,0.06);
      color: $muted;
      &:hover:not(:disabled) { color: $text; }
    }

    &--save {
      background: $accent;
      color: #111827;
      &:hover:not(:disabled) { opacity: 0.88; }
      &:disabled { opacity: 0.45; cursor: not-allowed; }
    }
  }
}
</style>