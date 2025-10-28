<template>
  <div class="category">
    <h1>分类页面</h1>
    <p>分类ID: {{ $route.params.id }}</p>
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()
</script>

<style scoped>
.category {
  padding: 20px;
}

h1 {
  color: #2c3e50;
  margin-bottom: 20px;
}
</style>