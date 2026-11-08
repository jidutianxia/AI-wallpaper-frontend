<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
const props = defineProps({ kind: { type: String, default: 'like' }, active: Boolean, pendingAction: String, count: Number, label: String })
const emit = defineEmits(['click'])
const celebrating = ref(false)
const busy = computed(() => props.pendingAction === props.kind)
const name = computed(() => props.label || (props.kind === 'favorite' ? '收藏' : '点赞'))
let confirmed = props.active
let timer
watch([() => props.active, busy], ([active, pending]) => {
  clearTimeout(timer)
  celebrating.value = false
  if (pending) return
  if (active && !confirmed) {
    celebrating.value = true
    timer = setTimeout(() => { celebrating.value = false }, 760)
  }
  confirmed = active
})
onBeforeUnmount(() => clearTimeout(timer))
</script>
<template>
  <button type="button" class="reaction-button" :class="[kind, { 'is-active': active, 'is-celebrating': celebrating, 'is-busy': busy }]" :aria-label="`${active ? '取消' : ''}${name}`" :title="`${active ? '取消' : ''}${name}`" :aria-pressed="active" :aria-busy="busy" :disabled="Boolean(pendingAction)" @click.stop="emit('click', $event)" @keydown.stop>
    <span class="reaction-symbol" aria-hidden="true">
      <svg viewBox="0 0 24 24">
        <path v-if="kind === 'favorite'" d="m12 3 2.8 5.7 6.3.9-4.6 4.5 1.1 6.3-5.6-3-5.6 3 1.1-6.3L2.9 9.6l6.3-.9Z"/>
        <path v-else d="M20.8 4.8a5.5 5.5 0 0 0-7.8 0L12 5.9l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.4a5.5 5.5 0 0 0 0-7.8Z"/>
      </svg>
      <span v-if="busy" class="reaction-pending" />
      <span v-else-if="celebrating" class="reaction-rays">
        <i v-for="n in 8" :key="n" :style="{ '--ray': `${n * 45}deg` }"/>
      </span>
    </span>
    <span v-if="count !== undefined" class="reaction-count" :data-count="count">
      <Transition name="reaction-count" mode="out-in">
        <span :key="count">{{ count }}</span>
      </Transition>
    </span>
  </button>
</template>
<style scoped>
.reaction-button { --reaction: var(--app-reaction-like); position: relative; display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-width: 44px; min-height: 44px; padding: 10px 14px; border: 1px solid var(--app-border); border-radius: 28px; color: var(--app-text-secondary); background: var(--app-bg-card); cursor: pointer; transition: color .22s, background .22s, border-color .22s, box-shadow .25s, transform .3s; }
.reaction-button.favorite { --reaction: var(--app-reaction-favorite); }
.reaction-button:not(:disabled):hover { color: var(--reaction); border-color: color-mix(in srgb, var(--reaction) 45%, transparent); box-shadow: 0 5px 22px color-mix(in srgb, var(--reaction) 14%, transparent); transform: translateY(-2px); }
.reaction-button:not(:disabled):active { transform: scale(.92); }
.reaction-button.is-active { color: var(--reaction); border-color: color-mix(in srgb, var(--reaction) 35%, transparent); background: color-mix(in srgb, var(--reaction) 10%, var(--app-bg-card)); }
.reaction-symbol { display: inline-flex; flex: 0 0 20px; width: 20px; height: 20px; position: relative; }
.reaction-symbol svg { width: 100%; height: 100%; stroke: currentColor; stroke-width: 1.7; stroke-linejoin: round; fill: transparent; transition: fill .2s; }
.is-active .reaction-symbol svg { fill: currentColor; }
.is-celebrating .reaction-symbol svg { animation: reaction-pop .65s cubic-bezier(.2,.8,.3,1); }
.reaction-rays, .reaction-pending { position: absolute; inset: -4px; border-radius: 50%; pointer-events: none; }
.reaction-rays { overflow: hidden; }
.reaction-rays i { position: absolute; left: calc(50% - 1.5px); top: calc(50% - 1.5px); width: 3px; height: 3px; border-radius: 50%; background: currentColor; animation: reaction-ray .7s ease-out both; }
.reaction-count { display: inline-grid; overflow: hidden; font-variant-numeric: tabular-nums; min-width: 1ch; font-size: 13px; line-height: 1.2; }
/* Keep the count slot sized while the old value leaves and the new one enters. */
.reaction-count::before { content: attr(data-count); visibility: hidden; }
.reaction-count::before, .reaction-count > span { grid-area: 1 / 1; }
.is-busy { cursor: progress; opacity: .8; }
.reaction-pending { border: 1px solid transparent; border-top-color: var(--reaction); animation: reaction-pending .8s linear infinite; }
.reaction-count-enter-active,.reaction-count-leave-active { transition: transform .16s, opacity .16s; }
.reaction-count-enter-from { transform: translateY(8px); opacity: 0; }
.reaction-count-leave-to { transform: translateY(-8px); opacity: 0; }
@keyframes reaction-pop { 0% { transform: scale(.6); } 42% { transform: scale(1.2) rotate(-8deg); } 70% { transform: scale(.92) rotate(5deg); } 100% { transform: scale(1); } }
@keyframes reaction-ray { from { opacity: 1; transform: rotate(var(--ray)) translateY(-9px); } to { opacity: 0; transform: rotate(var(--ray)) translateY(-13px) scale(.4); } }
@keyframes reaction-pending { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { .reaction-button, .reaction-button * { animation: none !important; transition: none !important; } .reaction-rays { display: none; } }
</style>
