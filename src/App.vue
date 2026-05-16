<script setup lang="ts">
import Accessdenied from "@/pages/Accessdenied.vue";
import Navigator from "@/features/navigator/Navigator.vue";
import {useUser} from "@/features/user/store.ts"
import {computed, onMounted, ref, watch} from "vue"
import {useAuthStore} from "@/features/auth/store.ts";
import {useRouter} from "vue-router";
import {http} from "@/shared/api/http.ts"
import {useTelegramEnv} from "@/features/auth/composables/useTelegramEnv.ts";

const user = useUser();

const is_creator = computed(() => user.isCreator)
const { isTelegramEnv, getInitData } = useTelegramEnv()


const authStore = useAuthStore()
const router = useRouter()
// 'loading' | 'ok' | 'error'
const appState = ref<'loading' | 'ok' | 'error' | 'auth'>('loading')

// ── Debug log ──────────────────────────────────────────────────

// ───────────────────────────────────────────────────────────────

watch(() => authStore.isAuthenticated, (authenticated) => {
  if (authenticated) {
    appState.value = 'ok'
  }
})

onMounted(async () => {
  // 0. Dev bypass
  if (import.meta.env.VITE_DEV_MODE === 'true') {
    try {
      console.log("dev login...")

      const { data } = await http.post('/auth/dev-login')
      authStore.accessToken = data.access_token
      authStore.status = 'authenticated'
      appState.value = 'ok'
      await user.fetchProfile()
      await router.push('/')
    } catch {
      appState.value = 'auth'
    }
    return
  }

  // 0. Вернулись с мобильного редиректа Telegram OAuth
  const redirectCode = sessionStorage.getItem('tg_auth_code')
  const redirectState = sessionStorage.getItem('tg_auth_state_returned')
  const savedState = sessionStorage.getItem('tg_auth_state')

  if (redirectCode) {
    sessionStorage.removeItem('tg_auth_code')
    sessionStorage.removeItem('tg_auth_state_returned')
    sessionStorage.removeItem('tg_auth_state')
    console.log("redirect state", redirectState)

    if (redirectState !== savedState) {
      appState.value = 'auth'  // State mismatch — показать экран входа
    } else {
      const nonce = sessionStorage.getItem('tg_auth_nonce') ?? ''
      const codeVerifier = sessionStorage.getItem('tg_code_verifier') ?? ''
      sessionStorage.removeItem('tg_auth_nonce')
      sessionStorage.removeItem('tg_code_verifier')

      try {
        await authStore.loginWithTelegram({
          code: redirectCode,
          nonce,
          code_verifier: codeVerifier,
          redirect_uri: import.meta.env.VITE_TELEGRAM_REDIRECT_URI,
        })
        appState.value = 'ok'
        await router.push('/')
      } catch {
        appState.value = 'auth'
      }
    }
    return
  }

  // 1. Уже есть accessToken в памяти
  if (authStore.accessToken) {
    console.log("has access...")
    appState.value = 'ok'
    await router.push('/')
    return
  }

  // 2. Telegram Mini App — initData есть, сразу логиним
  if (isTelegramEnv) {
    console.log("mini app login...")
    const initData = getInitData()!
    try {
      await authStore.login(initData)
      appState.value = 'ok'
      await router.push('/')
    } catch {
      appState.value = 'error'
    }
    return
  }

  // 3. Обычный браузер — пробуем тихий рефреш (есть кука)
  try {
    await authStore.refresh()
    appState.value = 'ok'
    console.log("refreshed tokens...")
    await router.push('/')
    return
  } catch {
    appState.value = 'auth'  // показываем кнопку виджета
  }


  // 4. Обычный браузер → показываем Auth с кнопкой виджета
  appState.value = 'auth'
})
</script>

<template>
  <Accessdenied v-if="!is_creator && appState === 'ok'"
                class="accessdenied"
  />
  <Navigator />
  <div class="layout">
    <main class="content">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.layout {
  display: flex;
  height: 100vh;
  width: 100%;
}

.content {
  display: flex;
  width: calc(100% - 40px);
  padding: 20px;
}
.accessdenied {
  display: flex;
  position: fixed;
  width: 100%;
  height: 100%;
  z-index: 99;
}
</style>
