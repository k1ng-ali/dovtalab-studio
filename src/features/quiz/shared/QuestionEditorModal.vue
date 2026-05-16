<script setup lang="ts">
import { computed, onMounted, onUnmounted, watch } from "vue"
import type { QuestionIn } from "@/features/quiz/types.ts"
import QuestionEditor from "./QuestionEditor.vue"

const props = defineProps<{
  show: boolean
  quiz_id: number
  order?: number
  context_id?: number | null
  question?: QuestionIn
}>()

const emit = defineEmits<{
  saved: [question: QuestionIn]
  cancelled: []
}>()

// Ключ для ремаунта редактора при смене режима
const editorKey = computed(() =>
    props.question ? `edit-${props.question.id}` : `new-ctx-${props.context_id ?? "free"}`
)

// Блокируем прокрутку body когда модалка открыта
watch(() => props.show, (open) => {
  document.body.style.overflow = open ? "hidden" : ""
})

function onKeydown(e: KeyboardEvent) {
  if (e.key === "Escape" && props.show) emit("cancelled")
}

onMounted(() => document.addEventListener("keydown", onKeydown))
onUnmounted(() => {
  document.removeEventListener("keydown", onKeydown)
  document.body.style.overflow = ""
})
</script>

<template>
  <Teleport to="body">
    <Transition name="qem-backdrop">
      <div
          v-if="show"
          class="qem__overlay"
          @click.self="emit('cancelled')"
      >
        <Transition name="qem-panel" appear>
          <div
              v-if="show"
              class="qem__panel"
              role="dialog"
              aria-modal="true"
              :aria-label="question ? 'Редактировать вопрос' : 'Новый вопрос'"
          >
            <!-- Drag handle (mobile only) -->
            <div class="qem__handle" aria-hidden="true" />

            <!-- Close button -->
            <button
                class="qem__close"
                type="button"
                @click="emit('cancelled')"
                aria-label="Закрыть"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>

            <!-- Scrollable content -->
            <div class="qem__body">
              <QuestionEditor
                  :key="editorKey"
                  :quiz_id="quiz_id"
                  :order="order"
                  :context_id="context_id"
                  :question="question"
                  @saved="emit('saved', $event)"
                  @cancelled="emit('cancelled')"
              />
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss">
@use "@/shared/styles/tokens" as *;

// ── Overlay ──────────────────────────────────────────────────────────────────

.qem__overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: flex-end;        // mobile: align bottom
  justify-content: center;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);

  @media (min-width: 641px) {
    align-items: center;        // desktop: center
  }
}

// ── Panel ─────────────────────────────────────────────────────────────────────

.qem__panel {
  position: relative;
  width: 100%;
  background: $bg;
  display: flex;
  flex-direction: column;

  // ── Mobile: bottom sheet ──
  max-height: 92dvh;
  border-radius: 24px 24px 0 0;
  padding-top: 20px;
  padding-bottom: 20px;

  @media (min-width: 641px) {
    // ── Desktop: modal ──
    max-width: 620px;
    max-height: 88vh;
    border-radius: 20px;
    padding-top: 20px;
    padding-right: 2px;
  }
}

// ── Drag handle (mobile only) ─────────────────────────────────────────────────

.qem__handle {
  width: 36px;
  height: 4px;
  border-radius: 2px;
  background: rgba(0, 0, 0, 0.12);
  margin: 0 auto 12px;
  flex-shrink: 0;

  @media (min-width: 641px) {
    display: none;
  }
}

// ── Close button ──────────────────────────────────────────────────────────────

.qem__close {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1.5px solid $border-md;
  background: $bg-subtle;
  color: $muted;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
  z-index: 1;
  flex-shrink: 0;

  &:hover {
    background: rgba(239, 68, 68, 0.1);
    border-color: rgba(239, 68, 68, 0.35);
    color: #ef4444;
  }
}

// ── Scrollable body ───────────────────────────────────────────────────────────

.qem__body {
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 4px 20px 28px;
  flex: 1;

  // iOS momentum scroll
  -webkit-overflow-scrolling: touch;

  &::-webkit-scrollbar {
    display: none;
  }

  // Custom scrollbar (desktop)
  @media (min-width: 641px) {
    padding: 12px 24px 28px;

    &::-webkit-scrollbar {
      display: unset;
      width: 4px;
    }
    &::-webkit-scrollbar-track {
      background: transparent;
    }
    &::-webkit-scrollbar-thumb {
      background: $border-md;
      border-radius: 2px;
    }
  }
}

// ── Transitions: backdrop ─────────────────────────────────────────────────────

.qem-backdrop-enter-active,
.qem-backdrop-leave-active {
  transition: opacity 0.25s ease;
}

.qem-backdrop-enter-from,
.qem-backdrop-leave-to {
  opacity: 0;
}

// ── Transitions: panel — mobile (slide up) ────────────────────────────────────

.qem-panel-enter-active {
  transition: transform 0.32s cubic-bezier(0.32, 0.72, 0, 1);
}
.qem-panel-leave-active {
  transition: transform 0.24s cubic-bezier(0.4, 0, 1, 1);
}
.qem-panel-enter-from,
.qem-panel-leave-to {
  transform: translateY(100%);
}

// ── Transitions: panel — desktop (scale + fade) ───────────────────────────────

@media (min-width: 641px) {
  .qem-panel-enter-active {
    transition:
        opacity 0.22s ease,
        transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  .qem-panel-leave-active {
    transition:
        opacity 0.18s ease,
        transform 0.18s ease;
  }
  .qem-panel-enter-from,
  .qem-panel-leave-to {
    opacity: 0;
    transform: scale(0.94) translateY(8px);
  }
}
</style>