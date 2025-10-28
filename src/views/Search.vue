<template>
  <div class="search">
    <h1>搜索页面</h1>
    <el-input 
      v-model="searchQuery" 
      placeholder="请输入搜索关键词"
      class="search-input"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'

const searchQuery = ref('')
</script>

<style scoped>
.search {
  padding: 20px;
}

h1 {
  color: #2c3e50;
  margin-bottom: 20px;
}

.search-input {
  max-width: 400px;
}
</style>