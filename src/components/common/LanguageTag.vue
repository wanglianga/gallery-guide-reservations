<script setup lang="ts">
import { computed } from 'vue'
import { languageLabels } from '@/mock/data'

const props = defineProps<{
  language: string
}>()

const icon = computed(() => {
  if (props.language === 'sign') return '🤟'
  return '🌐'
})

const bgClass = computed(() => {
  switch (props.language) {
    case 'en': return 'bg-blue-50 text-blue-700'
    case 'ja': return 'bg-rose-50 text-rose-700'
    case 'sign': return 'bg-emerald-50 text-emerald-700'
    case 'fr': return 'bg-indigo-50 text-indigo-700'
    case 'de': return 'bg-amber-50 text-amber-700'
    default: return 'bg-museum-bg text-museum-text'
  }
})
</script>

<template>
  <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium" :class="bgClass">
    {{ icon }} {{ languageLabels[language] || language }}
  </span>
</template>
