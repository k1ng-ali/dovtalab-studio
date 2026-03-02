<script setup lang="ts">
import {useQuiz} from "@/features/quiz/store.ts";
import {storeToRefs} from "pinia";
import {onMounted} from "vue";

const quizStore = useQuiz();
const { quizzes } = storeToRefs(quizStore)

onMounted(async () => {
  try {
    await quizStore.fetchQuizzes()
    console.log("quizzes:", quizzes.value)
  } catch (e) {
    console.error(e)
  }
})


</script>

<template>
    <div class="container">
      <div class="header">
        <h2 class="title">Викторины</h2>
        <router-link to= "/create-quiz" class="btn create-btn">
          Создать викторину
        </router-link>
      </div>
      <div class="wrapper">
        <div class="quiz-grid" v-if="quizzes.length > 0">
          <router-link :to="{
            name: 'quiz info',
            params: {quiz_id: quiz.id}
          }"
              class="quiz-grid-item"
              v-for="quiz in quizzes"
              :key="quiz.id">
            <div class="inline">
              <h3 class="quiz-title">
                {{quiz.title}}
              </h3>
            </div>
            <p class="quiz-description">
              {{ quiz.description }}
            </p>
            <p class="quiz-created-data">
              {{ quiz.created_at }}
            </p>
          </router-link>
        </div>
        <div v-else class="nothing">
          Ничего нет
        </div>
      </div>
    </div>
</template>

<style scoped lang="scss">
.container {
  background: #111827;
  height: calc(100% - 80px); // фиксированная высота
  padding: 40px;
  color: white;

  display: flex;
  flex-direction: column;
  overflow: hidden; // важно!
}


.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  flex-shrink: 0; // чтобы не сжимался
  position: sticky;
  top: 0;
  background: rgba(17, 24, 39, 0.2);
  backdrop-filter: blur(4px);
  z-index: 10;
}


.title {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 30px;
}

.wrapper {
  flex: 1; // занимает всё оставшееся место
  overflow-y: auto; // включаем scroll
  scrollbar-width: none; /* для Firefox */

  &::-webkit-scrollbar {
    display: none; /* для Chrome, Edge, Safari */
  }
}

.quiz-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.quiz-grid-item {
  background: #1F2937;
  padding: 20px;
  border-radius: 16px;
  transition: 0.25s ease;
  cursor: pointer;
  border: 1px solid transparent;
  text-decoration: none;

  &:hover {
    background: #273549;
    transform: translateY(-4px);
    border: 1px solid rgba(255, 192, 45, 0.3);
  }

  & .inline{
    display: flex;
    width: 100%;
    justify-content: space-between;
    align-items: center;

    & .edit-btn {
      display: flex;
      background: #FFC02D;
      color: #111827;
      border: none;
      border-radius: 10px;
      padding: 2px 10px;
      text-decoration: none;
    }
  }
}

.quiz-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 10px;
}

.quiz-description {
  font-size: 14px;
  color: #9CA3AF;
  margin-bottom: 15px;
  line-height: 1.5;
}

.quiz-created-data {
  font-size: 12px;
  color: #6B7280;
}

.nothing {
  color: #9CA3AF;
  margin-top: 20px;
}

.btn {
  display: inline-flex;
  align-items: center;
  text-decoration: none;
  padding: 5px 18px;
  border-radius: 12px;
  transition: 0.2s ease;

  &.create-btn {
    background: #FFC02D;
    color: #111827;
    font-weight: 700;
    margin-top: 40px;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(255, 192, 45, 0.3);
    }
  }
}

</style>