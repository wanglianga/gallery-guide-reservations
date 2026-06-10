<script setup lang="ts">
import { computed } from 'vue'
import { CalendarDays, Users, MapPin, Clock, AlertTriangle, ArrowRight, Activity, Eye, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { useAppStore } from '@/stores/app'
import { useSessionStore } from '@/stores/session'
import { useGalleryStore } from '@/stores/gallery'
import { useVisitorStore } from '@/stores/visitor'
import SessionTypeTag from '@/components/common/SessionTypeTag.vue'
import StatusTag from '@/components/common/StatusTag.vue'
import CapacityBar from '@/components/common/CapacityBar.vue'
import LanguageTag from '@/components/common/LanguageTag.vue'
import { exhibitions, guides } from '@/mock/data'

const appStore = useAppStore()
const sessionStore = useSessionStore()
const galleryStore = useGalleryStore()
const visitorStore = useVisitorStore()

const todaySessions = computed(() => sessionStore.sessionsByDate(appStore.selectedDate))

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

const guideAvatarMap = computed(() => {
  const m: Record<string, string> = {}
  guides.forEach(g => { m[g.id] = g.avatar })
  return m
})

const totalBooked = computed(() =>
  todaySessions.value.reduce((sum, s) => sum + s.booked, 0)
)

const totalCapacity = computed(() =>
  todaySessions.value.reduce((sum, s) => sum + s.capacity, 0)
)

const activeSessions = computed(() =>
  todaySessions.value.filter(s => sessionStore.getSessionStatus(s) === 'ongoing').length
)

const todayVisitors = computed(() => {
  const sessionIds = todaySessions.value.map(s => s.id)
  return visitorStore.visitors.filter(v => sessionIds.includes(v.sessionId))
})

const lateCount = computed(() =>
  todayVisitors.value.filter(v => v.isLate).length
)

function padDate(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

const currentDate = computed(() => {
  const parts = appStore.selectedDate.split('-')
  return { year: Number(parts[0]), month: Number(parts[1]) - 1 }
})

const calendarDays = computed(() => {
  const { year, month } = currentDate.value
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const offset = firstDay === 0 ? 6 : firstDay - 1

  const days: { date: string; day: number; hasSessions: boolean; current: boolean; sessionCount: number }[] = []

  const prevDays = new Date(year, month, 0).getDate()
  for (let i = offset - 1; i >= 0; i--) {
    const d = prevDays - i
    const pm = month === 0 ? 11 : month - 1
    const py = month === 0 ? year - 1 : year
    const dateStr = padDate(py, pm, d)
    const sessions = sessionStore.sessionsByDate(dateStr)
    days.push({ date: dateStr, day: d, hasSessions: sessions.length > 0, current: false, sessionCount: sessions.length })
  }

  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = padDate(year, month, i)
    const sessions = sessionStore.sessionsByDate(dateStr)
    days.push({ date: dateStr, day: i, hasSessions: sessions.length > 0, current: true, sessionCount: sessions.length })
  }

  const remaining = 42 - days.length
  const nm = month === 11 ? 0 : month + 1
  const ny = month === 11 ? year + 1 : year
  for (let i = 1; i <= remaining; i++) {
    const dateStr = padDate(ny, nm, i)
    const sessions = sessionStore.sessionsByDate(dateStr)
    days.push({ date: dateStr, day: i, hasSessions: sessions.length > 0, current: false, sessionCount: sessions.length })
  }

  return days
})

const weekLabels = ['一', '二', '三', '四', '五', '六', '日']

const monthLabel = computed(() => {
  const { year, month } = currentDate.value
  return `${year}年${month + 1}月`
})

function selectDate(date: string) {
  appStore.setSelectedDate(date)
}

function prevMonth() {
  const { year, month } = currentDate.value
  const d = new Date(year, month - 1, 1)
  appStore.setSelectedDate(padDate(d.getFullYear(), d.getMonth(), 1))
}

function nextMonth() {
  const { year, month } = currentDate.value
  const d = new Date(year, month + 1, 1)
  appStore.setSelectedDate(padDate(d.getFullYear(), d.getMonth(), 1))
}

function fmtTime(iso: string) {
  return iso.slice(11, 16)
}

const levelStyles: Record<string, { dot: string; text: string; bg: string }> = {
  normal: { dot: 'bg-emerald-400', text: 'text-emerald-600', bg: 'bg-emerald-50' },
  warning: { dot: 'bg-amber-400 animate-pulse-warning', text: 'text-amber-600', bg: 'bg-amber-50' },
  critical: { dot: 'bg-red-500 animate-pulse', text: 'text-red-600', bg: 'bg-red-50' },
}

const isToday = (date: string) => {
  return date === new Date().toISOString().slice(0, 10)
}
</script>

<template>
  <div class="space-y-6 animate-fade-in-up">
    <div class="flex items-end justify-between">
      <div>
        <p class="text-sm text-museum-muted mb-1 font-sans tracking-wide">导览工作台</p>
        <h1 class="text-3xl font-serif font-bold text-museum-text tracking-tight">
          {{ appStore.selectedDate === new Date().toISOString().slice(0, 10) ? '今日导览' : appStore.selectedDate }}
        </h1>
      </div>
      <div class="flex items-center gap-2 text-museum-gold">
        <CalendarDays class="w-5 h-5" />
        <span class="text-sm font-serif font-semibold">{{ todaySessions.length }} 场导览</span>
      </div>
    </div>

    <div class="grid grid-cols-4 gap-4">
      <div class="bg-museum-surface rounded-xl p-4 border border-museum-border/40 shadow-sm hover:shadow-md transition-shadow">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-museum-gold/10 flex items-center justify-center">
            <CalendarDays class="w-5 h-5 text-museum-gold" />
          </div>
          <div>
            <p class="text-xs text-museum-muted">今日场次</p>
            <p class="text-xl font-serif font-bold text-museum-text tabular-nums">{{ todaySessions.length }}</p>
          </div>
        </div>
      </div>
      <div class="bg-museum-surface rounded-xl p-4 border border-museum-border/40 shadow-sm hover:shadow-md transition-shadow">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
            <Activity class="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <p class="text-xs text-museum-muted">进行中</p>
            <p class="text-xl font-serif font-bold text-emerald-600 tabular-nums">{{ activeSessions }}</p>
          </div>
        </div>
      </div>
      <div class="bg-museum-surface rounded-xl p-4 border border-museum-border/40 shadow-sm hover:shadow-md transition-shadow">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
            <Users class="w-5 h-5 text-museum-blue" />
          </div>
          <div>
            <p class="text-xs text-museum-muted">预约人数</p>
            <p class="text-xl font-serif font-bold text-museum-text tabular-nums">{{ totalBooked }}<span class="text-sm text-museum-muted font-normal">/{{ totalCapacity }}</span></p>
          </div>
        </div>
      </div>
      <div class="bg-museum-surface rounded-xl p-4 border border-museum-border/40 shadow-sm hover:shadow-md transition-shadow">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
            <AlertTriangle class="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <p class="text-xs text-museum-muted">迟到观众</p>
            <p class="text-xl font-serif font-bold text-amber-600 tabular-nums">{{ lateCount }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-12 gap-6">
      <section class="col-span-5 bg-museum-surface rounded-xl shadow-sm border border-museum-border/30 overflow-hidden">
        <div class="p-5 pb-3 flex items-center justify-between border-b border-museum-border/30">
          <h2 class="text-base font-serif font-semibold text-museum-text flex items-center gap-2">
            <CalendarDays class="w-4 h-4 text-museum-gold" />
            展览日历
          </h2>
          <div class="flex items-center gap-2">
            <button class="w-7 h-7 rounded-lg border border-museum-border/60 flex items-center justify-center text-museum-muted hover:text-museum-gold hover:border-museum-gold/40 transition-colors" @click="prevMonth">
              <ChevronLeft class="w-4 h-4" />
            </button>
            <span class="text-sm font-serif font-semibold text-museum-text min-w-[80px] text-center">{{ monthLabel }}</span>
            <button class="w-7 h-7 rounded-lg border border-museum-border/60 flex items-center justify-center text-museum-muted hover:text-museum-gold hover:border-museum-gold/40 transition-colors" @click="nextMonth">
              <ChevronRight class="w-4 h-4" />
            </button>
          </div>
        </div>
        <div class="p-4 pt-3">
          <div class="grid grid-cols-7 gap-0.5 text-center text-xs text-museum-muted mb-1.5">
            <div v-for="w in weekLabels" :key="w" class="py-1 font-medium">{{ w }}</div>
          </div>
          <div class="grid grid-cols-7 gap-0.5">
            <button
              v-for="day in calendarDays"
              :key="day.date"
              class="relative flex flex-col items-center justify-center py-1.5 rounded-lg text-sm transition-all duration-200"
              :class="[
                day.current ? 'text-museum-text' : 'text-museum-border',
                day.date === appStore.selectedDate
                  ? 'bg-museum-gold text-white shadow-sm shadow-museum-gold/30 font-semibold'
                  : isToday(day.date) && day.current
                    ? 'bg-museum-gold/10 ring-1 ring-museum-gold/40 font-medium'
                    : 'hover:bg-museum-gold/5',
              ]"
              @click="selectDate(day.date)"
            >
              {{ day.day }}
              <span
                v-if="day.hasSessions && day.date !== appStore.selectedDate"
                class="w-1 h-1 rounded-full mt-0.5"
                :class="day.sessionCount >= 3 ? 'bg-museum-orange' : 'bg-museum-gold'"
              />
            </button>
          </div>
        </div>
      </section>

      <section class="col-span-7 bg-museum-surface rounded-xl shadow-sm border border-museum-border/30 overflow-hidden">
        <div class="p-5 pb-3 flex items-center justify-between border-b border-museum-border/30">
          <h2 class="text-base font-serif font-semibold text-museum-text flex items-center gap-2">
            <Clock class="w-4 h-4 text-museum-gold" />
            当日场次
          </h2>
          <span class="text-xs text-museum-muted bg-museum-bg px-2 py-0.5 rounded-full">
            {{ appStore.selectedDate }}
          </span>
        </div>
        <div class="p-4 pt-3">
          <div v-if="todaySessions.length === 0" class="text-center text-museum-muted py-12">
            <CalendarDays class="w-10 h-10 mx-auto mb-3 text-museum-border" />
            <p class="text-sm">暂无场次安排</p>
          </div>
          <div v-else class="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
            <router-link
              v-for="session in todaySessions"
              :key="session.id"
              to="/sessions"
              class="block bg-museum-bg/50 rounded-lg p-3.5 border border-museum-border/30 hover:border-museum-gold/40 hover:bg-museum-gold/5 transition-all duration-200 group"
            >
              <div class="flex items-start gap-3">
                <div class="flex flex-col items-center min-w-[48px]">
                  <span class="text-base font-serif font-bold text-museum-text tabular-nums leading-tight">{{ fmtTime(session.startTime) }}</span>
                  <span class="text-[10px] text-museum-muted mt-0.5">{{ fmtTime(session.endTime) }}</span>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-start justify-between mb-1.5">
                    <span class="font-serif text-sm font-semibold text-museum-text leading-tight line-clamp-1 flex-1 mr-2">
                      {{ exhibitionMap[session.exhibitionId] || session.exhibitionId }}
                    </span>
                    <StatusTag :status="sessionStore.getSessionStatus(session)" />
                  </div>
                  <div class="flex items-center gap-1.5 mb-2">
                    <SessionTypeTag :type="session.type" />
                    <LanguageTag :language="session.language" />
                  </div>
                  <div class="flex items-center gap-4 text-xs text-museum-muted">
                    <span class="flex items-center gap-1">
                      <div class="w-5 h-5 rounded-full bg-museum-gold/15 flex items-center justify-center text-museum-gold text-[10px] font-serif font-bold">
                        {{ guideAvatarMap[session.guideId] }}
                      </div>
                      {{ guideMap[session.guideId] }}
                    </span>
                    <span class="flex items-center gap-1">
                      <MapPin class="w-3 h-3" />
                      {{ session.meetingPoint }}
                    </span>
                  </div>
                </div>
                <div class="min-w-[80px]">
                  <CapacityBar :current="session.booked" :max="session.capacity" size="sm" />
                </div>
                <ArrowRight class="w-4 h-4 text-museum-border group-hover:text-museum-gold transition-colors flex-shrink-0 mt-2" />
              </div>
            </router-link>
          </div>
        </div>
      </section>
    </div>

    <section class="bg-museum-surface rounded-xl shadow-sm border border-museum-border/30 overflow-hidden">
      <div class="p-5 pb-3 flex items-center justify-between border-b border-museum-border/30">
        <h2 class="text-base font-serif font-semibold text-museum-text flex items-center gap-2">
          <AlertTriangle class="w-4 h-4 text-museum-gold" />
          展厅限流状态
        </h2>
        <span class="text-xs text-museum-muted">实时监控</span>
      </div>
      <div class="p-4 pt-3">
        <div class="grid grid-cols-4 gap-3">
          <div
            v-for="gallery in galleryStore.galleries"
            :key="gallery.id"
            class="rounded-lg p-4 border transition-all duration-300"
            :class="[
              levelStyles[galleryStore.getOccupancyLevel(gallery)].bg,
              galleryStore.getOccupancyLevel(gallery) === 'critical' ? 'border-red-200 shadow-sm shadow-red-100' : 'border-museum-border/30',
            ]"
          >
            <div class="flex items-center justify-between mb-2">
              <span class="font-serif text-sm font-semibold text-museum-text truncate">{{ gallery.name }}</span>
              <div
                class="w-2.5 h-2.5 rounded-full"
                :class="levelStyles[galleryStore.getOccupancyLevel(gallery)].dot"
              />
            </div>
            <div class="mb-2">
              <span class="text-2xl font-serif font-bold tabular-nums" :class="levelStyles[galleryStore.getOccupancyLevel(gallery)].text">
                {{ gallery.currentCount }}
              </span>
              <span class="text-sm text-museum-muted">/{{ gallery.capacity }}</span>
            </div>
            <CapacityBar :current="gallery.currentCount" :max="gallery.capacity" size="sm" :show-text="false" />
            <div class="mt-2 text-xs" :class="levelStyles[galleryStore.getOccupancyLevel(gallery)].text">
              <span v-if="galleryStore.getOccupancyLevel(gallery) === 'critical'">已满 · 暂停入场</span>
              <span v-else-if="galleryStore.getOccupancyLevel(gallery) === 'warning'">接近满员</span>
              <span v-else>正常开放</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
