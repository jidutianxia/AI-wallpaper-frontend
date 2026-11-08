<script setup>
import { onMounted, onUnmounted, ref } from "vue";
import { Top } from "@element-plus/icons-vue";
const visible = ref(false);
const updateVisibility = () => {
  visible.value = window.scrollY > 400;
};
onMounted(() => {
  updateVisibility();
  window.addEventListener("scroll", updateVisibility, { passive: true });
});
onUnmounted(() => window.removeEventListener("scroll", updateVisibility));
const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth",
  });
};
</script>
<template>
  <div v-show="visible" class="floating-actions right">
    <el-button
      class="fab"
      circle
      title="返回顶部"
      aria-label="返回顶部"
      @click="scrollToTop"
      ><el-icon><Top /></el-icon
    ></el-button>
  </div>
</template>
