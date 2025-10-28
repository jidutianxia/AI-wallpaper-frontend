<template>
  <div class="rounded overflow-hidden shadow hover:shadow-lg transition">
    <img v-lazy="data.thumb" @click="onPreview" class="w-full cursor-pointer" />
    <div class="p-2 flex justify-between items-center">
      <div class="text-sm">{{ data.title }}</div>
      <div class="flex gap-2">
        <el-button size="mini" @click.stop="toggleLike">{{ liked ? '♥' : '♡' }}</el-button>
        <el-button size="mini" @click.stop="download">下载</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
const props = defineProps({ data: Object })
const emit = defineEmits(['preview', 'like'])
const liked = ref(false)
function onPreview(){ emit('preview', props.data) }
function toggleLike(){ liked.value = !liked.value; emit('like', props.data) }
function download(){ window.open(props.data.url, '_blank') }
</script>
