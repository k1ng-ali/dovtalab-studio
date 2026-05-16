<script setup lang="ts">
import { useAuthStore } from "@/features/auth/store.ts";
import { useUser } from "@/features/user/store.ts";
import { useRouter } from "vue-router";

const auth = useAuthStore();
const user = useUser();
const router = useRouter();

const logout = () => {
  auth.logout();
  user.$reset();
  router.push("/auth");
};
</script>

<template>
  <div class="container">
    <div class="wrapper">
      <div class="lock-icon">🔒</div>
      <h2 class="title">Доступ ограничен</h2>
      <p class="message">Сервис доступен только с правом <span class="badge creator">✦ Creator</span></p>
      <button class="logout-button" @click="logout">Выйти</button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: calc(100% - 40px);
  height: 100vh;
  background: #F6F6F6;
  z-index: 90;
}

.wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 40px;
  background: white;
  color: #1F2937;
  border-radius: 16px;
  box-shadow:
      0 8px 25px rgba(0, 0, 0, 0.12),
      0 2px 10px rgba(0, 0, 0, 0.06);
  text-align: center;
  max-width: 360px;
  width: 100%;
}

.lock-icon {
  font-size: 56px;
}

.title {
  color: #1F2937;
  font-size: 22px;
  margin: 0;
}

.message {
  color: #9ca3af;
  font-size: 15px;
  margin: 0;
  line-height: 1.5;
}

.badge {
  display: inline-block;
  background: rgba(255, 192, 45, 0.15);
  color: rgb(138, 106, 30);
  border: 1px solid rgba(255, 192, 45, 0.4);
  border-radius: 6px;
  padding: 1px 8px;
  font-weight: 600;
  font-size: 14px;
}

.badge {
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;

  &.creator {
    background: rgba(78, 190, 194, 0.18);
    color: #234970;
    border: 1px solid rgba(78, 190, 194, 0.4);
  }
}

.logout-button {
  margin-top: 8px;
  width: 100%;
  height: 42px;
  border-radius: 10px;
  border: none;
  background: #374151;
  color: #fff;
  font-size: 15px;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #4b5563;
  }
}
</style>