<script setup lang="ts">
import { computed } from 'vue'
import { Bar, Line } from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, Filler } from 'chart.js'
import { BarChart3, TrendingUp, MessageSquare, Star, AlertCircle, Users, Baby, Globe } from 'lucide-vue-next'
import { useSessionStore } from '@/stores/session'
import { useGalleryStore } from '@/stores/gallery'
import { useFeedbackStore } from '@/stores/feedback'
import { useVisitorStore } from '@/stores/visitor'
import { exhibitions, guides, typeLabels } from '@/mock/data'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, Filler)

const sessionStore = useSessionStore()
const galleryStore = useGalleryStore()
const feedbackStore = useFeedbackStore()
const visitorStore = useVisitorStore()

const timeLabels = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00']

const exhibitionMap = computed(() => {
  const m: Record<string, string> = {}
  exhibitions.forEach(e => { m[e.id] = e.title })
  return m
})

const guideMap = computed(() => {
  const m: Record<string, string> = {}
  guides.forEach(g => { m[g.id] = g.name })
  return m
})

const familyCount = computed(() => sessionStore.sessionsByType('family').length)
const groupCount = computed(() => sessionStore.sessionsByType('group').length)
const foreignCount = computed(() => sessionStore.sessionsByType('foreign').length)

const barChartData = computed(() => {
  const familyCounts = timeLabels.map(() => 0)
  const groupCounts = timeLabels.map(() => 0)
  const foreignCounts = timeLabels.map(() => 0)

  sessionStore.sessions.forEach(s => {
    const hour = parseInt(s.startTime.slice(11, 13))
    const idx = hour - 9
    if (idx < 0 || idx >= timeLabels.length) return
    if (s.type === 'family') familyCounts[idx]++
    else if (s.type === 'group') groupCounts[idx]++
    else if (s.type === 'foreign') foreignCounts[idx]++
  })

  return {
    labels: timeLabels,
    datasets: [
      { label: '亲子场', data: familyCounts, backgroundColor: '#E8915A', borderRadius: 6, barPercentage: 0.7 },
      { label: '团体场', data: groupCounts, backgroundColor: '#5A9E6F', borderRadius: 6, barPercentage: 0.7 },
      { label: '外语场', data: foreignCounts, backgroundColor: '#4A7BA7', borderRadius: 6, barPercentage: 0.7 },
    ],
  } as any
})

const barChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'bottom' as const, labels: { usePointStyle: true, padding: 16, font: { family: 'Noto Sans SC', size: 12 } } },
  },
  scales: {
    x: { stacked: true, grid: { display: false }, ticks: { font: { family: 'Noto Sans SC', size: 11 } } },
    y: { stacked: true, beginAtZero: true, ticks: { stepSize: 1, font: { family: 'Noto Sans SC', size: 11 } } },
  },
} as any

const galleryColors = ['#C9A96E', '#E8915A', '#4A7BA7', '#5A9E6F']

const lineChartData = computed(() => {
  const datasets = galleryStore.galleries.map((gallery, i) => {
    const base = gallery.currentCount
    const data = timeLabels.map((_, ti) => {
      const variation = Math.round(Math.sin(ti * 0.8 + i * 1.5) * base * 0.3)
      return Math.max(0, Math.min(gallery.capacity, base + variation))
    })
    const color = galleryColors[i % galleryColors.length]
    return {
      label: gallery.name,
      data,
      borderColor: color,
      backgroundColor: color + '15',
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointHoverRadius: 6,
      pointBackgroundColor: color,
      borderWidth: 2,
    }
  })
  return { labels: timeLabels, datasets } as any
})

const lineChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'bottom' as const, labels: { usePointStyle: true, padding: 16, font: { family: 'Noto Sans SC', size: 12 } } },
  },
  scales: {
    x: { grid: { display: false }, ticks: { font: { family: 'Noto Sans SC', size: 11 } } },
    y: { beginAtZero: true, ticks: { stepSize: 10, font: { family: 'Noto Sans SC', size: 11 } } },
  },
} as any

const avgRating = computed(() => {
  if (feedbackStore.feedbacks.length === 0) return 0
  const sum = feedbackStore.feedbacks.reduce((acc, f) => acc + f.rating, 0)
  return (sum / feedbackStore.feedbacks.length).toFixed(1)
})

const recentFeedbacks = computed(() =>
  [...feedbackStore.feedbacks].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5)
)

const ratingDistribution = computed(() => {
  const dist = [0, 0, 0, 0, 0]
  feedbackStore.feedbacks.forEach(f => { dist[f.rating - 1]++ })
  return dist
})

const maxRatingCount = computed(() => Math.max(...ratingDistribution.value, 1))
</script>

<template>
  <div class="space-y-6 animate-fade-in-up">
    <div class="flex items-end justify-between">
      <div>
        <p class="text-sm text-museum-muted mb-1 font-sans tracking-wide">数据统计</p>
        <h1 class="text-3xl font-serif font-bold text-museum-text tracking-tight">运营总览</h1>
      </div>
      <BarChart3 class="w-6 h-6 text-museum-gold" />
    </div>

    <div class="grid grid-cols-3 gap-4">
      <div class="bg-museum-surface rounded-xl p-4 border border-museum-border/40 shadow-sm">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-10 h-10 rounded-lg bg-museum-orange/10 flex items-center justify-center">
            <Baby class="w-5 h-5 text-museum-orange" />
          </div>
          <div>
            <p class="text-xs text-museum-muted">亲子场</p>
            <p class="text-2xl font-serif font-bold text-museum-orange tabular-nums">{{ familyCount }}</p>
          </div>
        </div>
        <div class="h-1.5 bg-museum-border/30 rounded-full overflow-hidden">
          <div class="h-full bg-museum-orange rounded-full transition-all duration-500" :style="{ width: `${familyCount / sessionStore.sessions.length * 100}%` }" />
        </div>
      </div>
      <div class="bg-museum-surface rounded-xl p-4 border border-museum-border/40 shadow-sm">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-10 h-10 rounded-lg bg-museum-green/10 flex items-center justify-center">
            <Users class="w-5 h-5 text-museum-green" />
          </div>
          <div>
            <p class="text-xs text-museum-muted">团体场</p>
            <p class="text-2xl font-serif font-bold text-museum-green tabular-nums">{{ groupCount }}</p>
          </div>
        </div>
        <div class="h-1.5 bg-museum-border/30 rounded-full overflow-hidden">
          <div class="h-full bg-museum-green rounded-full transition-all duration-500" :style="{ width: `${groupCount / sessionStore.sessions.length * 100}%` }" />
        </div>
      </div>
      <div class="bg-museum-surface rounded-xl p-4 border border-museum-border/40 shadow-sm">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-10 h-10 rounded-lg bg-museum-blue/10 flex items-center justify-center">
            <Globe class="w-5 h-5 text-museum-blue" />
          </div>
          <div>
            <p class="text-xs text-museum-muted">外语场</p>
            <p class="text-2xl font-serif font-bold text-museum-blue tabular-nums">{{ foreignCount }}</p>
          </div>
        </div>
        <div class="h-1.5 bg-museum-border/30 rounded-full overflow-hidden">
          <div class="h-full bg-museum-blue rounded-full transition-all duration-500" :style="{ width: `${foreignCount / sessionStore.sessions.length * 100}%` }" />
        </div>
      </div>
    </div>

    <div class="grid grid-cols-12 gap-5">
      <section class="col-span-7 bg-museum-surface rounded-xl shadow-sm border border-museum-border/30 overflow-hidden">
        <div class="p-5 pb-3 border-b border-museum-border/30">
          <h2 class="text-base font-serif font-semibold text-museum-text flex items-center gap-2">
            <BarChart3 class="w-4 h-4 text-museum-orange" />
            场次占用统计
          </h2>
        </div>
        <div class="p-5 pt-3">
          <div class="h-64">
            <Bar :data="barChartData" :options="barChartOptions" />
          </div>
        </div>
      </section>

      <section class="col-span-5 bg-museum-surface rounded-xl shadow-sm border border-museum-border/30 overflow-hidden">
        <div class="p-5 pb-3 border-b border-museum-border/30">
          <h2 class="text-base font-serif font-semibold text-museum-text flex items-center gap-2">
            <Star class="w-4 h-4 text-museum-gold" />
            评分分布
          </h2>
        </div>
        <div class="p-5 pt-4">
          <div class="flex items-center gap-3 mb-4">
            <span class="text-4xl font-serif font-bold text-museum-gold tabular-nums">{{ avgRating }}</span>
            <div>
              <div class="flex gap-0.5">
                <Star v-for="i in 5" :key="i" class="w-4 h-4" :class="i <= Math.round(Number(avgRating)) ? 'text-museum-gold fill-museum-gold' : 'text-museum-border'" />
              </div>
              <p class="text-xs text-museum-muted mt-0.5">{{ feedbackStore.feedbacks.length }} 条反馈</p>
            </div>
          </div>
          <div class="space-y-2">
            <div v-for="(count, i) in ratingDistribution" :key="i" class="flex items-center gap-2">
              <span class="text-xs text-museum-muted w-6 text-right">{{ 5 - i }}星</span>
              <div class="flex-1 h-2 bg-museum-border/30 rounded-full overflow-hidden">
                <div
                  class="h-full bg-museum-gold rounded-full transition-all duration-500"
                  :style="{ width: `${count / maxRatingCount * 100}%` }"
                />
              </div>
              <span class="text-xs text-museum-muted w-4 tabular-nums">{{ count }}</span>
            </div>
          </div>
        </div>
      </section>
    </div>

    <section class="bg-museum-surface rounded-xl shadow-sm border border-museum-border/30 overflow-hidden">
      <div class="p-5 pb-3 border-b border-museum-border/30">
        <h2 class="text-base font-serif font-semibold text-museum-text flex items-center gap-2">
          <TrendingUp class="w-4 h-4 text-museum-blue" />
          展厅容量趋势
        </h2>
      </div>
      <div class="p-5 pt-3">
        <div class="h-64">
          <Line :data="lineChartData" :options="lineChartOptions" />
        </div>
      </div>
    </section>

    <section class="bg-museum-surface rounded-xl shadow-sm border border-museum-border/30 overflow-hidden">
      <div class="p-5 pb-3 border-b border-museum-border/30 flex items-center justify-between">
        <h2 class="text-base font-serif font-semibold text-museum-text flex items-center gap-2">
          <MessageSquare class="w-4 h-4 text-museum-green" />
          讲解反馈汇总
        </h2>
        <span class="flex items-center gap-1 text-sm text-museum-muted">
          <Star class="w-4 h-4 text-museum-gold fill-museum-gold" />
          平均 {{ avgRating }} 分
        </span>
      </div>
      <div class="p-5 pt-3">
        <div v-if="recentFeedbacks.length === 0" class="text-center text-museum-muted py-12">
          <MessageSquare class="w-10 h-10 mx-auto mb-3 text-museum-border" />
          <p class="text-sm">暂无反馈</p>
        </div>
        <div v-else class="space-y-3">
          <div
            v-for="fb in recentFeedbacks"
            :key="fb.id"
            class="bg-museum-bg/50 rounded-lg p-4 border border-museum-border/20 hover:border-museum-gold/30 transition-colors"
          >
            <div class="flex items-start justify-between mb-2">
              <div class="flex items-center gap-2">
                <span class="text-sm font-serif font-semibold text-museum-text">
                  {{ exhibitionMap[fb.sessionId] || fb.sessionId }}
                </span>
                <span class="text-xs text-museum-muted">·</span>
                <span class="text-xs text-museum-muted">{{ guideMap[fb.guideId] || fb.guideId }}</span>
              </div>
              <div class="flex items-center gap-0.5">
                <Star
                  v-for="i in 5"
                  :key="i"
                  class="w-3.5 h-3.5"
                  :class="i <= fb.rating ? 'text-museum-gold fill-museum-gold' : 'text-museum-border'"
                />
              </div>
            </div>
            <p class="text-sm text-museum-text/80 leading-relaxed line-clamp-2">{{ fb.comment }}</p>
            <div v-if="fb.issues" class="flex items-start gap-1.5 mt-2 text-xs text-museum-orange bg-museum-orange/5 rounded px-2.5 py-1.5">
              <AlertCircle class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>{{ fb.issues }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
