<script setup lang="ts">
import {useAuthStore} from "@/features/auth/store.ts";
import { ref } from "vue";
import {useRouter} from "vue-router";
import {useUser} from "@/features/user/store.ts";
import type {TelegramDataTest} from "@/features/auth/types.ts";

const auth = useAuthStore();
const user = useUser();
let ID = ref<number>();
let firstName = ref<string>("");

const router = useRouter();

const login = async () => {
  if (!ID.value) return

  if (!firstName.value) return

  try {
    const data: TelegramDataTest = {
      id: ID.value,
      first_name: firstName.value,
      auth_date: 0,
      hash: "str",
    }
    await auth.login(data);
    await user.fetchMe()
    await router.push("/");
  } catch (error) {
    console.log("Login Failed", error);
  }

}

</script>

<template>
  <div class="container">
      <div class="wrapper">
        <h2 class="title">Авторизация</h2>
        <label for="" class="field">
          <span>ID</span>
          <input type="text" class="input id" v-model="ID" />
        </label>
        <label for="" class="field">
          <span>First Name</span>
          <input type="text" class="input id" v-model="firstName" />
        </label>
        <button
            :class="{
    'login-button': true,
    active: ID && firstName
  }"
            @click="login"
        >
          Войти
        </button>
      </div>
  </div>
</template>

<style scoped lang="scss">
.container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
}
.wrapper {
  display: flex;
  flex-direction: column;
}
.field {
  position: relative;
  display: flex;
  width: 250px;
  margin-bottom: 20px;

  input {
    width: 100%;
    height: 30px;
    padding: 5px 10px;
    font-size: 16px;
    border: none;
    outline: none;
    border-radius: 10px;
  }

  span {
    position: absolute;
    top: -10px;
    left: 10px;
    font-size: 12px;
    opacity: 0.8;
  }
}
.login-button {
  background: #242424;
  height: 30px;
  border-radius: 10px;
  border: none;
  cursor: pointer;

  &.active{
    background: rgb(255, 192, 45);
    color: #111827;
  }
}
</style>