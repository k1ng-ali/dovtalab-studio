<script setup lang="ts">
import {onMounted, reactive} from "vue"
import { useQuiz } from "@/features/quiz/store.ts"
import type { QuizOut} from "@/features/quiz/types.ts"
import {useRouter} from "vue-router";

const quizStore = useQuiz()
const router = useRouter();
let newQuiz = reactive<QuizOut>({
  title: "",
  description: "",
  time_limit: 0,
})

const upload = async () => {
  if (!newQuiz.title || !newQuiz.description || newQuiz.time_limit === null) return

  try {
    const quiz = await quizStore.uploadQuiz(newQuiz)

    if (quiz) {
      await router.push("/all-quizzes/");
    }
  } catch (error) {
    console.log("UpLoad Failed", error)
  }
}

onMounted(async () => {
})
</script>

<template>
  <div class="container">
    <h2 class="title">Создать викторины</h2>
    <div class="wrapper">
      <label for="" class="field">
        <span>Названия</span>
        <input type="text" class="input id text" v-model="newQuiz.title" />
      </label>
      <label for="" class="field">
        <span>Описание</span>
        <textarea  class="textarea description" v-model="newQuiz.description" />
      </label>
      <label for="" class="field">
        <span>Лимит времени</span>
        <input type="number" class="input id time-limit" v-model="newQuiz.time_limit" />
      </label>
      <button
          @click.prevent="upload"
          class="btn upload"
      :class="{'active': newQuiz.title && newQuiz.description && newQuiz.time_limit}">
        Опубликовать
      </button>
    </div>
  </div>
</template>
<style scoped lang="scss">
.container {
  display: flex;
  flex-direction: column;
}
.wrapper {
  display: flex;
  flex-direction: column;

  & .field {
    display: flex;
    position: relative;
    margin-top: 20px;

    input {
      width: 100%;
      background-color: #172035;
      height: 30px;
      padding: 5px 10px;
      font-size: 16px;
      border: none;
      outline: none;
      border-radius: 10px;

      &.description {
        min-height: 200px;
        align-items: start;
      }

      &.time-limit {
        width: 100px;
      }
    }

    textarea {
      width: 100%;
      min-height: 200px;
      background-color: #172035;
      padding: 10px;
      font-size: 16px;
      border: none;
      outline: none;
      border-radius: 10px;
    }

    span {
      position: absolute;
      top: -10px;
      left: 10px;
      font-size: 12px;
      opacity: 0.8;
    }
  }

  .btn {
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;

    &.upload {
      width: max-content;
      padding: 5px 10px;
      margin-top: 30px;
      font-weight: bold;
      border: none;
      border-radius: 10px;
      background: #242424;
      color: #fff;

      &.active {
        background: #FFC02D;
        color: #111827;
      }
    }
  }
}
</style>
