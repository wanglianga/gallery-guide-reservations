<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  current: number
  max: number
  showText?: boolean
  size?: 'sm' | 'md'
}>()

const percentage = computed(() => props.max > 0 ? (props.current / props.max) * 100 : 0)
const colorClass = computed(() => {
  if (percentage.value >= 100) return 'bg-museum-red'
  if (percentage.value >= 90) return 'bg-museum-orange'
  if (percentage.value >= 70) return 'bg-museum-gold'
  return 'bg-museum-green'
})

const heightClass = computed(() => props.size === 'sm' ? 'h-1.5' : 'h-2.5')
</script>

<template>
  <div class="flex items-center gap-2">
    <div class="flex-1 bg-museum-border/50 rounded-full overflow-hidden" :class="heightClass">
      <div
        class="rounded-full transition-all duration-500"
        :class="[colorClass, heightClass]"
        :style="{ width: `${Math.min(percentage, 100)}%` }"
      />
    </div>
    <span v-if="showText !== false" class="text-xs text-museum-muted whitespace-nowrap tabular-nums">
      {{ current }}/{{ max }}
    </span>
  </div>
</template>
