<script setup lang="ts">
import { languageLabels } from '@/mock/data'

defineProps<{
  language: string
}>()
</script>

<template>
  <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-museum-bg text-museum-text">
    🌐 {{ languageLabels[language] || language }}
  </span>
</template>
