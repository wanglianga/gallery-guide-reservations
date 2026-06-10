<script setup lang="ts">
import { ref, computed } from 'vue'
import { Search, Plus, Clock, AlertCircle, Baby, Accessibility, Phone, UserPlus, X, Users, Eye, ArrowRightLeft, Headphones, Calendar, FileText } from 'lucide-vue-next'
import { useVisitorStore } from '@/stores/visitor'
import { useSessionStore } from '@/stores/session'
import { useAppStore } from '@/stores/app'
import SessionTypeTag from '@/components/common/SessionTypeTag.vue'
import CapacityBar from '@/components/common/CapacityBar.vue'
import { exhibitions, guides, languageLabels, accessibilityLabels, relocationTypeLabels } from '@/mock/data'
import type { Visitor, SessionLanguage, AccessibilityNeed, RelocationType } from '@/types'

const visitorStore = useVisitorStore()
const sessionStore = useSessionStore()
const appStore = useAppStore()

const showPanel = ref(false)
const lateDialogId = ref<string | null>(null)
const lateMinutes = ref(0)
const viewVisitor = ref<Visitor | null>(null)
const showRelocateDialog = ref(false)
const relocateVisitorId = ref<string | null>(null)
const relocateType = ref<RelocationType>('next-session')
const relocateReason = ref('')
const relocateSessionId = ref('')

const form = ref({
  sessionId: '',
  name: '',
  phone: '',
  headcount: 1,
  languagePref: 'zh' as SessionLanguage,
  isChildGroup: false,
  childAgeRange: '',
  accessibilityNeeds: [] as AccessibilityNeed[],
})

const exhibitionMap = computed(() => {
  const m: Record<string, string> = {}
  exhibitions.forEach(e => { m[e.id] = e.title })
  return m
})

const sessionOptions = computed(() =>
  sessionStore.sessions.map(s => ({
    id: s.id,
    label: `${fmtTime(s.startTime)}-${fmtTime(s.endTime)} ${exhibitionMap.value[s.exhibitionId] || ''}`,
    capacity: s.capacity,
    booked: s.booked,
    type: s.type,
    language: s.language,
  }))
)

const languageOptions = Object.entries(languageLabels).map(([v, l]) => ({ value: v, label: l }))
const accessibilityOptions = Object.entries(accessibilityLabels).map(([v, l]) => ({ value: v as AccessibilityNeed, label: l }))

const totalVisitors = computed(() => visitorStore.filteredVisitors.reduce((sum, v) => sum + v.headcount, 0))
const lateVisitors = computed(() => visitorStore.filteredVisitors.filter(v => v.isLate).length)
const childGroups = computed(() => visitorStore.filteredVisitors.filter(v => v.isChildGroup).length)
const accessibilityVisitors = computed(() => visitorStore.filteredVisitors.filter(v => v.accessibilityNeeds.length > 0).length)

function fmtTime(iso: string) {
  return iso.slice(11, 16)
}

function getSessionInfo(sessionId: string) {
  const s = sessionStore.getSessionById(sessionId)
  if (!s) return ''
  const ex = exhibitionMap.value[s.exhibitionId] || ''
  return `${fmtTime(s.startTime)} ${ex}`
}

function resetForm() {
  form.value = { sessionId: '', name: '', phone: '', headcount: 1, languagePref: 'zh', isChildGroup: false, childAgeRange: '', accessibilityNeeds: [] }
}

function openPanel() {
  resetForm()
  showPanel.value = true
}

function closePanel() {
  showPanel.value = false
}

function submitVisitor() {
  if (!form.value.sessionId || !form.value.name.trim() || !form.value.phone.trim()) return
  visitorStore.addVisitor({
    sessionId: form.value.sessionId,
    name: form.value.name.trim(),
    phone: form.value.phone.trim(),
    headcount: form.value.headcount,
    languagePref: form.value.languagePref,
    isChildGroup: form.value.isChildGroup,
    childAgeRange: form.value.childAgeRange,
    accessibilityNeeds: [...form.value.accessibilityNeeds],
    isLate: false,
    lateMinutes: 0,
  })
  sessionStore.updateBooked(form.value.sessionId, form.value.headcount)
  closePanel()
}

function openLateDialog(id: string) {
  lateDialogId.value = id
  lateMinutes.value = 5
}

function confirmLate() {
  if (lateDialogId.value && lateMinutes.value > 0) {
    visitorStore.markLate(lateDialogId.value, lateMinutes.value)
  }
  lateDialogId.value = null
}

function toggleAccessibility(need: AccessibilityNeed) {
  const idx = form.value.accessibilityNeeds.indexOf(need)
  if (idx >= 0) form.value.accessibilityNeeds.splice(idx, 1)
  else form.value.accessibilityNeeds.push(need)
}

function viewVisitorDetail(visitor: Visitor) {
  viewVisitor.value = visitor
}

function closeVisitorDetail() {
  viewVisitor.value = null
}

function openRelocateDialog(visitorId: string) {
  relocateVisitorId.value = visitorId
  relocateType.value = 'next-session'
  relocateReason.value = ''
  relocateSessionId.value = ''
  showRelocateDialog.value = true
}

function closeRelocateDialog() {
  showRelocateDialog.value = false
  relocateVisitorId.value = null
}

const relocateVisitor = computed(() => {
  if (!relocateVisitorId.value) return null
  return visitorStore.visitors.find(v => v.id === relocateVisitorId.value) || null
})

const nextAvailableSessions = computed(() => {
  if (!relocateVisitor.value) return []
  const current = sessionStore.getSessionById(relocateVisitor.value.sessionId)
  if (!current) return []
  return sessionStore.sessions
    .filter(s => s.startTime > current.startTime && s.language === relocateVisitor.value!.languagePref)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
    .slice(0, 5)
})

const visitorRelocations = computed(() => {
  if (!viewVisitor.value) return []
  return visitorStore.getRelocationsByVisitor(viewVisitor.value.id)
})

function confirmRelocate() {
  if (!relocateVisitorId.value || !relocateVisitor.value) return

  const newSessionId = relocateType.value === 'next-session' ? relocateSessionId.value : null

  visitorStore.addRelocation({
    visitorId: relocateVisitorId.value,
    originalSessionId: relocateVisitor.value.sessionId,
    newSessionId,
    type: relocateType.value,
    reason: relocateReason.value || `迟到${relocateVisitor.value.lateMinutes}分钟，${relocationTypeLabels[relocateType.value]}`,
    lateMinutes: relocateVisitor.value.lateMinutes,
  })

  if (relocateType.value === 'next-session' && relocateSessionId.value) {
    sessionStore.updateBooked(relocateVisitor.value.sessionId, -relocateVisitor.value.headcount)
    sessionStore.updateBooked(relocateSessionId.value, relocateVisitor.value.headcount)
  } else if (relocateType.value === 'audio-guide') {
    sessionStore.updateBooked(relocateVisitor.value.sessionId, -relocateVisitor.value.headcount)
  }

  closeRelocateDialog()
}
</script>

<template>
  <div class="animate-fade-in-up">
    <div class="flex items-end justify-between mb-5">
      <div>
        <p class="text-sm text-museum-muted mb-1 font-sans tracking-wide">观众管理</p>
        <h1 class="text-3xl font-serif font-bold text-museum-text tracking-tight">预约名单</h1>
      </div>
      <button class="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium bg-museum-gold text-white hover:bg-museum-gold/90 transition-colors shadow-sm shadow-museum-gold/20" @click="openPanel">
        <UserPlus class="w-4 h-4" /> 新增预约
      </button>
    </div>

    <div class="grid grid-cols-4 gap-3 mb-5">
      <div class="bg-museum-surface rounded-xl p-3.5 border border-museum-border/40 shadow-sm">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-museum-gold/10 flex items-center justify-center">
            <Users class="w-4 h-4 text-museum-gold" />
          </div>
          <div>
            <p class="text-[10px] text-museum-muted">总人数</p>
            <p class="text-lg font-serif font-bold text-museum-text tabular-nums">{{ totalVisitors }}</p>
          </div>
        </div>
      </div>
      <div class="bg-museum-surface rounded-xl p-3.5 border border-museum-border/40 shadow-sm">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
            <Clock class="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <p class="text-[10px] text-museum-muted">迟到</p>
            <p class="text-lg font-serif font-bold text-amber-600 tabular-nums">{{ lateVisitors }}</p>
          </div>
        </div>
      </div>
      <div class="bg-museum-surface rounded-xl p-3.5 border border-museum-border/40 shadow-sm">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-museum-orange/10 flex items-center justify-center">
            <Baby class="w-4 h-4 text-museum-orange" />
          </div>
          <div>
            <p class="text-[10px] text-museum-muted">儿童团队</p>
            <p class="text-lg font-serif font-bold text-museum-orange tabular-nums">{{ childGroups }}</p>
          </div>
        </div>
      </div>
      <div class="bg-museum-surface rounded-xl p-3.5 border border-museum-border/40 shadow-sm">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-museum-blue/10 flex items-center justify-center">
            <Accessibility class="w-4 h-4 text-museum-blue" />
          </div>
          <div>
            <p class="text-[10px] text-museum-muted">无障碍需求</p>
            <p class="text-lg font-serif font-bold text-museum-blue tabular-nums">{{ accessibilityVisitors }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="flex items-center gap-3 mb-4 bg-museum-surface rounded-xl p-3 border border-museum-border/30 shadow-sm">
      <Search class="w-4 h-4 text-museum-muted flex-shrink-0" />
      <input
        :value="visitorStore.searchQuery"
        type="text"
        placeholder="搜索姓名 / 手机号"
        class="flex-1 bg-museum-bg border border-museum-border/60 rounded-lg px-3 py-1.5 text-sm text-museum-text placeholder-museum-muted/50 focus:outline-none focus:ring-1 focus:ring-museum-gold"
        @input="visitorStore.setSearchQuery(($event.target as HTMLInputElement).value)"
      />
      <select
        :value="visitorStore.filterSessionId"
        class="bg-museum-bg border border-museum-border/60 rounded-lg px-3 py-1.5 text-sm text-museum-text focus:outline-none focus:ring-1 focus:ring-museum-gold"
        @change="visitorStore.setFilterSessionId(($event.target as HTMLSelectElement).value)"
      >
        <option value="">全部场次</option>
        <option v-for="opt in sessionOptions" :key="opt.id" :value="opt.id">{{ opt.label }}</option>
      </select>
    </div>

    <div class="bg-museum-surface rounded-xl shadow-sm border border-museum-border/30 overflow-hidden">
      <table class="w-full text-sm">
        <thead>
          <tr class="bg-museum-bg/60 text-museum-muted text-xs">
            <th class="text-left px-4 py-3 font-medium">姓名</th>
            <th class="text-left px-4 py-3 font-medium">手机号</th>
            <th class="text-left px-4 py-3 font-medium">人数</th>
            <th class="text-left px-4 py-3 font-medium">语言</th>
            <th class="text-left px-4 py-3 font-medium">儿童</th>
            <th class="text-left px-4 py-3 font-medium">无障碍</th>
            <th class="text-left px-4 py-3 font-medium">场次</th>
            <th class="text-left px-4 py-3 font-medium">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="v in visitorStore.filteredVisitors"
            :key="v.id"
            class="border-t border-museum-border/20 transition-colors hover:bg-museum-gold/5"
            :class="[
              v.isLate ? 'border-l-2 border-l-museum-orange bg-museum-orange/5' : v.accessibilityNeeds.length ? 'border-l-2 border-l-museum-blue' : 'border-l-2 border-l-transparent',
            ]"
          >
            <td class="px-4 py-3">
              <span class="flex items-center gap-1.5">
                <span class="font-medium text-museum-text">{{ v.name }}</span>
                <AlertCircle v-if="v.isLate" class="w-3.5 h-3.5 text-museum-orange" />
              </span>
            </td>
            <td class="px-4 py-3 text-museum-muted whitespace-nowrap">
              <span class="flex items-center gap-1"><Phone class="w-3 h-3" />{{ v.phone }}</span>
            </td>
            <td class="px-4 py-3 tabular-nums text-museum-text font-medium">{{ v.headcount }}</td>
            <td class="px-4 py-3 text-museum-muted text-xs">{{ languageLabels[v.languagePref] }}</td>
            <td class="px-4 py-3">
              <span v-if="v.isChildGroup" class="inline-flex items-center gap-1 text-museum-orange">
                <Baby class="w-3.5 h-3.5" /> <span class="text-xs">{{ v.childAgeRange }}</span>
              </span>
              <span v-else class="text-museum-muted text-xs">—</span>
            </td>
            <td class="px-4 py-3">
              <span v-if="v.accessibilityNeeds.length" class="flex flex-wrap gap-1">
                <span v-for="need in v.accessibilityNeeds" :key="need" class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium text-museum-blue bg-museum-blue/10">
                  <Accessibility class="w-3 h-3" />{{ accessibilityLabels[need] }}
                </span>
              </span>
              <span v-else class="text-museum-muted text-xs">—</span>
            </td>
            <td class="px-4 py-3 text-museum-muted max-w-[160px] truncate text-xs">{{ getSessionInfo(v.sessionId) }}</td>
            <td class="px-4 py-3">
              <div class="flex items-center gap-2">
                <button class="text-xs text-museum-gold hover:underline" @click="viewVisitorDetail(v)">详情</button>
                <button v-if="!v.isLate" class="text-xs text-museum-orange hover:underline" @click="openLateDialog(v.id)">标记迟到</button>
                <button v-if="v.isLate && v.sessionId" class="text-xs text-museum-blue hover:underline" @click="openRelocateDialog(v.id)">重新安置</button>
                <span v-else-if="v.isLate" class="text-xs text-museum-orange">{{ v.lateMinutes }}分钟</span>
              </div>
            </td>
          </tr>
          <tr v-if="visitorStore.filteredVisitors.length === 0">
            <td colspan="8" class="text-center py-12 text-museum-muted">暂无匹配观众</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="lateDialogId" class="fixed inset-0 z-50 flex items-center justify-center bg-black/30" @click.self="lateDialogId = null">
      <div class="bg-museum-surface rounded-xl shadow-lg p-5 w-80 animate-slide-in border border-museum-border/30">
        <h3 class="text-base font-serif font-semibold text-museum-text mb-3 flex items-center gap-1.5">
          <Clock class="w-4 h-4 text-museum-orange" /> 迟到记录
        </h3>
        <label class="block text-sm text-museum-muted mb-1">迟到分钟数</label>
        <input v-model.number="lateMinutes" type="number" min="1" class="w-full bg-museum-bg border border-museum-border/60 rounded-lg px-3 py-2 text-sm text-museum-text focus:outline-none focus:ring-1 focus:ring-museum-gold mb-4" />
        <div class="flex gap-2">
          <button class="flex-1 py-2 rounded-lg text-sm border border-museum-border/60 text-museum-muted hover:bg-museum-bg transition-colors" @click="lateDialogId = null">取消</button>
          <button class="flex-1 py-2 rounded-lg text-sm font-medium bg-museum-orange text-white hover:bg-museum-orange/90 transition-colors" @click="confirmLate">确认</button>
        </div>
      </div>
    </div>

    <div v-if="viewVisitor" class="fixed inset-0 z-50 flex items-center justify-center bg-black/30" @click.self="closeVisitorDetail">
      <div class="bg-museum-surface rounded-xl shadow-lg p-5 w-96 animate-slide-in border border-museum-border/30">
        <div class="flex items-start justify-between mb-4">
          <h3 class="text-lg font-serif font-bold text-museum-text">{{ viewVisitor.name }}</h3>
          <button class="w-7 h-7 rounded-lg hover:bg-museum-bg flex items-center justify-center text-museum-muted" @click="closeVisitorDetail">
            <X class="w-4 h-4" />
          </button>
        </div>
        <div class="space-y-3">
          <div class="grid grid-cols-2 gap-3">
            <div class="bg-museum-bg/50 rounded-lg p-3 border border-museum-border/20">
              <p class="text-[10px] text-museum-muted mb-0.5">手机号</p>
              <p class="text-sm text-museum-text">{{ viewVisitor.phone }}</p>
            </div>
            <div class="bg-museum-bg/50 rounded-lg p-3 border border-museum-border/20">
              <p class="text-[10px] text-museum-muted mb-0.5">人数</p>
              <p class="text-sm text-museum-text">{{ viewVisitor.headcount }}人</p>
            </div>
            <div class="bg-museum-bg/50 rounded-lg p-3 border border-museum-border/20">
              <p class="text-[10px] text-museum-muted mb-0.5">语言偏好</p>
              <p class="text-sm text-museum-text">{{ languageLabels[viewVisitor.languagePref] }}</p>
            </div>
            <div class="bg-museum-bg/50 rounded-lg p-3 border border-museum-border/20">
              <p class="text-[10px] text-museum-muted mb-0.5">场次</p>
              <p class="text-sm text-museum-text truncate">{{ getSessionInfo(viewVisitor.sessionId) }}</p>
            </div>
          </div>
          <div v-if="viewVisitor.isChildGroup" class="bg-museum-orange/5 rounded-lg p-3 border border-museum-orange/20">
            <div class="flex items-center gap-1.5 text-museum-orange mb-1">
              <Baby class="w-4 h-4" />
              <span class="text-sm font-medium">儿童团队</span>
            </div>
            <p class="text-sm text-museum-muted">年龄范围：{{ viewVisitor.childAgeRange }}</p>
          </div>
          <div v-if="viewVisitor.accessibilityNeeds.length" class="bg-museum-blue/5 rounded-lg p-3 border border-museum-blue/20">
            <div class="flex items-center gap-1.5 text-museum-blue mb-1">
              <Accessibility class="w-4 h-4" />
              <span class="text-sm font-medium">无障碍需求</span>
            </div>
            <div class="flex flex-wrap gap-1.5">
              <span v-for="need in viewVisitor.accessibilityNeeds" :key="need" class="px-2 py-0.5 rounded text-xs text-museum-blue bg-museum-blue/10">
                {{ accessibilityLabels[need] }}
              </span>
            </div>
          </div>
          <div v-if="viewVisitor.isLate" class="bg-amber-50 rounded-lg p-3 border border-amber-200">
            <div class="flex items-center gap-1.5 text-amber-600 mb-1">
              <Clock class="w-4 h-4" />
              <span class="text-sm font-medium">迟到记录</span>
            </div>
            <p class="text-sm text-amber-700">迟到 {{ viewVisitor.lateMinutes }} 分钟</p>
          </div>
          <div v-if="visitorRelocations.length" class="bg-museum-blue/5 rounded-lg p-3 border border-museum-blue/20">
            <div class="flex items-center gap-1.5 text-museum-blue mb-2">
              <ArrowRightLeft class="w-4 h-4" />
              <span class="text-sm font-medium">安置变更记录</span>
            </div>
            <div class="space-y-2">
              <div v-for="r in visitorRelocations" :key="r.id" class="text-xs bg-museum-bg/50 rounded p-2 border border-museum-border/20">
                <div class="flex items-center justify-between mb-1">
                  <span class="font-medium text-museum-text">{{ relocationTypeLabels[r.type] }}</span>
                  <span class="text-museum-muted">{{ r.createdAt.slice(5, 16) }}</span>
                </div>
                <p class="text-museum-muted text-xs">{{ r.reason }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showRelocateDialog && relocateVisitor" class="fixed inset-0 z-50 flex items-center justify-center bg-black/30" @click.self="closeRelocateDialog">
      <div class="bg-museum-surface rounded-xl shadow-lg p-5 w-[440px] animate-slide-in border border-museum-border/30">
        <div class="flex items-start justify-between mb-4">
          <h3 class="text-lg font-serif font-bold text-museum-text flex items-center gap-2">
            <ArrowRightLeft class="w-5 h-5 text-museum-blue" />
            迟到观众重新安置
          </h3>
          <button class="w-7 h-7 rounded-lg hover:bg-museum-bg flex items-center justify-center text-museum-muted" @click="closeRelocateDialog">
            <X class="w-4 h-4" />
          </button>
        </div>

        <div class="bg-museum-orange/5 rounded-lg p-3 border border-museum-orange/20 mb-4">
          <div class="flex items-center gap-2 text-museum-orange mb-1">
            <AlertCircle class="w-4 h-4" />
            <span class="text-sm font-medium">{{ relocateVisitor.name }} · 迟到 {{ relocateVisitor.lateMinutes }} 分钟</span>
          </div>
          <p class="text-xs text-museum-muted">原预约：{{ getSessionInfo(relocateVisitor.sessionId) }}</p>
        </div>

        <div class="space-y-3 mb-4">
          <p class="text-sm text-museum-text font-medium">请选择安置方式</p>

          <label class="flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all" :class="relocateType === 'next-session' ? 'border-museum-gold bg-museum-gold/5' : 'border-museum-border/40 hover:border-museum-gold/50'">
            <input type="radio" v-model="relocateType" value="next-session" class="mt-0.5 accent-museum-gold" />
            <div class="flex-1">
              <div class="flex items-center gap-1.5 text-sm font-medium text-museum-text">
                <Calendar class="w-4 h-4 text-museum-gold" />
                等待下一场
              </div>
              <p class="text-xs text-museum-muted mt-0.5">调整到同语言的下一场次，保留预约信息</p>
            </div>
          </label>

          <label class="flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all" :class="relocateType === 'tail-join' ? 'border-museum-gold bg-museum-gold/5' : 'border-museum-border/40 hover:border-museum-gold/50'">
            <input type="radio" v-model="relocateType" value="tail-join" class="mt-0.5 accent-museum-gold" />
            <div class="flex-1">
              <div class="flex items-center gap-1.5 text-sm font-medium text-museum-text">
                <Clock class="w-4 h-4 text-museum-orange" />
                加入当前场尾部
              </div>
              <p class="text-xs text-museum-muted mt-0.5">迟到时间较短，直接入场听尾部讲解</p>
            </div>
          </label>

          <label class="flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all" :class="relocateType === 'audio-guide' ? 'border-museum-gold bg-museum-gold/5' : 'border-museum-border/40 hover:border-museum-gold/50'">
            <input type="radio" v-model="relocateType" value="audio-guide" class="mt-0.5 accent-museum-gold" />
            <div class="flex-1">
              <div class="flex items-center gap-1.5 text-sm font-medium text-museum-text">
                <Headphones class="w-4 h-4 text-museum-blue" />
                改为语音导览
              </div>
              <p class="text-xs text-museum-muted mt-0.5">发放语音导览器，观众自行参观</p>
            </div>
          </label>
        </div>

        <div v-if="relocateType === 'next-session'" class="mb-4">
          <label class="block text-sm text-museum-muted mb-1.5 font-medium">选择目标场次</label>
          <select v-model="relocateSessionId" class="w-full bg-museum-bg border border-museum-border/60 rounded-lg px-3 py-2 text-sm text-museum-text focus:outline-none focus:ring-1 focus:ring-museum-gold">
            <option value="">请选择场次</option>
            <option v-for="s in nextAvailableSessions" :key="s.id" :value="s.id">
              {{ fmtTime(s.startTime) }}-{{ fmtTime(s.endTime) }} {{ exhibitionMap[s.exhibitionId] || '' }} ({{ s.booked }}/{{ s.capacity }})
            </option>
          </select>
          <p v-if="nextAvailableSessions.length === 0" class="text-xs text-museum-orange mt-1">今日暂无同语言后续场次</p>
        </div>

        <div class="mb-4">
          <label class="block text-sm text-museum-muted mb-1.5 font-medium">变更原因（可选）</label>
          <textarea v-model="relocateReason" rows="2" placeholder="记录变更原因，便于复盘..." class="w-full bg-museum-bg border border-museum-border/60 rounded-lg px-3 py-2 text-sm text-museum-text placeholder-museum-muted/50 focus:outline-none focus:ring-1 focus:ring-museum-gold resize-none" />
        </div>

        <div class="flex gap-2">
          <button class="flex-1 py-2.5 rounded-lg text-sm border border-museum-border/60 text-museum-muted hover:bg-museum-bg transition-colors" @click="closeRelocateDialog">取消</button>
          <button
            :disabled="relocateType === 'next-session' && !relocateSessionId"
            class="flex-1 py-2.5 rounded-lg text-sm font-medium bg-museum-blue text-white hover:bg-museum-blue/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            @click="confirmRelocate"
          >
            确认安置
          </button>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="showPanel" class="fixed inset-0 z-40 flex justify-end bg-black/20" @click.self="closePanel">
        <div class="w-[400px] h-full bg-museum-surface shadow-xl overflow-y-auto animate-slide-in border-l border-museum-border/30">
          <div class="p-5">
            <div class="flex items-center justify-between mb-5">
              <h2 class="text-lg font-serif font-bold text-museum-text">预约登记</h2>
              <button class="w-8 h-8 rounded-lg hover:bg-museum-bg flex items-center justify-center text-museum-muted hover:text-museum-text transition-colors" @click="closePanel">
                <X class="w-5 h-5" />
              </button>
            </div>

            <div class="space-y-4">
              <div>
                <label class="block text-sm text-museum-muted mb-1.5 font-medium">场次 <span class="text-museum-red">*</span></label>
                <select v-model="form.sessionId" class="w-full bg-museum-bg border border-museum-border/60 rounded-lg px-3 py-2.5 text-sm text-museum-text focus:outline-none focus:ring-1 focus:ring-museum-gold">
                  <option value="">请选择场次</option>
                  <option v-for="opt in sessionOptions" :key="opt.id" :value="opt.id">
                    {{ opt.label }} ({{ opt.booked }}/{{ opt.capacity }})
                  </option>
                </select>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-sm text-museum-muted mb-1.5 font-medium">姓名 <span class="text-museum-red">*</span></label>
                  <input v-model="form.name" type="text" placeholder="请输入姓名" class="w-full bg-museum-bg border border-museum-border/60 rounded-lg px-3 py-2.5 text-sm text-museum-text placeholder-museum-muted/50 focus:outline-none focus:ring-1 focus:ring-museum-gold" />
                </div>
                <div>
                  <label class="block text-sm text-museum-muted mb-1.5 font-medium">手机号 <span class="text-museum-red">*</span></label>
                  <input v-model="form.phone" type="text" placeholder="请输入手机号" class="w-full bg-museum-bg border border-museum-border/60 rounded-lg px-3 py-2.5 text-sm text-museum-text placeholder-museum-muted/50 focus:outline-none focus:ring-1 focus:ring-museum-gold" />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-sm text-museum-muted mb-1.5 font-medium">人数</label>
                  <input v-model.number="form.headcount" type="number" min="1" class="w-full bg-museum-bg border border-museum-border/60 rounded-lg px-3 py-2.5 text-sm text-museum-text focus:outline-none focus:ring-1 focus:ring-museum-gold" />
                </div>
                <div>
                  <label class="block text-sm text-museum-muted mb-1.5 font-medium">语言偏好</label>
                  <select v-model="form.languagePref" class="w-full bg-museum-bg border border-museum-border/60 rounded-lg px-3 py-2.5 text-sm text-museum-text focus:outline-none focus:ring-1 focus:ring-museum-gold">
                    <option v-for="opt in languageOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                  </select>
                </div>
              </div>

              <div class="bg-museum-bg/50 rounded-lg p-3 border border-museum-border/30">
                <label class="flex items-center gap-2 text-sm text-museum-text cursor-pointer font-medium">
                  <input v-model="form.isChildGroup" type="checkbox" class="accent-museum-gold w-4 h-4" />
                  儿童团队
                </label>
                <div v-if="form.isChildGroup" class="mt-2.5">
                  <input v-model="form.childAgeRange" type="text" placeholder="如：6-10岁" class="w-full bg-museum-surface border border-museum-border/60 rounded-lg px-3 py-2 text-sm text-museum-text placeholder-museum-muted/50 focus:outline-none focus:ring-1 focus:ring-museum-gold" />
                </div>
              </div>

              <div>
                <label class="block text-sm text-museum-muted mb-2 font-medium">无障碍需求</label>
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="opt in accessibilityOptions"
                    :key="opt.value"
                    class="px-3 py-1.5 rounded-lg text-xs border transition-all duration-200"
                    :class="form.accessibilityNeeds.includes(opt.value) ? 'border-museum-blue bg-museum-blue/10 text-museum-blue shadow-sm' : 'border-museum-border/60 text-museum-muted hover:border-museum-blue/40'"
                    @click="toggleAccessibility(opt.value)"
                  >
                    {{ opt.label }}
                  </button>
                </div>
              </div>

              <button
                :disabled="!form.sessionId || !form.name.trim() || !form.phone.trim()"
                class="w-full py-2.5 rounded-lg text-sm font-medium transition-colors bg-museum-gold text-white hover:bg-museum-gold/90 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm shadow-museum-gold/20"
                @click="submitVisitor"
              >
                确认预约
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
