<script setup lang="ts">
import {useUser} from "@/features/user/store.ts";
import {useAuthStore} from "@/features/auth/store.ts";
import {onMounted} from "vue";

const userStore = useUser();
const authStore = useAuthStore();

onMounted(() => {
  userStore.fetchMe()
})

</script>

<template>
  <div class="container">
    <div class="user-name"
      v-if="userStore.isAuthenticated">
      {{ userStore.full_name}}
    </div>
    <router-link to="/auth" class="auth-button"
      v-else
    >
      Авторизация
    </router-link>
  </div>
</template>

<style scoped lang="scss">

.user-name {
    display: flex;
    background: #111827;
    color: #fff;
    width: 100%;
  }
  .auth-button {
    display: flex;
    width: 100%;
    text-align: center;
    justify-content: center;
    align-items: center;
    height: 40px;
    background: #111827;
    color: #fff;
    border-radius: 10px;
    font-size: 20px;
  }
</style>