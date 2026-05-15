<script setup lang="ts">
import { onMounted, ref } from "vue"
import { useQuiz } from "@/features/quiz/store.ts"
import { useRouter } from "vue-router"
import type { QuizIn } from "@/features/quiz/types.ts"
import { IoOutlineCopy, McDelete2Line, ByEdit } from "@kalimahapps/vue-icons"
import QuizEditor from "@/features/quiz/shared/QuizEditor.vue"

const props = defineProps<{ quiz_id: number }>()

const quizStore = useQuiz()
const router    = useRouter()

const quiz      = ref<QuizIn | null>(null)
const isEditing = ref(false)
const copyHint  = ref(false)
const deleting  = ref(false)

onMounted(async () => {
  quiz.value = await quizStore.fetchQuiz(props.quiz_id)
  console.log(quiz.value)
})

function onSaved(updated: QuizIn) {
  quiz.value  = updated
  isEditing.value = false
}

async function copyHash() {
  if (!quiz.value) return
  await navigator.clipboard.writeText(quiz.value.hash_code)
  copyHint.value = true
  setTimeout(() => (copyHint.value = false), 1800)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "2-digit", month: "short", year: "numeric",
  })
}

function formatTime(seconds: number) {
  if (!seconds) return "без ограничений"
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m && s) return `${m} мин ${s} сек`
  if (m)      return `${m} мин`
  return `${s} сек`
}


async function onDelete() {
  if (!confirm("Удалить викторину? Это действие необратимо.")) return
  deleting.value = true
  try {
    const status = await quizStore.deleteQuiz(props.quiz_id)
    if (status === 204) router.push({ name: "my-quizzes" })
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <div class="qv" v-if="quiz">

    <!-- ── Режим просмотра ── -->
    <template v-if="!isEditing">

      <!-- Шапка: название + действия -->
      <div class="qv__top">
        <div class="qv__left">
          <!-- Кнопка назад -->
          <button class="qv__back" type="button" @click="router.back()">‹</button>
          <h2 class="qv__title">{{ quiz.title }}</h2>
        </div>
        <div class="qv__actions">
          <button class="qv__action-btn" type="button" @click="isEditing = true" title="Редактировать">
            <ByEdit class="qv__action-ico" />
          </button>
          <button
              class="qv__action-btn qv__action-btn--danger"
              type="button"
              @click="onDelete"
              :disabled="deleting"
              title="Удалить"
          >
            <McDelete2Line class="qv__action-ico" />
          </button>
        </div>
      </div>

      <!-- Описание -->
      <p class="qv__desc" v-if="quiz.description">{{ quiz.description }}</p>

      <!-- Мета -->
      <div class="qv__meta">
        <!-- Hash -->
        <button class="qv__hash" type="button" @click="copyHash" title="Скопировать код">
          <IoOutlineCopy class="qv__hash-icon" />
          <span class="qv__hash-code">{{ quiz.hash_code }}</span>
          <transition name="fade">
            <span v-if="copyHint" class="qv__copy-hint">Скопировано!</span>
          </transition>
        </button>

        <span class="qv__meta-dot" />

        <!-- Дата -->
        <span class="qv__meta-item">
          📅 {{ formatDate(quiz.created_at) }}
        </span>

        <span class="qv__meta-dot" />

        <!-- Время -->
        <span class="qv__meta-item" :class="{ 'qv__meta-item--teal': quiz.time_limit > 0 }">
          ⏱ {{ formatTime(quiz.time_limit) }}
        </span>
      </div>

    </template>

    <!-- ── Режим редактирования ── -->
    <template v-else>
      <QuizEditor
          :quiz="quiz"
          @saved="onSaved"
          @cancelled="isEditing = false"
      />
    </template>

  </div>
</template>

<style scoped lang="scss">
$bg:          #F6F6F6;
$card:        #ffffff;
$text:        #222222;
$muted:       #6B7280;
$border:      rgba(0, 0, 0, 0.07);
$accent:      #234970;
$teal:        #4EBEC2;
$teal-soft:   rgba(78, 190, 194, 0.12);
$teal-border: rgba(78, 190, 194, 0.3);
$red:         #ef4444;
$r-lg:        16px;
$r-sm:        8px;

.qv {
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: $card;
  border-radius: $r-lg;
  padding: 18px 16px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);

  &__top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }

  &__left {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
    flex: 1;
  }

  &__back {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    border-radius: 50%;
    border: 1.5px solid $border;
    background: $bg;
    color: $text;
    font-size: 20px;
    cursor: pointer;
    flex-shrink: 0;
    transition: all 0.15s;
    line-height: 1;
    padding: 0 0 2px 0;

    &:hover { border-color: $teal; background: $teal-soft; }
  }

  &__title {
    font-size: 18px;
    font-weight: 700;
    color: $text;
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 0;
  }

  &__actions {
    display: flex;
    gap: 6px;
    flex-shrink: 0;
  }

  &__action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: $r-sm;
    border: 1.5px solid $border;
    background: $bg;
    cursor: pointer;
    transition: all 0.15s;
    color: $muted;

    &:hover {
      border-color: $teal-border;
      background: $teal-soft;
      color: $accent;
    }

    &--danger {
      &:hover {
        border-color: rgba(239,68,68,0.35);
        background: rgba(239,68,68,0.06);
        color: $red;
      }
    }

    &:disabled { opacity: 0.4; cursor: not-allowed; }
  }

  &__action-ico { font-size: 18px; }

  &__desc {
    font-size: 14px;
    color: $muted;
    margin: 0;
    line-height: 1.6;
  }

  // ── Мета-строка ──
  &__meta {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    padding-top: 4px;
    border-top: 1px solid rgba(0,0,0,0.05);
  }

  &__hash {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    color: $teal;
    font-size: 12px;
    transition: opacity 0.15s;

    &:hover { opacity: 0.75; }
  }

  &__hash-icon { font-size: 13px; flex-shrink: 0; }

  &__hash-code {
    font-family: monospace;
    letter-spacing: 0.03em;
    font-size: 12px;
  }

  &__copy-hint {
    font-size: 11px;
    color: $accent;
    font-weight: 600;
  }

  &__meta-dot {
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background: rgba(0,0,0,0.15);
    flex-shrink: 0;
  }

  &__meta-item {
    font-size: 12px;
    color: $muted;

    &--teal { color: $teal; font-weight: 500; }
  }
}

// Transition
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
