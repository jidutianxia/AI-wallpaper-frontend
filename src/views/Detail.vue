<template>
  <div class="detail">
    <h1>壁纸详情页</h1>
    <p>壁纸ID: {{ $route.params.id }}</p>
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()
</script>

<style scoped>
.detail {
  padding: 20px;
}

h1 {
  color: #2c3e50;
  margin-bottom: 20px;
}
</style>