<script setup lang="ts">
import {useUser} from "@/features/user/store.ts";
import {useAuthStore} from "@/features/auth/store.ts";
import {onMounted} from "vue";
import { AkSignOut } from '@kalimahapps/vue-icons';
import { useRouter} from "vue-router"

const userStore = useUser();
const authStore = useAuthStore();
const router = useRouter();

onMounted(() => {
  userStore.fetchMe()
})

async function onLogout() {
  try {
    await authStore.logout()
    await userStore.clean()
  } catch (error) {

  } finally {
    await router.push('/auth')
  }
}

</script>

<template>
  <div class="container">
    <div class="user-container"
      v-if="userStore.isAuthenticated">
      <h3 class="user-name">{{ userStore.full_name}}</h3>
      <AkSignOut @click="onLogout" class="logout"/>
    </div>
    <router-link to="/auth" class="auth-button"
      v-else
    >
      Авторизация
    </router-link>
  </div>
</template>

<style scoped lang="scss">
.user-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #111827;
  color: #fff;
  width: 100%;
  border-radius: 5px;

  .user-name {
    margin: 5px 10px;
  }
  .logout {
    display: flex;
    width: 20px;
    height: 20px;
    border: #4577a5 solid 1px;
    margin-right: 5px;
    padding: 3px;
    border-radius: 5px;
    transition: background 0.1s ease-in-out;
    cursor: pointer;

    &:hover {
      background: #4577a5;
    }
  }
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