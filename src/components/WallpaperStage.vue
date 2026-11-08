<script setup>
import { computed, ref, watch } from "vue";
import MediaSurface from '@/components/MediaSurface.vue';
import { isVideo, mediaPoster } from '@/utils/media';
import {
  Monitor,
  Iphone,
  FullScreen,
  Picture,
  RefreshRight,
  VideoPlay, VideoPause,
} from "@element-plus/icons-vue";
import { getImageUrl } from "@/utils/imageHelper";
import { usePhotoViewer } from "@/composables/usePhotoViewer";
const props = defineProps({ image: { type: Object, required: true } });
const mode = ref("original");
const paused = ref(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
const manualPlay = ref(false);
const motion = computed(() => isVideo(props.image));
function togglePlayback() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches && !manualPlay.value) { manualPlay.value = true; paused.value = false; }
  else { paused.value = !paused.value; manualPlay.value = !paused.value; }
}
const failed = ref(false);
const retry = ref(0);
function retryImage() {
  failed.value = false;
  retry.value++;
}
const src = computed(() =>
  getImageUrl(props.image.url || props.image.src || props.image.thumbUrl),
);
const { open, opening, isOpen } = usePhotoViewer();
const now = new Date();
const clock = now.toLocaleTimeString("zh-CN", {
  hour: "2-digit",
  minute: "2-digit",
});
const date = now.toLocaleDateString("zh-CN", {
  month: "long",
  day: "numeric",
  weekday: "long",
});
watch(src, () => {
  failed.value = false;
  mode.value = "original";
});
</script>
<template>
  <div class="image-studio">
    <div class="studio-canvas" :class="`mode-${mode}`">
      <div
        class="studio-ambient"
        :style="{ backgroundImage: `url(${JSON.stringify(mediaPoster(image))})` }"
        aria-hidden="true"
      />
      <div v-if="failed" class="studio-failed">
        <p>图片加载失败</p>
        <button @click="retryImage">
          <el-icon><RefreshRight /></el-icon>重新加载
        </button>
      </div>
      <div
        v-else
        class="studio-frame"
        :class="`frame-${mode}`"
        role="button" tabindex="0"
        @keydown.enter.self="open([image])"
        :aria-label="`放大${image.title || '壁纸'}`"
        :disabled="opening"
        @click="open([image])"
      >
        <MediaSurface
          :key="`${src}-${retry}`"
          :src="image"
          :alt="image.title || '壁纸'"
          class="wallpaper-image"
          eager autoplay :paused="paused || isOpen || opening" :play="manualPlay"
          :fit="mode === 'original' ? 'contain' : 'cover'"
        />
        <span v-if="mode === 'phone'" class="studio-lock"
          ><small>{{ date }}</small
          ><strong>{{ clock }}</strong></span
        >
        <span
          v-if="mode === 'desktop'"
          class="studio-taskbar"
          aria-hidden="true"
          ><i /><i /><i /><i /><i
        /></span>
        <span class="studio-expand"
          ><el-icon><FullScreen /></el-icon
        ></span>
      </div>
    </div>
    <div class="studio-toolbar" aria-label="上屏预览">
      <button v-if="motion" :aria-label="paused ? '播放动态壁纸' : '暂停动态壁纸'" :title="paused ? '播放' : '暂停'" @click="togglePlayback"><el-icon><VideoPlay v-if="paused" /><VideoPause v-else /></el-icon></button>
      <button
        aria-label="原图"
        title="原图"
        :aria-pressed="mode === 'original'"
        @click="mode = 'original'"
      >
        <el-icon><Picture /></el-icon>
      </button>
      <button
        aria-label="桌面"
        title="桌面"
        :aria-pressed="mode === 'desktop'"
        @click="mode = 'desktop'"
      >
        <el-icon><Monitor /></el-icon>
      </button>
      <button
        aria-label="锁屏"
        title="锁屏"
        :aria-pressed="mode === 'phone'"
        @click="mode = 'phone'"
      >
        <el-icon><Iphone /></el-icon>
      </button>
      <button
        class="studio-zoom"
        :disabled="failed || opening"
        aria-label="全屏查看"
        @click="open([image])"
      >
        <el-icon><FullScreen /></el-icon>
      </button>
    </div>
  </div>
</template>
