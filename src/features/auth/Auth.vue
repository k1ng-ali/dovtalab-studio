<script setup lang="ts">
import TelegramLoginButton from "@/features/auth/TelegramLoginButton.vue";
import { useRouter } from 'vue-router'

const router = useRouter()

async function onSuccess() {
  await router.push('/')
}

const redirect = (url:string) => {
  window.open(url, '_blank')
}

</script>

<template>
  <div class="auth">
    <div class="auth__card">
      <h2>Добро пажаловать в <span>Dovtalab Studio</span></h2>
      <h3 class="auth__title">Войдите в аккаунт</h3>
      <p class="auth__desc">Используйте Telegram для быстрой и безопасной авторизации</p>
      <TelegramLoginButton @success="onSuccess"
      class="auth__login-button"/>
      <button class="btn-redirect"
              @click="redirect('https://t.me/Dovtalabbot/studio')"
      >Открыть в mini-apps</button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.auth {
  display: flex;
  position: fixed;
  background: #F6F6F6;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  z-index: 99;
  padding: 20px;

  &__card {
    display: flex;
    flex-direction: column;
    align-items: center;
    background: white;
    padding: 20px;
    border-radius: 20px;
    margin: 0 20px;
    box-shadow:
        0 8px 25px rgba(0, 0, 0, 0.12),
        0 2px 6px rgba(0, 0, 0, 0.06);

    & h2 {
      text-align: center;
    }

    & span {
      color: #234970;
    }
  }
  &__desc {
    display: flex;
    text-align: center;
    color: #4F4F4F;
  }

  &__login-button {
    width: 100%;
  }

  .btn-redirect {
    background: #4ade80;
    height: 50px;
    width: 100%;
    border-radius: 10px;
    margin-top: 10px;
    font-size: 15px;
    font-weight: 500;
    box-shadow: 0 2px 8px rgba(42, 171, 238, 0.35);
    border: none;
    cursor: pointer;
    overflow: hidden;
    user-select: none;
    transition: background 0.2s, transform 0.1s, box-shadow 0.2s;

    &:hover{
      background: #45ca76;
    }
  }
}

</style>