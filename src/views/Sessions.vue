<script setup lang="ts">
import { ref, computed } from 'vue'
import { Filter, ChevronRight, Star, MessageSquare, Clock, MapPin, Users, BookOpen, X, UserCircle } from 'lucide-vue-next'
import { useSessionStore } from '@/stores/session'
import { useVisitorStore } from '@/stores/visitor'
import { useFeedbackStore } from '@/stores/feedback'
import { useGalleryStore } from '@/stores/gallery'
import { useAppStore } from '@/stores/app'
import SessionTypeTag from '@/components/common/SessionTypeTag.vue'
import StatusTag from '@/components/common/StatusTag.vue'
import CapacityBar from '@/components/common/CapacityBar.vue'
import LanguageTag from '@/components/common/LanguageTag.vue'
import { exhibitions, guides, languageLabels, typeLabels } from '@/mock/data'
import type { SessionLanguage, SessionType } from '@/types'

const sessionStore = useSessionStore()
const visitorStore = useVisitorStore()
const feedbackStore = useFeedbackStore()
const galleryStore = useGalleryStore()
const appStore = useAppStore()

const filterLanguage = ref<string>('')
const filterType = ref<string>('')
const filterStatus = ref<string>('')
const selectedId = ref<string | null>(null)
const sortKey = ref<string>('startTime')
const sortAsc = ref(true)

const feedbackRating = ref(0)
const feedbackComment = ref('')
const feedbackIssues = ref('')

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

const filteredSessions = computed(() => {
  let result = sessionStore.sessions.slice()
  if (filterLanguage.value) result = result.filter(s => s.language === filterLanguage.value)
  if (filterType.value) result = result.filter(s => s.type === filterType.value)
  if (filterStatus.value) result = result.filter(s => sessionStore.getSessionStatus(s) === filterStatus.value)
  result.sort((a, b) => {
    let cmp = 0
    if (sortKey.value === 'startTime') cmp = a.startTime.localeCompare(b.startTime)
    else if (sortKey.value === 'booked') cmp = a.booked - b.booked
    else if (sortKey.value === 'capacity') cmp = a.capacity - b.capacity
    return sortAsc.value ? cmp : -cmp
  })
  return result
})

const selectedSession = computed(() => selectedId.value ? sessionStore.getSessionById(selectedId.value) : null)
const selectedGallery = computed(() => selectedSession.value ? galleryStore.getGalleryById(selectedSession.value.galleryId) : null)
const visitorStats = computed(() => selectedId.value ? visitorStore.visitorStatsBySession(selectedId.value) : null)
const sessionFeedbacks = computed(() => selectedId.value ? feedbackStore.getFeedbacksBySession(selectedId.value) : [])
const sessionVisitors = computed(() => selectedId.value ? visitorStore.visitorsBySession(selectedId.value) : [])

const visitorPieData = computed(() => {
  if (!visitorStats.value) return []
  const s = visitorStats.value
  const total = s.total || 1
  return [
    { label: '成人', value: s.adults, pct: Math.round(s.adults / total * 100), color: '#C9A96E', bgClass: 'bg-museum-gold' },
    { label: '儿童', value: s.children, pct: Math.round(s.children / total * 100), color: '#E8915A', bgClass: 'bg-museum-orange' },
  ]
})

function selectSession(id: string) {
  selectedId.value = selectedId.value === id ? null : id
  feedbackRating.value = 0
  feedbackComment.value = ''
  feedbackIssues.value = ''
}

function closeDetail() {
  selectedId.value = null
}

function toggleSort(key: string) {
  if (sortKey.value === key) sortAsc.value = !sortAsc.value
  else { sortKey.value = key; sortAsc.value = true }
}

function fmtTime(iso: string) {
  return iso.slice(11, 16)
}

function fmtDate(iso: string) {
  return iso.slice(5, 10)
}

function submitFeedback() {
  if (!selectedSession.value || feedbackRating.value === 0) return
  feedbackStore.addFeedback({
    sessionId: selectedSession.value.id,
    guideId: selectedSession.value.guideId,
    rating: feedbackRating.value,
    comment: feedbackComment.value,
    issues: feedbackIssues.value,
  })
  feedbackRating.value = 0
  feedbackComment.value = ''
  feedbackIssues.value = ''
}

const languageOptions = [
  { value: '', label: '全部语言' },
  { value: 'zh', label: '中文' },
  { value: 'en', label: 'English' },
  { value: 'ja', label: '日本語' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
]

const typeOptions = [
  { value: '', label: '全部类型' },
  { value: 'regular', label: '常规' },
  { value: 'family', label: '亲子' },
  { value: 'group', label: '团体' },
  { value: 'foreign', label: '外语' },
]

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'upcoming', label: '即将开始' },
  { value: 'ongoing', label: '进行中' },
  { value: 'completed', label: '已结束' },
]
</script>

<template>
  <div class="animate-fade-in-up">
    <div class="flex items-end justify-between mb-5">
      <div>
        <p class="text-sm text-museum-muted mb-1 font-sans tracking-wide">场次管理</p>
        <h1 class="text-3xl font-serif font-bold text-museum-text tracking-tight">讲解排班</h1>
      </div>
      <div class="flex items-center gap-2 text-museum-muted">
        <Filter class="w-4 h-4" />
        <span class="text-sm">{{ filteredSessions.length }} 场导览</span>
      </div>
    </div>

    <div class="flex items-center gap-2 mb-4 bg-museum-surface rounded-xl p-3 border border-museum-border/30 shadow-sm">
      <select v-model="filterLanguage" class="bg-museum-bg border border-museum-border/60 rounded-lg px-3 py-1.5 text-sm text-museum-text focus:outline-none focus:ring-1 focus:ring-museum-gold">
        <option v-for="opt in languageOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
      </select>
      <select v-model="filterType" class="bg-museum-bg border border-museum-border/60 rounded-lg px-3 py-1.5 text-sm text-museum-text focus:outline-none focus:ring-1 focus:ring-museum-gold">
        <option v-for="opt in typeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
      </select>
      <select v-model="filterStatus" class="bg-museum-bg border border-museum-border/60 rounded-lg px-3 py-1.5 text-sm text-museum-text focus:outline-none focus:ring-1 focus:ring-museum-gold">
        <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
      </select>
    </div>

    <div class="flex gap-5" style="min-height: calc(100vh - 240px)">
      <div class="bg-museum-surface rounded-xl shadow-sm border border-museum-border/30 overflow-hidden flex-[3]">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-museum-bg/60 text-museum-muted text-xs">
              <th class="text-left px-4 py-3 font-medium">时间</th>
              <th class="text-left px-4 py-3 font-medium">展览</th>
              <th class="text-left px-4 py-3 font-medium">类型</th>
              <th class="text-left px-4 py-3 font-medium">语言</th>
              <th class="text-left px-4 py-3 font-medium">讲解员</th>
              <th class="text-left px-4 py-3 font-medium">集合点</th>
              <th class="text-left px-4 py-3 font-medium cursor-pointer select-none" @click="toggleSort('booked')">
                容量 {{ sortKey === 'booked' ? (sortAsc ? '↑' : '↓') : '' }}
              </th>
              <th class="text-left px-4 py-3 font-medium">状态</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="session in filteredSessions"
              :key="session.id"
              class="border-t border-museum-border/20 cursor-pointer transition-all duration-200"
              :class="selectedId === session.id
                ? 'bg-museum-gold/10 border-l-2 border-l-museum-gold'
                : 'hover:bg-museum-gold/5 border-l-2 border-l-transparent'"
              @click="selectSession(session.id)"
            >
              <td class="px-4 py-3 whitespace-nowrap tabular-nums">
                <div class="text-museum-text font-medium">{{ fmtTime(session.startTime) }}-{{ fmtTime(session.endTime) }}</div>
                <div class="text-[10px] text-museum-muted mt-0.5">{{ fmtDate(session.startTime) }}</div>
              </td>
              <td class="px-4 py-3 max-w-[200px] truncate">
                <span class="font-serif font-semibold text-museum-text">{{ exhibitionMap[session.exhibitionId] || session.exhibitionId }}</span>
              </td>
              <td class="px-4 py-3"><SessionTypeTag :type="session.type" /></td>
              <td class="px-4 py-3"><LanguageTag :language="session.language" /></td>
              <td class="px-4 py-3">
                <span class="flex items-center gap-1.5 text-museum-muted">
                  <div class="w-5 h-5 rounded-full bg-museum-gold/15 flex items-center justify-center text-museum-gold text-[10px] font-serif font-bold">
                    {{ guideAvatarMap[session.guideId] }}
                  </div>
                  {{ guideMap[session.guideId] }}
                </span>
              </td>
              <td class="px-4 py-3 text-museum-muted max-w-[100px] truncate">{{ session.meetingPoint }}</td>
              <td class="px-4 py-3 w-[120px]"><CapacityBar :current="session.booked" :max="session.capacity" size="sm" /></td>
              <td class="px-4 py-3"><StatusTag :status="sessionStore.getSessionStatus(session)" /></td>
            </tr>
            <tr v-if="filteredSessions.length === 0">
              <td colspan="8" class="text-center py-12 text-museum-muted">暂无匹配场次</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="selectedSession" class="bg-museum-surface rounded-xl shadow-sm border border-museum-border/30 flex-[2] animate-slide-in overflow-y-auto max-h-[calc(100vh-240px)]">
        <div class="sticky top-0 bg-museum-surface/95 backdrop-blur-sm z-10 px-5 pt-4 pb-3 border-b border-museum-border/30">
          <div class="flex items-start justify-between">
            <div>
              <h2 class="text-lg font-serif font-bold text-museum-text">{{ exhibitionMap[selectedSession.exhibitionId] }}</h2>
              <div class="flex items-center gap-2 mt-1.5">
                <SessionTypeTag :type="selectedSession.type" />
                <LanguageTag :language="selectedSession.language" />
                <StatusTag :status="sessionStore.getSessionStatus(selectedSession)" />
              </div>
            </div>
            <button class="w-7 h-7 rounded-lg hover:bg-museum-bg flex items-center justify-center text-museum-muted hover:text-museum-text transition-colors" @click="closeDetail">
              <X class="w-4 h-4" />
            </button>
          </div>
        </div>

        <div class="p-5 space-y-5">
          <div class="grid grid-cols-2 gap-3">
            <div class="bg-museum-bg/50 rounded-lg p-3 border border-museum-border/20">
              <div class="flex items-center gap-1.5 text-xs text-museum-muted mb-1">
                <Clock class="w-3 h-3 text-museum-gold" /> 时间
              </div>
              <span class="text-sm font-medium text-museum-text tabular-nums">
                {{ fmtTime(selectedSession.startTime) }} - {{ fmtTime(selectedSession.endTime) }}
              </span>
            </div>
            <div class="bg-museum-bg/50 rounded-lg p-3 border border-museum-border/20">
              <div class="flex items-center gap-1.5 text-xs text-museum-muted mb-1">
                <MapPin class="w-3 h-3 text-museum-gold" /> 集合点
              </div>
              <span class="text-sm font-medium text-museum-text">{{ selectedSession.meetingPoint }}</span>
            </div>
            <div class="bg-museum-bg/50 rounded-lg p-3 border border-museum-border/20">
              <div class="flex items-center gap-1.5 text-xs text-museum-muted mb-1">
                <UserCircle class="w-3 h-3 text-museum-gold" /> 讲解员
              </div>
              <span class="text-sm font-medium text-museum-text">
                {{ guideMap[selectedSession.guideId] }}
              </span>
            </div>
            <div class="bg-museum-bg/50 rounded-lg p-3 border border-museum-border/20">
              <div class="flex items-center gap-1.5 text-xs text-museum-muted mb-1">
                <Users class="w-3 h-3 text-museum-gold" /> 预约
              </div>
              <CapacityBar :current="selectedSession.booked" :max="selectedSession.capacity" />
            </div>
          </div>

          <div v-if="selectedGallery" class="bg-museum-bg/50 rounded-lg p-3 border border-museum-border/20">
            <div class="flex items-center justify-between">
              <span class="text-xs text-museum-muted">展厅</span>
              <span class="text-sm font-medium text-museum-text">{{ selectedGallery.name }}</span>
            </div>
            <div class="mt-2">
              <CapacityBar :current="selectedGallery.currentCount" :max="selectedGallery.capacity" size="sm" />
            </div>
          </div>

          <div v-if="visitorStats" class="border-t border-museum-border/30 pt-4">
            <h3 class="text-sm font-serif font-semibold text-museum-text mb-3 flex items-center gap-1.5">
              <Users class="w-4 h-4 text-museum-gold" /> 观众构成
            </h3>
            <div class="flex items-center gap-4 mb-3">
              <div class="flex-1 h-4 bg-museum-border/30 rounded-full overflow-hidden flex">
                <div
                  v-for="(seg, i) in visitorPieData"
                  :key="i"
                  class="h-full transition-all duration-500"
                  :class="seg.bgClass"
                  :style="{ width: `${seg.pct}%` }"
                />
              </div>
              <span class="text-sm font-medium text-museum-text tabular-nums">{{ visitorStats.total }}人</span>
            </div>
            <div class="grid grid-cols-4 gap-2">
              <div class="bg-museum-bg rounded-lg p-2.5 text-center border border-museum-border/20">
                <div class="text-lg font-serif font-bold text-museum-gold tabular-nums">{{ visitorStats.adults }}</div>
                <div class="text-[10px] text-museum-muted">成人</div>
              </div>
              <div class="bg-museum-bg rounded-lg p-2.5 text-center border border-museum-border/20">
                <div class="text-lg font-serif font-bold text-museum-orange tabular-nums">{{ visitorStats.children }}</div>
                <div class="text-[10px] text-museum-muted">儿童</div>
              </div>
              <div class="bg-museum-bg rounded-lg p-2.5 text-center border border-museum-border/20">
                <div class="text-lg font-serif font-bold text-museum-blue tabular-nums">{{ visitorStats.count }}</div>
                <div class="text-[10px] text-museum-muted">组数</div>
              </div>
              <div class="bg-museum-bg rounded-lg p-2.5 text-center border border-museum-border/20">
                <div class="text-lg font-serif font-bold text-red-500 tabular-nums">{{ visitorStats.withAccessibility }}</div>
                <div class="text-[10px] text-museum-muted">特殊需求</div>
              </div>
            </div>
          </div>

          <div v-if="sessionVisitors.length" class="border-t border-museum-border/30 pt-4">
            <h3 class="text-sm font-serif font-semibold text-museum-text mb-3 flex items-center gap-1.5">
              <Users class="w-4 h-4 text-museum-gold" /> 观众名单
            </h3>
            <div class="space-y-1.5 max-h-[180px] overflow-y-auto">
              <div
                v-for="v in sessionVisitors"
                :key="v.id"
                class="flex items-center justify-between text-sm bg-museum-bg/50 rounded-lg px-3 py-2 border border-museum-border/20"
                :class="v.isLate ? 'border-l-2 border-l-museum-orange' : ''"
              >
                <span class="font-medium text-museum-text">{{ v.name }}</span>
                <div class="flex items-center gap-2">
                  <span class="text-xs text-museum-muted">{{ v.headcount }}人</span>
                  <span v-if="v.isChildGroup" class="text-[10px] text-museum-orange bg-museum-orange/10 px-1.5 py-0.5 rounded">儿童</span>
                  <span v-if="v.isLate" class="text-[10px] text-museum-orange bg-museum-orange/10 px-1.5 py-0.5 rounded">迟到{{ v.lateMinutes }}分钟</span>
                </div>
              </div>
            </div>
          </div>

          <div v-if="selectedSession.keyWorks.length" class="border-t border-museum-border/30 pt-4">
            <h3 class="text-sm font-serif font-semibold text-museum-text mb-3 flex items-center gap-1.5">
              <BookOpen class="w-4 h-4 text-museum-gold" /> 重点展品
            </h3>
            <div class="space-y-1.5">
              <div
                v-for="(work, i) in selectedSession.keyWorks"
                :key="i"
                class="flex items-center gap-2.5 text-sm bg-museum-bg/50 rounded-lg px-3 py-2 border border-museum-border/20"
              >
                <span class="w-5 h-5 rounded bg-museum-gold/10 text-museum-gold text-[10px] font-serif font-bold flex items-center justify-center flex-shrink-0">{{ i + 1 }}</span>
                <span class="text-museum-text">{{ work }}</span>
              </div>
            </div>
          </div>

          <div v-if="appStore.currentRole === 'guide'" class="border-t border-museum-border/30 pt-4">
            <h3 class="text-sm font-serif font-semibold text-museum-text mb-3 flex items-center gap-1.5">
              <MessageSquare class="w-4 h-4 text-museum-gold" /> 提交反馈
            </h3>
            <div class="space-y-3">
              <div class="flex items-center gap-1">
                <button v-for="n in 5" :key="n" class="p-0.5 transition-transform hover:scale-110" @click="feedbackRating = n">
                  <Star class="w-5 h-5" :class="n <= feedbackRating ? 'text-museum-gold fill-museum-gold' : 'text-museum-border'" />
                </button>
                <span class="text-xs text-museum-muted ml-1">{{ feedbackRating > 0 ? feedbackRating + ' 分' : '请评分' }}</span>
              </div>
              <textarea v-model="feedbackComment" rows="2" placeholder="讲解感受与评价..." class="w-full bg-museum-bg border border-museum-border/60 rounded-lg px-3 py-2 text-sm text-museum-text placeholder-museum-muted/50 focus:outline-none focus:ring-1 focus:ring-museum-gold resize-none" />
              <textarea v-model="feedbackIssues" rows="2" placeholder="遇到的问题与建议..." class="w-full bg-museum-bg border border-museum-border/60 rounded-lg px-3 py-2 text-sm text-museum-text placeholder-museum-muted/50 focus:outline-none focus:ring-1 focus:ring-museum-gold resize-none" />
              <button :disabled="feedbackRating === 0" class="w-full py-2.5 rounded-lg text-sm font-medium transition-colors bg-museum-gold text-white hover:bg-museum-gold/90 disabled:opacity-40 disabled:cursor-not-allowed" @click="submitFeedback">提交反馈</button>
            </div>
          </div>

          <div v-if="sessionFeedbacks.length" class="border-t border-museum-border/30 pt-4">
            <h3 class="text-sm font-serif font-semibold text-museum-text mb-3 flex items-center gap-1.5">
              <MessageSquare class="w-4 h-4 text-museum-gold" /> 最近反馈
            </h3>
            <div class="space-y-2.5">
              <div v-for="fb in sessionFeedbacks" :key="fb.id" class="bg-museum-bg/50 rounded-lg p-3 border border-museum-border/20">
                <div class="flex items-center gap-2 mb-1.5">
                  <div class="flex gap-0.5">
                    <Star v-for="n in 5" :key="n" class="w-3 h-3" :class="n <= fb.rating ? 'text-museum-gold fill-museum-gold' : 'text-museum-border'" />
                  </div>
                  <span class="text-xs text-museum-muted">{{ guideMap[fb.guideId] }}</span>
                </div>
                <p class="text-sm text-museum-text leading-relaxed">{{ fb.comment }}</p>
                <p v-if="fb.issues" class="text-xs text-museum-orange mt-1.5 flex items-start gap-1">
                  <span>⚠</span>
                  <span>{{ fb.issues }}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="bg-museum-surface rounded-xl shadow-sm border border-museum-border/30 flex-[2] flex flex-col items-center justify-center text-museum-muted">
        <ChevronRight class="w-10 h-10 text-museum-border mb-3" />
        <p class="text-sm">点击场次查看详情</p>
        <p class="text-xs text-museum-border mt-1">观众结构 · 重点展品 · 讲解反馈</p>
      </div>
    </div>
  </div>
</template>
