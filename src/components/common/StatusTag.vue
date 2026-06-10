<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  status: 'upcoming' | 'ongoing' | 'completed'
}>()

const config: Record<string, { label: string; colorClass: string; bgClass: string }> = {
  upcoming: { label: '即将开始', colorClass: 'text-museum-blue', bgClass: 'bg-museum-blue/10' },
  ongoing: { label: '进行中', colorClass: 'text-museum-green', bgClass: 'bg-museum-green/10' },
  completed: { label: '已结束', colorClass: 'text-museum-muted', bgClass: 'bg-museum-border' },
}

const current = computed(() => config[props.status] || config.upcoming)
</script>

<template>
  <span
    class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
    :class="[current.colorClass, current.bgClass]"
  >
    <span
      v-if="status === 'ongoing'"
      class="w-1.5 h-1.5 rounded-full mr-1.5 bg-museum-green animate-pulse"
    />
    {{ current.label }}
  </span>
</template>
