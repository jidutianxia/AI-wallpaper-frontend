<template>
  <div>
    <Waterfall :list="items" :gutter="12" :columnWidth="250">
      <template #default="{ item }">
        <slot :item="item"></slot>
      </template>
    </Waterfall>
    <div v-if="loading" class="text-center p-4">加载中...</div>
  </div>
</template>

<script setup>
import { Waterfall } from 'vue-waterfall2'
import { defineProps } from 'vue'
defineProps({ items: Array, loading: Boolean })
</script>
