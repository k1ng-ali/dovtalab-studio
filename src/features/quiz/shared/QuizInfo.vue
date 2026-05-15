<script setup lang="ts">
import { onMounted, ref } from "vue"
import { useQuiz } from "@/features/quiz/store.ts"
import type { QuizIn } from "@/features/quiz/types.ts"
import QuizView from "@/features/quiz/shared/QuizView.vue"
import QuestionList from "@/features/quiz/shared/QuestionList.vue"

const props = defineProps<{ quiz_id: number }>()

const quizStore = useQuiz()
const quiz = ref<QuizIn | null>(null)
const loading = ref(true)

onMounted(async () => {
  try {
    quiz.value = quizStore.quiz(props.quiz_id)
    if (!quiz.value) {
      quiz.value = await quizStore.fetchQuiz(props.quiz_id)
    }
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="page">

    <template v-if="loading">
      <div class="skeleton skeleton--header" />
      <div class="skeleton skeleton--body" />
    </template>

    <template v-else-if="quiz">
      <QuizView :quiz_id="quiz_id" />
      <QuestionList :quiz_id="quiz_id" />
    </template>

    <div v-else class="page__error">
      Викторина не найдена
    </div>

  </div>
</template>

<style scoped lang="scss">
.page {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  padding: 16px 16px 100px;
  box-sizing: border-box;

  &__error {
    text-align: center;
    padding: 60px 0;
    color: #6B7280;
    font-size: 15px;
  }
}

.skeleton {
  border-radius: 16px;
  background: linear-gradient(
          90deg,
          rgba(0,0,0,0.04) 25%,
          rgba(0,0,0,0.07) 50%,
          rgba(0,0,0,0.04) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;

  &--header { height: 130px; }
  &--body   { height: 300px; }
}

@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
