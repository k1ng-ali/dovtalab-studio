<script setup lang="ts">
import {useAllQuiz} from "@/features/quiz/allQuiz/store.ts";
import { storeToRefs } from "pinia"
import { onMounted, ref } from "vue"
import { useRouter } from "vue-router"

const quizStore = useAllQuiz()
const { quizzes } = storeToRefs(quizStore)
const router = useRouter()
const loading = ref(true)

onMounted(async () => {
  try {
    await quizStore.fetchQuizzes()
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
})

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "2-digit", month: "short", year: "numeric",
  })
}

function goToQuiz(id: number) {
  router.push({ name: "quiz-info", params: { quiz_id: id } })
}
</script>

<template>
  <div class="page">

    <!-- ── Шапка ── -->
    <div class="page__header">
      <div class="page__header-text">
        <h1 class="page__title">Все викторины</h1>
        <p class="page__subtitle">Администрирование</p>
      </div>
    </div>

    <!-- ── Скелетон ── -->
    <template v-if="loading">
      <div class="skeleton" v-for="i in 4" :key="i" />
    </template>

    <!-- ── Список ── -->
    <template v-else-if="quizzes.length > 0">
      <div class="quiz-list">
        <button
            v-for="quiz in quizzes"
            :key="quiz.id"
            class="quiz-card"
            @click="goToQuiz(quiz.id)"
            type="button"
        >
          <div class="quiz-card__body">
            <div class="quiz-card__top">
              <span class="quiz-card__hash">#{{ quiz.hash_code }}</span>
              <span class="quiz-card__date">{{ formatDate(quiz.created_at) }}</span>
            </div>
            <h3 class="quiz-card__title">{{ quiz.title }}</h3>
            <p class="quiz-card__desc" v-if="quiz.description">{{ quiz.description }}</p>
          </div>
          <div class="quiz-card__arrow">›</div>
        </button>
      </div>
    </template>

    <!-- ── Пусто ── -->
    <div v-else class="empty">
      <p class="empty__icon">📋</p>
      <p class="empty__text">Викторин пока нет</p>
    </div>

  </div>
</template>

<style scoped lang="scss">
// ── Переменные ────────────────────────────────────────────────────────────────
$bg:        #F6F6F6;
$card:      #ffffff;
$text:      #222222;
$muted:     #6B7280;
$accent:    #234970;
$teal:      #4EBEC2;
$teal-soft: rgba(78, 190, 194, 0.12);
$radius:    16px;
$radius-sm: 10px;

// ── Страница ──────────────────────────────────────────────────────────────────
.page {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  padding: 20px 0 100px; // 100px — отступ под навигатор
  box-sizing: border-box;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 16px 20px;
    background: linear-gradient(
            to top,
            rgba(255, 255, 255, 0.95) 1%,
            rgba(255, 255, 255, 0.7) 30%,
            rgba(255, 255, 255, 0) 50%
    );
    backdrop-filter: blur(10px);
    border-radius: $radius;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.16);
    position: sticky;
    top: 16px;
    z-index: 10;
  }

  &__header-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__title {
    font-size: 20px;
    font-weight: 700;
    color: $text;
    margin: 0;
    line-height: 1.2;
  }

  &__subtitle {
    font-size: 12px;
    color: $muted;
    margin: 0;
  }

  &__create-btn {
    display: inline-flex;
    align-items: center;
    padding: 8px 16px;
    background: $teal-soft;
    border: 1.5px solid rgba(78, 190, 194, 0.3);
    border-radius: 30px;
    color: $accent;
    font-size: 13px;
    font-weight: 700;
    text-decoration: none;
    white-space: nowrap;
    transition: background 0.2s, transform 0.15s;
    flex-shrink: 0;

    &:active { transform: scale(0.96); }
    &:hover  { background: rgba(78, 190, 194, 0.2); }
  }
}

// ── Список ────────────────────────────────────────────────────────────────────
.quiz-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-bottom: 120px;
}

// ── Карточка ──────────────────────────────────────────────────────────────────
.quiz-card {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  background: $card;
  border: 1.5px solid transparent;
  border-radius: $radius;
  padding: 16px 18px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  text-align: left;
  transition: border-color 0.2s, box-shadow 0.2s, transform 0.15s;
  box-sizing: border-box;

  &:hover {
    border-color: rgba(78, 190, 194, 0.35);
    box-shadow: 0 4px 18px rgba(78, 190, 194, 0.12);
  }

  &:active {
    transform: scale(0.99);
  }

  &__body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  &__top {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  &__hash {
    font-size: 11px;
    font-family: monospace;
    color: $teal;
    background: $teal-soft;
    padding: 2px 8px;
    border-radius: 6px;
    letter-spacing: 0.02em;
    flex-shrink: 0;
  }

  &__date {
    font-size: 11px;
    color: $muted;
    margin-left: auto;
    flex-shrink: 0;
  }

  &__title {
    font-size: 15px;
    font-weight: 600;
    color: $text;
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__desc {
    font-size: 13px;
    color: $muted;
    margin: 0;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    line-height: 1.5;
  }

  &__arrow {
    font-size: 22px;
    color: $muted;
    flex-shrink: 0;
    line-height: 1;
    transition: color 0.2s, transform 0.2s;
  }

  &:hover &__arrow {
    color: $teal;
    transform: translateX(3px);
  }
}

// ── Скелетон ──────────────────────────────────────────────────────────────────
.skeleton {
  height: 90px;
  background: linear-gradient(
          90deg,
          rgba(0,0,0,0.04) 25%,
          rgba(0,0,0,0.07) 50%,
          rgba(0,0,0,0.04) 75%
  );
  background-size: 200% 100%;
  border-radius: $radius;
  animation: shimmer 1.4s infinite;
}

@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

// ── Пусто ─────────────────────────────────────────────────────────────────────
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 60px 20px;
  text-align: center;

  &__icon {
    font-size: 48px;
    margin: 0;
    line-height: 1;
  }

  &__text {
    font-size: 15px;
    color: $muted;
    margin: 0;
  }

  &__link {
    font-size: 14px;
    font-weight: 600;
    color: $accent;
    text-decoration: none;
    padding: 8px 20px;
    background: $teal-soft;
    border-radius: 30px;
    border: 1.5px solid rgba(78, 190, 194, 0.3);
    transition: background 0.2s;

    &:hover { background: rgba(78, 190, 194, 0.2); }
  }
}
</style>
