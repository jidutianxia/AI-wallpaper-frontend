<script setup>
defineProps({ name: String })
const paths = {
  search: 'm21 21-5-5M19 10.5a8.5 8.5 0 1 1-17 0 8.5 8.5 0 0 1 17 0',
  heart:
    'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z',
  arrow: 'M4 12h16m-6-6 6 6-6 6',
  down: 'M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5',
  close: 'm6 6 12 12M6 18 18 6',
  screen: 'M3 3h18v13H3zM12 16v5M8 21h8',
  phone:
    'M7 2h10a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1ZM10 19h4',
  spark: 'm12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z',
  grid: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
  left: 'm14 5-7 7 7 7',
  right: 'm10 5 7 7-7 7',
  play: 'm8 4 12 8-12 8Z',
  info: 'M12 11v6m0-10v.1M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
  shuffle: 'M3 5h3l12 14h3M3 19h3L18 5h3m-4-3 4 3-4 3m0 8 4 3-4 3',
}
</script>
<template>
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.6"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path :d="paths[name] || paths.spark" />
  </svg>
</template>
