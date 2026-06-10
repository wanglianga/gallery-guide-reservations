<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  type: 'regular' | 'family' | 'group' | 'foreign'
}>()

const config: Record<string, { label: string; colorClass: string; bgClass: string }> = {
  regular: { label: '常规', colorClass: 'text-museum-gold', bgClass: 'bg-museum-gold/10' },
  family: { label: '亲子', colorClass: 'text-museum-orange', bgClass: 'bg-museum-orange/10' },
  group: { label: '团体', colorClass: 'text-museum-green', bgClass: 'bg-museum-green/10' },
  foreign: { label: '外语', colorClass: 'text-museum-blue', bgClass: 'bg-museum-blue/10' },
}

const current = computed(() => config[props.type] || config.regular)
</script>

<template>
  <span
    class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
    :class="[current.colorClass, current.bgClass]"
  >
    {{ current.label }}
  </span>
</template>
