<script setup lang="ts">
import { onMounted, ref } from "vue"
import { useQuiz } from "@/features/quiz/store.ts"
import { useRouter } from "vue-router"
import type { QuizIn } from "@/features/quiz/types.ts"
import QuestionList from "@/features/quiz/components/QuestionList.vue"

const props = defineProps<{
  quiz_id: number
}>()

const quizStore = useQuiz()
const router = useRouter()
const quiz = ref<QuizIn | null>(null)

onMounted(async () => {
  quiz.value = quizStore.quiz(props.quiz_id)
  if (!quiz.value) {
    // Попробовать загрузить если нет в сторе
    quiz.value = await quizStore.fetchQuiz(props.quiz_id)
  }
})
</script>

<template>
  <div class="qp">
    <div class="qp__back" @click="router.back()">← Назад</div>

    <div v-if="quiz">
      <h2 class="qp__title">{{ quiz.title }}</h2>
      <p class="qp__desc">{{ quiz.description }}</p>

      <div class="qp__divider" />

      <QuestionList :quiz_id="quiz_id" />
    </div>

    <div v-else class="qp__loading">Загрузка…</div>
  </div>
</template>

<style scoped lang="scss">
$text: #e2e8f0;
$muted: rgba(226, 232, 240, 0.6);

.qp {
  display: flex;
  flex-direction: column;
  gap: 16px;
  color: $text;

  &__back {
    color: $muted;
    cursor: pointer;
    font-size: 13px;
    width: max-content;

    &:hover {
      color: $text;
    }
  }

  &__title {
    font-size: 22px;
    font-weight: 700;
    margin: 0 0 6px;
  }

  &__desc {
    color: $muted;
    font-size: 14px;
    margin: 0;
  }

  &__divider {
    height: 1px;
    background: rgba(255,255,255,0.08);
    margin: 8px 0;
  }

  &__loading {
    color: $muted;
    font-size: 14px;
    padding: 40px 0;
    text-align: center;
  }
}
</style>