<script setup lang="ts">
import QuestionList from "@/features/quiz/components/QuestionList.vue";
import {useQuiz} from "@/features/quiz/store.ts";
import type {ContextIn, QuizIn, QuizUpdateOut} from "@/features/quiz/types.ts";
import {computed, reactive, ref, onMounted} from "vue";
import {useRouter} from "vue-router";
import QuizView from "@/features/quiz/components/QuizView.vue";


const quizStore = useQuiz();

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

</style>