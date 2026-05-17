<script setup lang="ts">
import { reactive, ref, computed, watch, onMounted, useTemplateRef } from "vue"
import { useQuiz } from "@/features/quiz/store.ts"
import type {
  QuestionIn,
  QuestionOut,
  QuestionType,
  QuestionOption,
  MatchItem,
  InputAnswer,
} from "@/features/quiz/types.ts"
import { useDropZone } from "@vueuse/core"

// ─── Image upload ─────────────────────────────────────────────────────────────

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]
const MAX_SIZE_MB = 5

const imageDropRef = useTemplateRef("imageDropRef")
const fileInputRef = useTemplateRef<HTMLInputElement>("fileInputRef")

const selectedFile = ref<File | null>(null)
const imagePreview = ref<string>("")   // base64 или существующий URL при редактировании
const imageUploadError = ref("")

const { isOverDropZone } = useDropZone(imageDropRef, {
  onDrop: (files) => handleFiles(files),
  dataTypes: ACCEPTED_TYPES,
  multiple: false,
  preventDefaultForUnhandled: false,
})

function handleFiles(files: File[] | null) {
  imageUploadError.value = ""
  const file = files?.[0]
  if (!file) return

  if (!ACCEPTED_TYPES.includes(file.type)) {
    imageUploadError.value = "Формат не поддерживается. Используйте JPG, PNG, WebP или GIF."
    return
  }
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    imageUploadError.value = `Файл слишком большой. Максимум ${MAX_SIZE_MB} МБ.`
    return
  }

  selectedFile.value = file

  const reader = new FileReader()
  reader.onload = (e) => { imagePreview.value = e.target?.result as string }
  reader.readAsDataURL(file)
}

function onFileInputChange(e: Event) {
  const input = e.target as HTMLInputElement
  handleFiles(input.files ? Array.from(input.files) : null)
  input.value = "" // сброс, чтобы можно было выбрать тот же файл повторно
}

function removeImage() {
  selectedFile.value = null
  imagePreview.value = ""
  imageUploadError.value = ""
}

// ─── Props & emits ────────────────────────────────────────────────────────────

const props = defineProps<{
  quiz_id: number
  order?: number
  context_id?: number | null
  question?: QuestionIn
}>()

const emit = defineEmits<{
  saved: [question: QuestionIn]
  cancelled: []
}>()

// ─── Mode ─────────────────────────────────────────────────────────────────────

const isEditMode = computed(() => !!props.question)

// ─── Store ────────────────────────────────────────────────────────────────────

const quizStore = useQuiz()

// ─── Реактивное состояние ─────────────────────────────────────────────────────

const questionType = ref<QuestionType>("single_choice")
const questionText = ref("")
const loading = ref(false)
const error = ref("")

// Single / Multiple choice
const choiceOptions = reactive<QuestionOption[]>([
  { id: 1, text: "", explanation: "" },
  { id: 2, text: "", explanation: "" },
])
const singleCorrect = ref<number>(1)
const multipleCorrect = ref<number[]>([])
const shuffleChoice = ref(true)
const partialScoring = ref(false)
const minChoices = ref(1)
const maxChoices = ref(2)

// Matching
const matchLeft = reactive<MatchItem[]>([
  { id: 1, text: "" },
  { id: 2, text: "" },
])
const matchRight = reactive<MatchItem[]>([
  { id: 1, text: "" },
  { id: 2, text: "" },
])
const pairs = reactive<Record<string, number>>({})
const shuffleLeft = ref(false)
const shuffleRight = ref(true)

// Input
const inputAnswers = reactive<InputAnswer[]>([{ value: "", aliases: [] }])
const caseSensitive = ref(false)
const trimSpaces = ref(true)
const normalizeSpace = ref(true)
const numeric = ref(false)
const tolerance = ref(0)

// ─── Счётчики ID ─────────────────────────────────────────────────────────────

let nextOptionId = 3
let nextMatchId = 3

// ─── Гидрация из пропса при редактировании ───────────────────────────────────

function hydrateFromQuestion(q: QuestionIn) {
  questionType.value = q.type
  questionText.value = q.text

  // При редактировании показываем существующее изображение как превью
  if (q.image_url) imagePreview.value = q.image_url

  const p = q.payload

  if (q.type === "single_choice" && p.single_choice) {
    const sc = p.single_choice
    choiceOptions.splice(0, choiceOptions.length, ...sc.options.map(o => ({ ...o })))
    singleCorrect.value = sc.correct
    shuffleChoice.value = sc.shuffle
    nextOptionId = Math.max(...sc.options.map(o => o.id)) + 1
  }

  if (q.type === "multiple_choice" && p.multiple_choice) {
    const mc = p.multiple_choice
    choiceOptions.splice(0, choiceOptions.length, ...mc.options.map(o => ({ ...o })))
    multipleCorrect.value = [...mc.correct]
    shuffleChoice.value = mc.shuffle
    minChoices.value = mc.min_choices
    maxChoices.value = mc.max_choices
    partialScoring.value = mc.partial_scoring
    nextOptionId = Math.max(...mc.options.map(o => o.id)) + 1
  }

  if (q.type === "matching" && p.matching) {
    const m = p.matching
    matchLeft.splice(0, matchLeft.length, ...m.left.map(l => ({ ...l })))
    matchRight.splice(0, matchRight.length, ...m.right.map(r => ({ ...r })))
    Object.keys(pairs).forEach(k => delete pairs[k])
    Object.assign(pairs, m.pairs)
    shuffleLeft.value = m.shuffle_left
    shuffleRight.value = m.shuffle_right
    nextMatchId = Math.max(...m.left.map(l => l.id), ...m.right.map(r => r.id)) + 1
  }

  if (q.type === "input" && p.input) {
    const inp = p.input
    inputAnswers.splice(
        0, inputAnswers.length,
        ...inp.answers.map(a => ({ value: a.value, aliases: [...a.aliases] }))
    )
    caseSensitive.value = inp.case_sensitive
    trimSpaces.value = inp.trim
    normalizeSpace.value = inp.normalize_space
    numeric.value = inp.numeric
    tolerance.value = inp.tolerance
  }
}

onMounted(() => {
  if (props.question) hydrateFromQuestion(props.question)
})

watch(questionType, () => { error.value = "" })

// ─── Helpers: варианты ────────────────────────────────────────────────────────

function addOption() {
  choiceOptions.push({ id: nextOptionId++, text: "", explanation: "" })
}
function removeOption(idx: number) {
  if (choiceOptions.length <= 2) return
  const removed = choiceOptions.splice(idx, 1)[0]
  if (!removed ) return;
  multipleCorrect.value = multipleCorrect.value.filter(id => id !== removed.id)
  if (choiceOptions[0] === undefined) return;
  if (singleCorrect.value === removed.id) singleCorrect.value = choiceOptions[0].id
}

// ─── Helpers: matching ────────────────────────────────────────────────────────

function addMatchRow() {
  const id = nextMatchId++
  matchLeft.push({ id, text: "" })
  matchRight.push({ id, text: "" })
}
function removeMatchRow(idx: number) {
  if (matchLeft.length <= 2) return
  const lId = matchLeft[idx]?.id
  if (lId ===undefined) return;
  matchLeft.splice(idx, 1)
  matchRight.splice(idx, 1)
  delete pairs[lId]
}

// ─── Helpers: input ───────────────────────────────────────────────────────────

function addAlias(answerIdx: number) {
  inputAnswers[answerIdx]?.aliases.push("")
}
function removeAlias(answerIdx: number, aliasIdx: number) {
  inputAnswers[answerIdx]?.aliases.splice(aliasIdx, 1)
}
function addAnswer() {
  inputAnswers.push({ value: "", aliases: [] })
}
function removeAnswer(idx: number) {
  if (inputAnswers.length <= 1) return
  inputAnswers.splice(idx, 1)
}

// ─── Валидация ────────────────────────────────────────────────────────────────

const isValid = computed(() => {
  if (!questionText.value.trim()) return false

  if (questionType.value === "single_choice") {
    return (
        choiceOptions.every(o => o.text.trim()) &&
        choiceOptions.some(o => o.id === singleCorrect.value)
    )
  }
  if (questionType.value === "multiple_choice") {
    return (
        choiceOptions.every(o => o.text.trim()) &&
        multipleCorrect.value.length > 0
    )
  }
  if (questionType.value === "matching") {
    return (
        matchLeft.every(l => l.text.trim()) &&
        matchRight.every(r => r.text.trim()) &&
        matchLeft.every(l => pairs[l.id] !== undefined)
    )
  }
  if (questionType.value === "input") {
    return inputAnswers.every(a => a.value.trim())
  }
  return false
})

// ─── Сборка payload ───────────────────────────────────────────────────────────

function buildPayload(): QuestionOut["payload"] {
  if (questionType.value === "single_choice") {
    return {
      single_choice: {
        options: choiceOptions.map(o => ({ ...o })),
        correct: singleCorrect.value,
        shuffle: shuffleChoice.value,
      },
    }
  }
  if (questionType.value === "multiple_choice") {
    return {
      multiple_choice: {
        options: choiceOptions.map(o => ({ ...o })),
        correct: [...multipleCorrect.value],
        min_choices: minChoices.value,
        max_choices: maxChoices.value,
        shuffle: shuffleChoice.value,
        partial_scoring: partialScoring.value,
      },
    }
  }
  if (questionType.value === "matching") {
    return {
      matching: {
        left: matchLeft.map(l => ({ ...l })),
        right: matchRight.map(r => ({ ...r })),
        pairs: { ...pairs },
        shuffle_left: shuffleLeft.value,
        shuffle_right: shuffleRight.value,
      },
    }
  }
  return {
    input: {
      answers: inputAnswers.map(a => ({ value: a.value, aliases: [...a.aliases] })),
      case_sensitive: caseSensitive.value,
      trim: trimSpaces.value,
      normalize_space: normalizeSpace.value,
      numeric: numeric.value,
      tolerance: tolerance.value,
    },
  }
}

// ─── Отправка ─────────────────────────────────────────────────────────────────

async function submit() {
  if (!isValid.value || loading.value) return
  error.value = ""
  loading.value = true

  try {
    let payload: QuestionOut = {
      id: props.question?.id,
      text: questionText.value.trim(),
      type: questionType.value,
      payload: buildPayload(),
      order: props.question?.order ?? props.order ?? 0,
      quiz_id: props.quiz_id,
      context_id: props.question?.context_id ?? props.context_id ?? null,
    }

    // selectedFile.value — новый файл или null (файл не менялся / удалён)
    // Стор сам упакует всё в FormData и передаёт бэкенду одним запросом
    let result: QuestionIn
    if (isEditMode.value && props.question ) {
      result = await quizStore.updateQuestion(props.question.id, payload)
    } else {
      result = await quizStore.createQuestion(payload)
    }

    if (selectedFile.value) {
      try {
        const formData = new FormData()
        formData.append("image", selectedFile.value)

        const image_key = await quizStore.uploadImage(formData, result.id)
        if (image_key) {
          payload.image_key = image_key
        }
      } catch (e) {
        console.error(e)
      }
    }

    emit("saved", result)
  } catch (e: any) {
    error.value = e?.response?.data?.detail ?? e?.message ?? "Ошибка при сохранении вопроса"
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="qe">
    <h3 class="qe__title">
      {{ isEditMode ? 'Редактировать вопрос' : 'Новый вопрос' }}
    </h3>

    <!-- Тип — в режиме редактирования заблокирован -->
    <div class="qe__tabs">
      <button
          v-for="t in (['single_choice', 'multiple_choice', 'matching', 'input'] as QuestionType[])"
          :key="t"
          class="qe__tab"
          :class="{ active: questionType === t, disabled: isEditMode && questionType !== t }"
          :disabled="isEditMode"
          @click="!isEditMode && (questionType = t)"
          type="button"
          :title="isEditMode && questionType !== t ? 'Нельзя изменить тип вопроса' : ''"
      >
        {{ { single_choice: 'Один ответ', multiple_choice: 'Несколько', matching: 'Соответствие', input: 'Ввод' }[t] }}
      </button>
    </div>

    <!-- Текст -->
    <label class="qe__field">
      <span>Текст вопроса</span>
      <textarea class="qe__textarea" v-model="questionText" rows="3" placeholder="Введите вопрос…" />
    </label>

    <!-- ─── ИЗОБРАЖЕНИЕ ─── -->
    <div class="qe__field">
      <span>Изображение (необязательно)</span>

      <!-- Превью после выбора -->
      <div v-if="imagePreview" class="qe__img-preview">
        <img :src="imagePreview" alt="Превью" />
        <button class="qe__img-remove" type="button" @click="removeImage" title="Удалить изображение">✕</button>
        <span class="qe__img-name" v-if="selectedFile">{{ selectedFile.name }}</span>
      </div>

      <!-- Зона дропа (скрыта когда уже есть превью) -->
      <div
          v-else
          ref="imageDropRef"
          class="qe__dropzone"
          :class="{ 'qe__dropzone--over': isOverDropZone }"
          @click="fileInputRef?.click()"
      >
        <div class="qe__dropzone-icon">🖼️</div>
        <p class="qe__dropzone-text">
          Перетащите изображение сюда<br/>
          <span>или нажмите для выбора файла</span>
        </p>
        <p class="qe__dropzone-hint">JPG, PNG, WebP, GIF · до {{ 5 }} МБ</p>
      </div>

      <!-- Скрытый input[file] -->
      <input
          ref="fileInputRef"
          type="file"
          :accept="ACCEPTED_TYPES.join(',')"
          style="display: none"
          @change="onFileInputChange"
      />

      <p class="qe__img-error" v-if="imageUploadError">{{ imageUploadError }}</p>
    </div>

    <!-- ─── SINGLE / MULTIPLE CHOICE ─── -->
    <template v-if="questionType === 'single_choice' || questionType === 'multiple_choice'">
      <div class="qe__section-title">Варианты ответов</div>

      <div class="qe__options">
        <div v-for="(option, idx) in choiceOptions" :key="option.id" class="qe__option">
          <div class="qe__option-mark">
            <input
                v-if="questionType === 'single_choice'"
                type="radio" :value="option.id" v-model="singleCorrect"
                title="Правильный ответ"
            />
            <input
                v-else
                type="checkbox" :value="option.id" v-model="multipleCorrect"
                title="Правильный ответ"
            />
          </div>
          <div class="qe__option-fields">
            <input class="qe__input" type="text" v-model="option.text" :placeholder="`Вариант ${idx + 1}`" />
            <input class="qe__input qe__input--small" type="text" v-model="option.explanation" placeholder="Пояснение (необязательно)" />
          </div>
          <button class="qe__btn-remove" type="button" @click="removeOption(idx)">✕</button>
        </div>
      </div>

      <button class="qe__btn-add" type="button" @click="addOption">+ Добавить вариант</button>

      <div class="qe__row">
        <label class="qe__checkbox">
          <input type="checkbox" v-model="shuffleChoice" /> Перемешивать варианты
        </label>
      </div>

      <div v-if="questionType === 'multiple_choice'" class="qe__row qe__row--gap">
        <label class="qe__field qe__field--inline">
          <span>Мин. выборов</span>
          <input class="qe__input qe__input--xs" type="number" v-model.number="minChoices" min="1" />
        </label>
        <label class="qe__field qe__field--inline">
          <span>Макс. выборов</span>
          <input class="qe__input qe__input--xs" type="number" v-model.number="maxChoices" min="1" />
        </label>
        <label class="qe__checkbox">
          <input type="checkbox" v-model="partialScoring" /> Частичный балл
        </label>
      </div>
    </template>

    <!-- ─── MATCHING ─── -->
    <template v-if="questionType === 'matching'">
      <div class="qe__section-title">Соответствия</div>
      <p class="qe__hint">Левый элемент → выбери соответствующий правый</p>

      <div class="qe__match-header">
        <span>Левая часть</span>
        <span>Правая часть</span>
        <span>Соответствие</span>
      </div>

      <div v-for="(left, idx) in matchLeft" :key="left.id" class="qe__match-row">
        <input class="qe__input" type="text" v-model="left.text" :placeholder="`Левый ${idx + 1}`" />
        <span class="qe__match-arrow">→</span>
        <input class="qe__input" type="text" v-model="matchRight[idx]!.text" :placeholder="`Правый ${idx + 1}`" />
        <select
            class="qe__select"
            :value="pairs[left.id]"
            @change="(e) => { pairs[left.id] = Number((e.target as HTMLSelectElement).value) }"
        >
          <option value="" disabled :selected="pairs[left.id] === undefined">Выбрать…</option>
          <option v-for="right in matchRight" :key="right.id" :value="right.id">
            {{ right.text || `Правый ${matchRight.indexOf(right) + 1}` }}
          </option>
        </select>
        <button class="qe__btn-remove" type="button" @click="removeMatchRow(idx)">✕</button>
      </div>

      <button class="qe__btn-add" type="button" @click="addMatchRow">+ Добавить пару</button>

      <div class="qe__row qe__row--gap">
        <label class="qe__checkbox">
          <input type="checkbox" v-model="shuffleLeft" /> Перемешать левые
        </label>
        <label class="qe__checkbox">
          <input type="checkbox" v-model="shuffleRight" /> Перемешать правые
        </label>
      </div>
    </template>

    <!-- ─── INPUT ─── -->
    <template v-if="questionType === 'input'">
      <div class="qe__section-title">Правильные ответы</div>

      <div v-for="(answer, aIdx) in inputAnswers" :key="aIdx" class="qe__answer-block">
        <div class="qe__answer-row">
          <input class="qe__input" type="text" v-model="answer.value" placeholder="Правильный ответ" />
          <button class="qe__btn-remove" type="button" @click="removeAnswer(aIdx)" v-if="inputAnswers.length > 1">✕</button>
        </div>
        <div class="qe__aliases">
          <div v-for="(_, aliasIdx) in answer.aliases" :key="aliasIdx" class="qe__alias-row">
            <input class="qe__input qe__input--small" type="text" v-model="answer.aliases[aliasIdx]" placeholder="Синоним" />
            <button class="qe__btn-remove qe__btn-remove--sm" type="button" @click="removeAlias(aIdx, aliasIdx)">✕</button>
          </div>
          <button class="qe__btn-alias" type="button" @click="addAlias(aIdx)">+ Синоним</button>
        </div>
      </div>

      <button class="qe__btn-add" type="button" @click="addAnswer">+ Добавить ответ</button>

      <div class="qe__row qe__row--gap">
        <label class="qe__checkbox">
          <input type="checkbox" v-model="caseSensitive" /> Учитывать регистр
        </label>
        <label class="qe__checkbox">
          <input type="checkbox" v-model="trimSpaces" /> Убирать пробелы
        </label>
        <label class="qe__checkbox">
          <input type="checkbox" v-model="normalizeSpace" /> Нормализовать пробелы
        </label>
        <label class="qe__checkbox">
          <input type="checkbox" v-model="numeric" /> Числовой
        </label>
      </div>

      <label v-if="numeric" class="qe__field qe__field--inline">
        <span>Погрешность</span>
        <input class="qe__input qe__input--xs" type="number" v-model.number="tolerance" min="0" step="0.01" />
      </label>
    </template>

    <!-- Ошибка -->
    <p class="qe__error" v-if="error">{{ error }}</p>

    <!-- Действия -->
    <div class="qe__actions">
      <button class="qe__btn qe__btn--cancel" type="button" @click="emit('cancelled')">
        Отмена
      </button>
      <button
          class="qe__btn qe__btn--save"
          :class="{ active: isValid && !loading }"
          :disabled="!isValid || loading"
          type="button"
          @click="submit"
      >
        {{ loading ? 'Сохранение…' : isEditMode ? 'Сохранить изменения' : 'Создать вопрос' }}
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use "@/shared/styles/tokens" as *;

.qe {
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 16px;
  color: $text;

  &__title {
    font-size: 18px;
    font-weight: 700;
    margin: 0;
  }

  &__tabs {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  &__tab {
    padding: 6px 14px;
    border-radius: $r-lg;
    border: 1.5px solid transparent;
    background: $bg;
    color: $muted;
    cursor: pointer;
    font-size: 13px;
    transition: all 0.15s;

    &.active {
      border-color: $accent;
      color: $accent;
      font-weight: 600;
    }

    &.disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }

    &:hover:not(.active):not(.disabled) {
      color: $text;
    }
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: 6px;

    span {
      font-size: 12px;
      opacity: 0.7;
    }

    &--inline {
      flex-direction: row;
      align-items: center;
      gap: 10px;

      span { white-space: nowrap; }
    }
  }

  &__input {
    background: $bg-subtle;
    box-shadow: $shadow-sm;
    border: $border-md 1px solid;
    border-radius: $r-xs;
    color: $text;
    font-size: 14px;
    padding: 7px 12px;
    outline: none;
    width: 100%;

    &--small {
      font-size: 12px;
      padding: 5px 10px;
      opacity: 0.8;
    }

    &--xs { width: 80px; }

    &::placeholder { color: $muted; }
  }

  &__textarea {
    background: $bg;
    border: $border 1px solid;
    border-radius: $r-md;
    color: $text;
    font-size: 14px;
    padding: 10px 12px;
    outline: none;
    width: calc(100% - 24px);
    resize: vertical;
    min-height: 80px;
    font-family: inherit;

    &::placeholder { color: rgba(255, 255, 255, 0.25); }
  }

  &__select {
    background: $bg;
    border: $border-md 1px solid;
    border-radius: $r-sm;
    color: $text;
    font-size: 13px;
    padding: 7px 10px;
    outline: none;
    cursor: pointer;
    flex: 1;
    min-width: 0;
  }

  // ── Dropzone ──
  &__dropzone {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 28px 16px;
    border-radius: $r-md;
    border: 2px dashed $border;
    background: $bg;
    cursor: pointer;
    transition: border-color 0.2s, background 0.2s;
    text-align: center;

    &:hover, &--over {
      border-color: $accent;
      background: rgba(255, 192, 45, 0.05);
    }

    &--over {
      border-style: solid;
    }
  }

  &__dropzone-icon {
    font-size: 28px;
    line-height: 1;
    filter: grayscale(0.4);
  }

  &__dropzone-text {
    margin: 0;
    font-size: 13px;
    color: $muted;
    line-height: 1.5;

    span {
      color: $accent;
      font-size: 13px;
      opacity: 1;
      text-decoration: underline;
      text-underline-offset: 2px;
    }
  }

  &__dropzone-hint {
    margin: 0;
    font-size: 11px;
    color: rgba(255, 255, 255, 0.25);
  }

  // ── Image preview ──
  &__img-preview {
    position: relative;
    width: 100%;
    max-width: 320px;
    border-radius: $r-md;
    overflow: hidden;
    border: 1.5px solid rgba(255, 255, 255, 0.1);

    img {
      display: block;
      width: 100%;
      max-height: 200px;
      object-fit: cover;
    }
  }

  &__img-remove {
    position: absolute;
    top: 6px;
    right: 6px;
    background: rgba(0, 0, 0, 0.6);
    border: none;
    border-radius: 50%;
    color: #fff;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 12px;
    transition: background 0.15s;

    &:hover { background: #ff6b6b; }
  }

  &__img-name {
    display: block;
    padding: 6px 10px;
    font-size: 11px;
    color: $text;
    background: rgba(0, 0, 0, 0.25);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    opacity: 1;
  }

  &__img-error {
    color: #ff6b6b;
    font-size: 12px;
    margin: 0;
  }

  // ── Section title ──
  &__section-title {
    font-size: 13px;
    font-weight: 600;
    color: $muted;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  &__hint {
    font-size: 12px;
    color: $muted;
    margin: -8px 0 0;
  }

  &__options {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  &__option {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    background: $card-raised;
    box-shadow: $shadow-card;
    border: $border-md 2px solid;
    padding: 10px;
    border-radius: $r-md;
  }

  &__option-mark {
    padding-top: 8px;
    flex-shrink: 0;

    input[type="radio"],
    input[type="checkbox"] {
      accent-color: $accent;
      width: 16px;
      height: 16px;
      cursor: pointer;
    }
  }

  &__option-fields {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  }

  &__match-header {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 8px;
    font-size: 12px;
    color: $text-2;
    padding: 0 4px;
  }

  &__match-row {
    display: flex;
    align-items: center;
    gap: 8px;
    background: $card-raised;
    box-shadow: $shadow-md;
    border: $border-md 1px solid;
    padding: 10px;
    border-radius: $r-sm;

    .qe__input { flex: 1; min-width: 0; }
  }

  &__match-arrow {
    color: $accent;
    font-size: 18px;
    flex-shrink: 0;
  }

  &__answer-block {
    background: $bg;
    border-radius: $r-sm;
    padding: 10px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__answer-row {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  &__aliases {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding-left: 12px;
    border-left: 2px solid rgba(255, 192, 45, 0.3);
  }

  &__alias-row {
    display: flex;
    gap: 6px;
    align-items: center;
  }

  &__btn-alias {
    background: $bg-subtle;
    border: $border-md 1px dashed;
    border-radius: $r-sm;
    color: $muted;
    cursor: pointer;
    font-size: 12px;
    padding: 2px 0;
    text-align: left;

    &:hover { color: $text; }
  }

  &__row {
    display: flex;
    align-items: center;
    flex-wrap: wrap;

    &--gap { gap: 16px; }
  }

  &__checkbox {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    cursor: pointer;
    user-select: none;

    input[type="checkbox"] {
      accent-color: $accent;
      width: 15px;
      height: 15px;
      cursor: pointer;
    }
  }

  &__btn-add {
    background: none;
    border: 1.5px dashed $accent;
    border-radius: $r-md;
    color: $accent;
    cursor: pointer;
    font-size: 13px;
    padding: 8px 16px;
    transition: border-color 0.15s;
    align-self: flex-start;

    &:hover { border-color: $accent; }
  }

  &__btn-remove {
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.3);
    cursor: pointer;
    font-size: 16px;
    line-height: 1;
    padding: 2px 4px;
    flex-shrink: 0;
    transition: color 0.15s;

    &:hover { color: #ff6b6b; }
    &--sm { font-size: 13px; }
  }

  &__actions {
    display: flex;
    gap: 12px;
    margin-top: 8px;
  }

  &__btn {
    padding: 8px 20px;
    border-radius: $r-md;
    border: none;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;

    &--cancel {
      background: $teal-soft;
      color: $text-2;

      &:hover { color: $text; }
    }

    &--save {
      background: #242424;
      color: rgba(255, 255, 255, 0.4);
      cursor: not-allowed;

      &.active {
        background: $accent;
        color: $card;
        cursor: pointer;
      }
    }
  }

  &__error {
    color: #ff6b6b;
    font-size: 13px;
    margin: 0;
  }
}
</style>