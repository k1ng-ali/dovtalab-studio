<script setup lang="ts">
import { ref, reactive } from "vue"
import { useQuiz } from "@/features/quiz/store.ts"
import type { ContextIn } from "@/features/quiz/types.ts"

const props = defineProps<{
  quiz_id: number
  order: number
  /** Если передан — режим редактирования */
  context?: ContextIn
}>()

const emit = defineEmits<{
  saved: [context: ContextIn]
  cancelled: []
}>()

const quizStore = useQuiz()
const loading = ref(false)
const error = ref("")
const isEdit = !!props.context

const form = reactive({
  title: props.context?.title ?? "",
  text:  props.context?.text  ?? "",
  rule:  props.context?.rule  ?? "",
})

async function submit() {
  if (!form.title.trim() || !form.text.trim()) {
    error.value = "Заполните название и текст контекста"
    return
  }
  error.value = ""
  loading.value = true
  try {
    let result: ContextIn
    if (isEdit && props.context) {
      result = await quizStore.updateContext({
        id:    props.context.id,
        title: form.title.trim(),
        text:  form.text.trim(),
        rule:  form.rule.trim() || undefined,
      })
    } else {
      result = await quizStore.createContext({
        quiz_id: props.quiz_id,
        title:   form.title.trim(),
        text:    form.text.trim(),
        rule:    form.rule.trim() || undefined,
        order:   props.order,
      })
    }
    emit("saved", result)
  } catch (e: any) {
    error.value = e?.response?.data?.detail ?? e?.message ?? "Ошибка при сохранении"
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="ce">
    <p class="ce__heading">{{ isEdit ? "Редактировать контекст" : "Новый контекст" }}</p>

    <label class="ce__field">
      <span class="ce__label">Название <span class="ce__req">*</span></span>
      <input
          class="ce__input"
          v-model="form.title"
          type="text"
          placeholder="Например: Прочитайте текст и ответьте на вопросы"
          :disabled="loading"
      />
    </label>

    <label class="ce__field">
      <span class="ce__label">Текст контекста <span class="ce__req">*</span></span>
      <textarea
          class="ce__textarea"
          v-model="form.text"
          rows="5"
          placeholder="Текст, который будет показан перед группой вопросов…"
          :disabled="loading"
      />
    </label>

    <label class="ce__field">
      <span class="ce__label">Правило <span class="ce__optional">(необязательно)</span></span>
      <input
          class="ce__input"
          v-model="form.rule"
          type="text"
          placeholder="Например: Выберите один правильный ответ"
          :disabled="loading"
      />
    </label>

    <p v-if="error" class="ce__error">{{ error }}</p>

    <div class="ce__actions">
      <button
          class="ce__btn ce__btn--cancel"
          type="button"
          @click="emit('cancelled')"
          :disabled="loading"
      >Отмена</button>
      <button
          class="ce__btn ce__btn--save"
          type="button"
          @click="submit"
          :disabled="loading || !form.title.trim() || !form.text.trim()"
      >{{ loading ? "Сохранение…" : (isEdit ? "Сохранить" : "Создать контекст") }}</button>
    </div>
  </div>
</template>

<style scoped lang="scss">
$bg: #111c2e;
$accent: #FFC02D;
$accent-dim: rgba(255, 192, 45, 0.1);
$text: #e2e8f0;
$muted: rgba(226, 232, 240, 0.55);
$radius: 8px;

.ce {
  display: flex;
  flex-direction: column;
  gap: 14px;
  animation: ce-in 0.18s ease;

  @keyframes ce-in {
    from { opacity: 0; transform: translateY(4px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  &__heading {
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: $accent;
    margin: 0;
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  &__label {
    font-size: 12px;
    color: $muted;
  }

  &__req { color: #ff6b6b; }
  &__optional { opacity: 0.6; }

  &__input,
  &__textarea {
    background: $bg;
    border: 1.5px solid rgba(255,255,255,0.08);
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

    &:focus { border-color: rgba(255,192,45,0.5); }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
    &::placeholder { color: rgba(255,255,255,0.18); }
  }

  &__error {
    color: #ff6b6b;
    font-size: 13px;
    margin: 0;
  }

  &__actions {
    display: flex;
    gap: 10px;
    margin-top: 2px;
  }

  &__btn {
    padding: 8px 20px;
    border-radius: $radius;
    border: none;
    font-size: 13px;
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
      &:disabled { opacity: 0.4; cursor: not-allowed; }
    }
  }
}
</style>