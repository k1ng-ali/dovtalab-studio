<script setup lang="ts">
import UserBage from "@/features/user/components/UserBage.vue";
</script>

<template>
  <aside class="sidebar">
    <div class="content-top">
      <h2>Dovtalab Studio</h2>
      <div class="routs">
      <router-link to="/my-quizzes" class="rout">Мои викторины</router-link>
      <router-link to="/all-quizzes" class="rout">Все викторины</router-link>
      </div>
    </div>
    <div class="content-bottom">
      <UserBage class="user-bage" />
    </div>
  </aside>
</template>

<style scoped lang="scss">
.sidebar {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: fixed;
  left: 0;
  top: 0;
  height: calc(100vh - 40px);
  width: 250px;
  background: #FFC02D;
  color: #111827;
  padding: 20px;
  padding-bottom: 100px;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: url("/assets/sidebar-bg.svg");
    background-repeat: repeat;
    background-size: 300px;
    opacity: 0.3;
    pointer-events: none;
    filter: blur(2px);
  }
}

.routs {
  display: flex;
  flex-direction: column;

  & .rout {
    display: flex;
    margin: 5px 0;
    background: rgba(0, 255, 255, 0.2);
    color: #111827;
    font-weight: bold;
    padding: 5px 10px;
    border: 1px solid rgba(17, 24, 39, 0.5);
    border-radius: 10px;
    text-decoration: none;
    box-shadow: rgba(36, 36, 36, 0.3) 0 0 4px;

    &.router-link-exact-active{
      background: #111827;
      color: white;
    }
  }
}

  .user-bage {
    display: flex;
    justify-content: center;
    width: 100%;
  }
.content-bottom {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}
</style>