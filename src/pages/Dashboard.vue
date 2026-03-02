<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { http } from "@/shared/api/http"

const quizzes = ref([])

onMounted(async () => {
  const { data } = await http.get('/quizzes')
  quizzes.value = data
})
</script>

<template>
  <div>
    <h1>My Quizzes</h1>

    <div v-for="quiz in quizzes" :key="quiz.id">
      <router-link :to="`/quiz/${quiz.id}`">
        {{ quiz.title }}
      </router-link>
    </div>
  </div>
</template>
