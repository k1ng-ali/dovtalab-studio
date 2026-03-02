<script setup lang="ts">
import SideBar from "@/components/SideBar.vue";

</script>

<template>
  <div class="layout">
    <SideBar />
    <main class="content">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.layout {
  display: flex;
  height: 100vh;
}

.content {
  flex: 1;
  padding: 30px;
  background: #111827;
  margin-left: 290px;
}
</style>
