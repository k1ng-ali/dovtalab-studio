<script setup lang="ts">
import { onMounted, ref } from "vue"
import { useQuiz } from "@/features/quiz/store.ts"
import type { QuizIn } from "@/features/quiz/types.ts"
import {IoOutlineCopy, McDelete2Line} from '@kalimahapps/vue-icons'
import { ByEdit } from '@kalimahapps/vue-icons'
import QuizEditor from "@/features/quiz/components/QuizEditor.vue"
import {useRouter} from "vue-router"
const quizStore = useQuiz()

const currentQuiz = ref<QuizIn | null>(null)
const isEditing = ref(false)
const copyHint = ref(false)

const router = useRouter()

const props = defineProps<{
  quiz_id: number
}>()

onMounted(async () => {
  const quiz = quizStore.quiz(props.quiz_id)
  if (quiz) currentQuiz.value = quiz
})

function onSaved(updated: QuizIn) {
  currentQuiz.value = updated
  isEditing.value = false
}

async function copyHash() {
  if (!currentQuiz.value) return
  await navigator.clipboard.writeText(currentQuiz.value.hash_code)
  copyHint.value = true
  setTimeout(() => copyHint.value = false, 1800)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "2-digit", month: "long", year: "numeric"
  })
}

function formatTime(seconds: number) {
  if (!seconds) return "без ограничений"
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return m ? `${m} мин ${s ? s + " сек" : ""}`.trim() : `${s} сек`
}

async function onDelete() {
  try {
     if (await quizStore.deleteQuiz(props.quiz_id) == 204){
        await router.push("/all-quizzes/")
     }
  }catch (e) {
  }
}

</script>

<template>
  <div class="qv" v-if="currentQuiz">

    <!-- ── Режим просмотра ── -->
    <template v-if="!isEditing">
      <div class="qv__top">
        <div class="qv__left">
          <h3 class="qv__title">{{ currentQuiz.title }}</h3>
          <button class="qv__hash" type="button" @click="copyHash" title="Скопировать код">
            <IoOutlineCopy class="qv__hash-icon" />
            <span class="qv__hash-code">{{ currentQuiz.hash_code }}</span>
            <span v-if="copyHint" class="qv__copy-hint">Скопировано!</span>
          </button>
        </div>
        <div class="qv__right">
          <button class="qv__edit-btn" type="button" @click="isEditing = true" title="Редактировать">
            <ByEdit class="qv__edit-ico" />
          </button>
          <button class="qv__delete-btn" type="button" @click="onDelete" title="Удалить викторину">
            <McDelete2Line class="qv__delete-ico" />
          </button>
        </div>
      </div>

      <p class="qv__description">{{ currentQuiz.description }}</p>

      <div class="qv__meta">
        <span class="qv__meta-item">📅 {{ formatDate(currentQuiz.created_at) }}</span>
        <span class="qv__meta-sep">·</span>
        <span class="qv__meta-item">⏱ {{ formatTime(currentQuiz.time_limit) }}</span>
      </div>
    </template>

    <!-- ── Режим редактирования ── -->
    <template v-else>
      <QuizEditor
          :quiz="currentQuiz"
          @saved="onSaved"
          @cancelled="isEditing = false"
      />
    </template>

  </div>
</template>

<style scoped lang="scss">
$bg: #172035;
$bg-light: #202c4a;
$accent: #FFC02D;
$text: #e2e8f0;
$muted: rgba(226, 232, 240, 0.55);
$radius: 10px;

.qv {
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: $bg;
  padding: 20px;
  border-radius: $radius;
  margin-bottom: 20px;

  &__top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }

  &__left {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  }

  &__title {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
    color: $text;
    line-height: 1.3;
  }

  &__hash {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    color: $muted;
    transition: color 0.15s;

    &:hover { color: $accent; }
  }

  &__hash-icon { font-size: 14px; }

  &__hash-code {
    font-size: 12px;
    font-family: monospace;
    letter-spacing: 0.03em;
  }

  &__copy-hint {
    font-size: 11px;
    color: $accent;
    animation: fade-pop 1.8s ease forwards;

    @keyframes fade-pop {
      0%   { opacity: 0; transform: translateY(-3px); }
      15%  { opacity: 1; transform: translateY(0); }
      80%  { opacity: 1; }
      100% { opacity: 0; }
    }
  }

  &__right {
    display: flex;
    flex-direction: row;
    gap: 10px;
  }

  &__edit-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    background: $bg-light;
    border: 1px solid rgba(255, 192, 45, 0.35);
    border-radius: $radius;
    padding: 10px;
    cursor: pointer;
    flex-shrink: 0;
    transition: background 0.15s, border-color 0.15s;

    &:hover {
      background: rgba(255, 192, 45, 0.1);
      border-color: $accent;
    }
  }

  &__delete-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    background: $bg-light;
    border: 1px solid rgba(255, 45, 45, 0.35);
    color: rgba(255, 45, 45, 0.35);
    border-radius: $radius;
    padding: 10px;
    cursor: pointer;
    flex-shrink: 0;
    transition: background 0.15s, border-color 0.15s;

    &:hover {
      background: rgba(255, 192, 45, 0.1);
      border-color: #ff2d2d;
      color: #ff2d2d;
    }
  }

  &__edit-ico {
    color: $accent;
    font-size: 18px;
  }

  &__description {
    margin: 0;
    font-size: 14px;
    color: $muted;
    line-height: 1.6;
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  &__meta-item {
    font-size: 13px;
    color: $muted;
  }

  &__meta-sep {
    color: rgba(255,255,255,0.15);
  }
}
</style>