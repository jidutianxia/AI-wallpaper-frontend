<template>
  <div>
    <NavBar />
    <MasonryList :items="wallpapers" :loading="loading">
      <template #default="{ item }">
        <WallpaperCard :data="item" @preview="openPreview" @like="doLike"/>
      </template>
    </MasonryList>
    <PreviewModal v-if="showPreview" :data="previewData" @close="showPreview=false" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import MasonryList from '@/components/MasonryList.vue'
import WallpaperCard from '@/components/WallpaperCard.vue'
import PreviewModal from '@/components/PreviewModal.vue'
import { getWallpapers } from '@/api/wallpaper'

const wallpapers = ref([])
const page = ref(1)
const loading = ref(false)
const showPreview = ref(false)
const previewData = ref(null)

async function loadMore(){
  if(loading.value) return
  loading.value = true
  const res = await getWallpapers({ page: page.value })
  wallpapers.value.push(...res.data)
  page.value++
  loading.value = false
}

function openPreview(item){ previewData.value = item; showPreview.value = true }
function doLike(item){ /* 本地 UI 立即更新，后端异步保存 */ }

onMounted(()=>{
  loadMore()
  // 简单滚动监听实现无限加载
  window.addEventListener('scroll', ()=>{
    if(window.innerHeight + window.scrollY + 300 >= document.body.scrollHeight) loadMore()
  })
})
</script>
