<script setup lang="ts">
import QuestionList from "@/features/quiz/components/QuestionList.vue";
import {onMounted} from "vue";
import QuizView from "@/features/quiz/components/QuizView.vue";


//const quizStore = useQuiz();

const props = defineProps<{
  quiz_id: number;
}>()

onMounted(async () => {

})

</script>

<template>
  <div class="container">
    <h1 class="qe-title">Викторина</h1>
    <QuizView :quiz_id="props.quiz_id"/>
    <QuestionList :quiz_id="quiz_id" />
  </div>
</template>

<style scoped lang="scss">
.container {
  width: 100%;
}
</style>