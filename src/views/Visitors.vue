<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  Search, Plus, Clock, AlertCircle, Baby, Accessibility, Phone, UserPlus, X, Users, Eye,
  ArrowRightLeft, Headphones, Calendar, FileText, Scale, ShieldAlert, CreditCard,
  Heart, Ear, Eye as EyeIcon, Stethoscope, Sparkles, AlertTriangle,
} from 'lucide-vue-next'
import { useVisitorStore } from '@/stores/visitor'
import { useSessionStore } from '@/stores/session'
import { useAppStore } from '@/stores/app'
import { useBookingStore } from '@/stores/booking'
import SessionTypeTag from '@/components/common/SessionTypeTag.vue'
import CapacityBar from '@/components/common/CapacityBar.vue'
import { exhibitions, guides, languageLabels, accessibilityLabels, relocationTypeLabels } from '@/mock/data'
import type { Visitor, SessionLanguage, AccessibilityNeed, RelocationType, SpecialNeedType, BookingWeightResult } from '@/types'

const visitorStore = useVisitorStore()
const sessionStore = useSessionStore()
const appStore = useAppStore()
const bookingStore = useBookingStore()

const showPanel = ref(false)
const lateDialogId = ref<string | null>(null)
const lateMinutes = ref(0)
const viewVisitor = ref<Visitor | null>(null)
const showRelocateDialog = ref(false)
const relocateVisitorId = ref<string | null>(null)
const relocateType = ref<RelocationType>('next-session')
const relocateReason = ref('')
const relocateSessionId = ref('')
const showBlacklistDialog = ref(false)
const blacklistVisitorId = ref<string | null>(null)
const blacklistReason = ref('')

const form = ref({
  sessionId: '',
  name: '',
  phone: '',
  idCardNumber: '',
  headcount: 1,
  languagePref: 'zh' as SessionLanguage,
  isChildGroup: false,
  childAgeRange: '',
  accessibilityNeeds: [] as AccessibilityNeed[],
})

const specialNeedTypeOptions: Array<{ value: SpecialNeedType; label: string; icon: any; color: string }> = [
  { value: 'allergy', label: '过敏史', icon: Heart, color: 'text-rose-500' },
  { value: 'mobility', label: '行动障碍', icon: Accessibility, color: 'text-blue-500' },
  { value: 'visual-impairment', label: '视力障碍', icon: EyeIcon, color: 'text-purple-500' },
  { value: 'hearing-impairment', label: '听力障碍', icon: Ear, color: 'text-amber-500' },
  { value: 'medical', label: '其他医疗需求', icon: Stethoscope, color: 'text-teal-500' },
  { value: 'other', label: '其他特殊需求', icon: Sparkles, color: 'text-slate-500' },
]

const severityLabels: Record<string, string> = {
  mild: '轻度',
  moderate: '中度',
  severe: '重度',
}

const severityColors: Record<string, string> = {
  mild: 'text-green-600 bg-green-50',
  moderate: 'text-amber-600 bg-amber-50',
  severe: 'text-red-600 bg-red-50',
}

function getSpecialNeedIcon(type: SpecialNeedType) {
  const opt = specialNeedTypeOptions.find(o => o.value === type)
  return opt?.icon || Sparkles
}
function getSpecialNeedLabel(type: SpecialNeedType) {
  const opt = specialNeedTypeOptions.find(o => o.value === type)
  return opt?.label || '其他'
}
function getWeightColor(weight: number, max: number) {
  const pct = weight / max
  if (pct >= 0.8) return 'text-green-600'
  if (pct >= 0.6) return 'text-amber-600'
  return 'text-red-600'
}
function getWeightBgColor(weight: number, max: number) {
  const pct = weight / max
  if (pct >= 0.8) return 'bg-green-500'
  if (pct >= 0.6) return 'bg-amber-500'
  return 'bg-red-500'
}

function getVisitorWeight(visitor: Visitor): BookingWeightResult {
  return bookingStore.calculateBookingWeight(visitor.id, visitor.idCardNumber)
}

function getVisitorHistory(visitor: Visitor) {
  return bookingStore.getRecordsByIdCard(visitor.idCardNumber).concat(
    bookingStore.getRecordsByVisitor(visitor.id)
  ).filter((r, i, arr) => arr.findIndex(x => x.id === r.id) === i)
   .sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))
}

function getVisitorAttentionItems(visitor: Visitor) {
  return bookingStore.guideAttentionItems.filter(i => i.visitorId === visitor.id)
}

function getVisitorCapacityReservations(visitor: Visitor) {
  return bookingStore.capacityReservations.filter(r => r.visitorId === visitor.id)
}

function openBlacklistDialog(visitorId: string) {
  blacklistVisitorId.value = visitorId
  blacklistReason.value = ''
  showBlacklistDialog.value = true
}

function closeBlacklistDialog() {
  blacklistVisitorId.value = null
  showBlacklistDialog.value = false
}

function confirmBlacklist() {
  if (blacklistVisitorId.value && blacklistReason.value.trim()) {
    visitorStore.markBlacklisted(blacklistVisitorId.value, blacklistReason.value.trim())
    bookingStore.addBehaviorRecord({
      visitorId: blacklistVisitorId.value,
      idCardNumber: visitorStore.getVisitorById(blacklistVisitorId.value)?.idCardNumber || '',
      type: 'violation',
      reason: blacklistReason.value.trim(),
    })
  }
  closeBlacklistDialog()
}

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
const blacklistCount = computed(() => visitorStore.filteredVisitors.filter(v => v.isBlacklisted).length)
const specialNeedsCount = computed(() => visitorStore.filteredVisitors.filter(v =>
  v.isChildGroup && v.childProfiles.some(c => c.specialNeeds.length > 0)
).length)

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
  form.value = {
    sessionId: '', name: '', phone: '', idCardNumber: '',
    headcount: 1, languagePref: 'zh', isChildGroup: false,
    childAgeRange: '', accessibilityNeeds: []
  }
}

function openPanel() {
  resetForm()
  showPanel.value = true
}

function closePanel() {
  showPanel.value = false
}

function submitVisitor() {
  if (!form.value.sessionId || !form.value.name.trim() || !form.value.phone.trim() || !form.value.idCardNumber.trim()) return
  const newVisitor = visitorStore.addVisitor({
    sessionId: form.value.sessionId,
    name: form.value.name.trim(),
    phone: form.value.phone.trim(),
    idCardNumber: form.value.idCardNumber.trim(),
    headcount: form.value.headcount,
    languagePref: form.value.languagePref,
    isChildGroup: form.value.isChildGroup,
    childAgeRange: form.value.childAgeRange,
    childProfiles: [],
    accessibilityNeeds: [...form.value.accessibilityNeeds],
    isLate: false,
    lateMinutes: 0,
    isBlacklisted: false,
    complaintCount: 0,
  })
  sessionStore.updateBooked(form.value.sessionId, form.value.headcount)

  const weight = bookingStore.calculateBookingWeight(newVisitor.id, newVisitor.idCardNumber)
  if (weight.isBlacklisted) {
    visitorStore.markBlacklisted(newVisitor.id, '系统根据历史记录自动标记')
  }
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

    <div class="grid grid-cols-6 gap-3 mb-5">
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
            <p class="text-[10px] text-museum-muted">无障碍</p>
            <p class="text-lg font-serif font-bold text-museum-blue tabular-nums">{{ accessibilityVisitors }}</p>
          </div>
        </div>
      </div>
      <div class="bg-museum-surface rounded-xl p-3.5 border border-museum-border/40 shadow-sm">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
            <ShieldAlert class="w-4 h-4 text-red-500" />
          </div>
          <div>
            <p class="text-[10px] text-museum-muted">黑名单</p>
            <p class="text-lg font-serif font-bold text-red-600 tabular-nums">{{ blacklistCount }}</p>
          </div>
        </div>
      </div>
      <div class="bg-museum-surface rounded-xl p-3.5 border border-museum-border/40 shadow-sm">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
            <Heart class="w-4 h-4 text-purple-500" />
          </div>
          <div>
            <p class="text-[10px] text-museum-muted">特殊需求</p>
            <p class="text-lg font-serif font-bold text-purple-600 tabular-nums">{{ specialNeedsCount }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="flex items-center gap-3 mb-4 bg-museum-surface rounded-xl p-3 border border-museum-border/30 shadow-sm">
      <Search class="w-4 h-4 text-museum-muted flex-shrink-0" />
      <input
        :value="visitorStore.searchQuery"
        type="text"
        placeholder="搜索姓名 / 手机号 / 身份证号"
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
            <th class="text-left px-4 py-3 font-medium">身份证号</th>
            <th class="text-left px-4 py-3 font-medium">预约权重</th>
            <th class="text-left px-4 py-3 font-medium">人数</th>
            <th class="text-left px-4 py-3 font-medium">语言</th>
            <th class="text-left px-4 py-3 font-medium">儿童/特殊需求</th>
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
              v.isBlacklisted ? 'border-l-2 border-l-red-500 bg-red-50/30' :
              v.isLate ? 'border-l-2 border-l-museum-orange bg-museum-orange/5' :
              v.isChildGroup && v.childProfiles.some(c => c.specialNeeds.length > 0) ? 'border-l-2 border-l-purple-500' :
              v.accessibilityNeeds.length ? 'border-l-2 border-l-museum-blue' : 'border-l-2 border-l-transparent',
            ]"
          >
            <td class="px-4 py-3">
              <span class="flex items-center gap-1.5 flex-wrap">
                <span class="font-medium text-museum-text">{{ v.name }}</span>
                <AlertCircle v-if="v.isLate" class="w-3.5 h-3.5 text-museum-orange" />
                <ShieldAlert v-if="v.isBlacklisted" class="w-3.5 h-3.5 text-red-500" />
                <span v-if="v.complaintCount > 0" class="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-600 font-medium">投诉×{{ v.complaintCount }}</span>
              </span>
            </td>
            <td class="px-4 py-3 text-museum-muted text-xs whitespace-nowrap font-mono">{{ v.idCardNumber }}</td>
            <td class="px-4 py-3">
              <div v-if="!v.isBlacklisted" class="flex items-center gap-2">
                <span class="text-xs font-semibold tabular-nums" :class="getWeightColor(getVisitorWeight(v).weight, getVisitorWeight(v).maxWeight)">
                  {{ getVisitorWeight(v).weight }}/{{ getVisitorWeight(v).maxWeight }}
                </span>
                <div class="w-16 h-1.5 bg-museum-border/40 rounded-full overflow-hidden">
                  <div
                    class="h-full rounded-full transition-all"
                    :class="getWeightBgColor(getVisitorWeight(v).weight, getVisitorWeight(v).maxWeight)"
                    :style="{ width: (getVisitorWeight(v).weight / getVisitorWeight(v).maxWeight * 100) + '%' }"
                  />
                </div>
                <div v-if="getVisitorWeight(v).needDoubleDeposit" class="flex items-center gap-0.5 text-[10px] text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                  <CreditCard class="w-3 h-3" />双倍押金
                </div>
              </div>
              <span v-else class="text-xs font-semibold text-red-600">黑名单</span>
            </td>
            <td class="px-4 py-3 tabular-nums text-museum-text font-medium">{{ v.headcount }}</td>
            <td class="px-4 py-3 text-museum-muted text-xs">{{ languageLabels[v.languagePref] }}</td>
            <td class="px-4 py-3">
              <div class="space-y-1">
                <div v-if="v.isChildGroup" class="inline-flex items-center gap-1 text-museum-orange w-full">
                  <Baby class="w-3.5 h-3.5 flex-shrink-0" /> <span class="text-xs">{{ v.childAgeRange }}</span>
                </div>
                <div v-if="v.accessibilityNeeds.length" class="flex flex-wrap gap-1">
                  <span v-for="need in v.accessibilityNeeds" :key="need" class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium text-museum-blue bg-museum-blue/10">
                    <Accessibility class="w-3 h-3" />{{ accessibilityLabels[need] }}
                  </span>
                </div>
                <div v-if="v.childProfiles.length" class="flex flex-wrap gap-1">
                  <span
                    v-for="child in v.childProfiles"
                    :key="child.id"
                    class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border border-purple-200 text-purple-700 bg-purple-50"
                  >
                    <span>{{ child.name }}</span>
                    <span v-for="sn in child.specialNeeds" :key="sn.id" class="flex items-center">
                      <component :is="getSpecialNeedIcon(sn.type)" class="w-2.5 h-2.5" />
                    </span>
                  </span>
                </div>
              </div>
            </td>
            <td class="px-4 py-3 text-museum-muted max-w-[160px] truncate text-xs">{{ getSessionInfo(v.sessionId) }}</td>
            <td class="px-4 py-3">
              <div class="flex items-center gap-2">
                <button class="text-xs text-museum-gold hover:underline" @click="viewVisitorDetail(v)">详情</button>
                <button v-if="!v.isLate" class="text-xs text-museum-orange hover:underline" @click="openLateDialog(v.id)">迟到</button>
                <button v-if="v.isLate && v.sessionId" class="text-xs text-museum-blue hover:underline" @click="openRelocateDialog(v.id)">安置</button>
                <button v-if="!v.isBlacklisted" class="text-xs text-red-500 hover:underline" @click="openBlacklistDialog(v.id)">拉黑</button>
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
      <div class="bg-museum-surface rounded-xl shadow-lg p-5 w-[520px] max-h-[85vh] overflow-y-auto animate-slide-in border border-museum-border/30">
        <div class="flex items-start justify-between mb-4">
          <div>
            <h3 class="text-lg font-serif font-bold text-museum-text flex items-center gap-2">
              {{ viewVisitor.name }}
              <ShieldAlert v-if="viewVisitor.isBlacklisted" class="w-4 h-4 text-red-500" />
            </h3>
            <p class="text-xs text-museum-muted font-mono mt-0.5">{{ viewVisitor.idCardNumber }}</p>
          </div>
          <button class="w-7 h-7 rounded-lg hover:bg-museum-bg flex items-center justify-center text-museum-muted" @click="closeVisitorDetail">
            <X class="w-4 h-4" />
          </button>
        </div>
        <div class="space-y-3.5">
          <div class="grid grid-cols-2 gap-3">
            <div class="bg-museum-bg/50 rounded-lg p-3 border border-museum-border/20">
              <p class="text-[10px] text-museum-muted mb-0.5">手机号</p>
              <p class="text-sm text-museum-text flex items-center gap-1"><Phone class="w-3 h-3 text-museum-muted" />{{ viewVisitor.phone }}</p>
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

          <div v-if="!viewVisitor.isBlacklisted" class="bg-gradient-to-r from-museum-gold/5 to-museum-orange/5 rounded-lg p-3.5 border border-museum-gold/20">
            <div class="flex items-center gap-2 mb-2">
              <Scale class="w-4 h-4 text-museum-gold" />
              <span class="text-sm font-semibold text-museum-text">预约信用评估</span>
              <span class="ml-auto text-lg font-serif font-bold tabular-nums" :class="getWeightColor(getVisitorWeight(viewVisitor).weight, getVisitorWeight(viewVisitor).maxWeight)">
                {{ getVisitorWeight(viewVisitor).weight }}<span class="text-xs font-sans text-museum-muted">/{{ getVisitorWeight(viewVisitor).maxWeight }}</span>
              </span>
            </div>
            <div class="w-full h-2 bg-museum-border/30 rounded-full overflow-hidden mb-2.5">
              <div
                class="h-full rounded-full transition-all"
                :class="getWeightBgColor(getVisitorWeight(viewVisitor).weight, getVisitorWeight(viewVisitor).maxWeight)"
                :style="{ width: (getVisitorWeight(viewVisitor).weight / getVisitorWeight(viewVisitor).maxWeight * 100) + '%' }"
              />
            </div>
            <div class="grid grid-cols-4 gap-2 text-xs">
              <div class="bg-white/60 rounded p-2 border border-museum-border/20 text-center">
                <p class="text-[10px] text-museum-muted">缺席</p>
                <p class="font-semibold text-museum-text tabular-nums">{{ getVisitorWeight(viewVisitor).absenceCount30d }}次</p>
                <p v-if="getVisitorWeight(viewVisitor).breakdown.absenceDeduction > 0" class="text-[10px] text-red-500">-{{ getVisitorWeight(viewVisitor).breakdown.absenceDeduction }}</p>
              </div>
              <div class="bg-white/60 rounded p-2 border border-museum-border/20 text-center">
                <p class="text-[10px] text-museum-muted">迟到</p>
                <p class="font-semibold text-museum-text tabular-nums">{{ getVisitorWeight(viewVisitor).lateCount30d }}次</p>
                <p v-if="getVisitorWeight(viewVisitor).breakdown.lateDeduction > 0" class="text-[10px] text-amber-600">-{{ getVisitorWeight(viewVisitor).breakdown.lateDeduction }}</p>
              </div>
              <div class="bg-white/60 rounded p-2 border border-museum-border/20 text-center">
                <p class="text-[10px] text-museum-muted">投诉</p>
                <p class="font-semibold text-museum-text tabular-nums">{{ getVisitorWeight(viewVisitor).complaintCount30d }}次</p>
                <p v-if="getVisitorWeight(viewVisitor).breakdown.complaintDeduction > 0" class="text-[10px] text-red-500">-{{ getVisitorWeight(viewVisitor).breakdown.complaintDeduction }}</p>
              </div>
              <div class="bg-white/60 rounded p-2 border border-museum-border/20 text-center">
                <p class="text-[10px] text-museum-muted">押金</p>
                <p class="font-semibold tabular-nums" :class="getVisitorWeight(viewVisitor).needDoubleDeposit ? 'text-red-600' : 'text-green-600'">
                  {{ getVisitorWeight(viewVisitor).needDoubleDeposit ? '¥100' : '¥50' }}
                </p>
                <p class="text-[10px] text-museum-muted">{{ getVisitorWeight(viewVisitor).needDoubleDeposit ? '双倍' : '标准' }}</p>
              </div>
            </div>
            <div v-if="getVisitorWeight(viewVisitor).belowThreshold" class="mt-2.5 flex items-center gap-1.5 px-2.5 py-2 rounded bg-red-50 border border-red-200">
              <AlertTriangle class="w-4 h-4 text-red-500 flex-shrink-0" />
              <span class="text-xs text-red-700">
                权重低于阈值60分，需缴纳双倍押金，预约优先级靠后（队列等级 {{ getVisitorWeight(viewVisitor).queuePriority }}）
              </span>
            </div>
          </div>
          <div v-else class="bg-red-50 rounded-lg p-3 border border-red-200">
            <div class="flex items-center gap-2 text-red-600 mb-1">
              <ShieldAlert class="w-4 h-4" />
              <span class="text-sm font-semibold">黑名单用户</span>
            </div>
            <p class="text-xs text-red-700">原因：{{ viewVisitor.blacklistReason || '多次违规行为自动标记' }}</p>
            <p class="text-[10px] text-red-500 mt-1">该用户被禁止预约任何导览及手作课程</p>
          </div>

          <div v-if="viewVisitor.isChildGroup" class="bg-museum-orange/5 rounded-lg p-3 border border-museum-orange/20">
            <div class="flex items-center gap-1.5 text-museum-orange mb-2">
              <Baby class="w-4 h-4" />
              <span class="text-sm font-medium">儿童团队 · {{ viewVisitor.childAgeRange }}</span>
            </div>
            <div v-if="viewVisitor.childProfiles.length > 0" class="space-y-2">
              <div
                v-for="child in viewVisitor.childProfiles"
                :key="child.id"
                class="bg-white rounded-lg p-2.5 border border-museum-orange/20"
              >
                <div class="flex items-center justify-between mb-1">
                  <span class="text-sm font-medium text-museum-text">{{ child.name }}（{{ child.age }}岁）</span>
                  <span v-if="child.specialNeeds.length > 0" class="text-[10px] text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
                    特殊需求×{{ child.specialNeeds.length }}
                  </span>
                </div>
                <p class="text-[10px] text-museum-muted mb-1.5">
                  监护人：{{ child.guardianName }} · {{ child.guardianPhone }}
                </p>
                <div v-if="child.specialNeeds.length > 0" class="flex flex-wrap gap-1.5">
                  <span
                    v-for="sn in child.specialNeeds"
                    :key="sn.id"
                    class="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-medium border"
                    :class="severityColors[sn.severity]"
                  >
                    <component :is="getSpecialNeedIcon(sn.type)" class="w-3 h-3" />
                    {{ getSpecialNeedLabel(sn.type) }}
                    <span class="opacity-60">（{{ severityLabels[sn.severity] }}）</span>
                  </span>
                </div>
              </div>
            </div>
            <div v-else class="text-xs text-museum-orange/70">暂无儿童档案</div>
          </div>

          <div v-if="viewVisitor.accessibilityNeeds.length" class="bg-museum-blue/5 rounded-lg p-3 border border-museum-blue/20">
            <div class="flex items-center gap-1.5 text-museum-blue mb-1.5">
              <Accessibility class="w-4 h-4" />
              <span class="text-sm font-medium">无障碍需求</span>
            </div>
            <div class="flex flex-wrap gap-1.5">
              <span v-for="need in viewVisitor.accessibilityNeeds" :key="need" class="px-2 py-0.5 rounded text-xs text-museum-blue bg-museum-blue/10">
                {{ accessibilityLabels[need] }}
              </span>
            </div>
          </div>

          <div v-if="getVisitorAttentionItems(viewVisitor).length" class="bg-purple-50 rounded-lg p-3 border border-purple-200">
            <div class="flex items-center gap-1.5 text-purple-700 mb-2">
              <Eye class="w-4 h-4" />
              <span class="text-sm font-medium">讲解员关注记录（{{ getVisitorAttentionItems(viewVisitor).length }}项）</span>
            </div>
            <div class="space-y-1.5">
              <div v-for="item in getVisitorAttentionItems(viewVisitor)" :key="item.id" class="text-xs bg-white rounded p-2 border border-purple-100">
                <div class="flex items-center justify-between mb-0.5">
                  <span class="font-medium text-purple-800 capitalize">{{ item.type }}</span>
                  <span class="text-[10px]" :class="severityColors[item.severity]">{{ severityLabels[item.severity] }}</span>
                </div>
                <p class="text-museum-muted text-[11px]">{{ item.description }}</p>
                <p v-if="item.childName" class="text-[10px] text-purple-600 mt-0.5">儿童：{{ item.childName }}</p>
              </div>
            </div>
          </div>

          <div v-if="getVisitorCapacityReservations(viewVisitor).length" class="bg-teal-50 rounded-lg p-3 border border-teal-200">
            <div class="flex items-center gap-1.5 text-teal-700 mb-2">
              <FileText class="w-4 h-4" />
              <span class="text-sm font-medium">无障碍容量预留（{{ getVisitorCapacityReservations(viewVisitor).length }}项）</span>
            </div>
            <div class="space-y-1.5">
              <div v-for="r in getVisitorCapacityReservations(viewVisitor)" :key="r.id" class="text-xs bg-white rounded p-2 border border-teal-100">
                <div class="flex items-center justify-between mb-0.5">
                  <span class="font-medium capitalize text-teal-800">{{ r.reason }}</span>
                  <span class="text-teal-700 font-semibold">预留{{ r.reservedSpots }}席</span>
                </div>
                <p class="text-museum-muted text-[11px]">{{ r.description }}</p>
                <p v-if="r.channelWidthReserved" class="text-[10px] text-teal-600 mt-0.5">✓ 已预留加宽通道</p>
              </div>
            </div>
          </div>

          <div v-if="viewVisitor.isLate" class="bg-amber-50 rounded-lg p-3 border border-amber-200">
            <div class="flex items-center gap-1.5 text-amber-600 mb-1">
              <Clock class="w-4 h-4" />
              <span class="text-sm font-medium">迟到记录</span>
            </div>
            <p class="text-sm text-amber-700">迟到 {{ viewVisitor.lateMinutes }} 分钟</p>
          </div>

          <div v-if="getVisitorHistory(viewVisitor).length" class="bg-museum-bg/40 rounded-lg p-3 border border-museum-border/20">
            <div class="flex items-center gap-1.5 text-museum-text mb-2">
              <FileText class="w-4 h-4 text-museum-muted" />
              <span class="text-sm font-medium">近30天行为记录</span>
            </div>
            <div class="space-y-1.5 max-h-48 overflow-y-auto">
              <div
                v-for="r in getVisitorHistory(viewVisitor).slice(0, 8)"
                :key="r.id"
                class="text-xs bg-white rounded p-2 border border-museum-border/20 flex items-start gap-2"
              >
                <span
                  class="flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-semibold capitalize"
                  :class="{
                    'bg-red-100 text-red-700': r.type === 'absence' || r.type === 'complaint' || r.type === 'violation',
                    'bg-amber-100 text-amber-700': r.type === 'late',
                  }"
                >
                  {{ r.type === 'absence' ? '缺席' : r.type === 'late' ? '迟到' : r.type === 'complaint' ? '投诉' : '违规' }}
                </span>
                <div class="flex-1 min-w-0">
                  <p class="text-museum-text">{{ r.reason }}</p>
                  <p class="text-[10px] text-museum-muted mt-0.5">
                    {{ r.recordedAt.slice(0, 16) }}
                    <span v-if="r.lateMinutes" class="ml-1">（迟到{{ r.lateMinutes }}分钟）</span>
                  </p>
                </div>
              </div>
            </div>
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

    <div v-if="showBlacklistDialog" class="fixed inset-0 z-50 flex items-center justify-center bg-black/30" @click.self="closeBlacklistDialog">
      <div class="bg-museum-surface rounded-xl shadow-lg p-5 w-96 animate-slide-in border border-red-200">
        <h3 class="text-base font-serif font-semibold text-red-600 mb-3 flex items-center gap-1.5">
          <ShieldAlert class="w-4 h-4" /> 加入黑名单
        </h3>
        <p class="text-xs text-museum-muted mb-3">
          被拉黑后，该观众将无法预约任何导览和手作课程。请谨慎操作。
        </p>
        <label class="block text-sm text-museum-muted mb-1">拉黑原因 *</label>
        <textarea
          v-model="blacklistReason"
          rows="3"
          placeholder="请输入拉黑原因，例如：多次缺席、投诉工作人员、扰乱秩序等..."
          class="w-full bg-museum-bg border border-museum-border/60 rounded-lg px-3 py-2 text-sm text-museum-text placeholder-museum-muted/50 focus:outline-none focus:ring-1 focus:ring-red-400 mb-4 resize-none"
        />
        <div class="flex gap-2">
          <button class="flex-1 py-2 rounded-lg text-sm border border-museum-border/60 text-museum-muted hover:bg-museum-bg transition-colors" @click="closeBlacklistDialog">取消</button>
          <button
            :disabled="!blacklistReason.trim()"
            class="flex-1 py-2 rounded-lg text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            @click="confirmBlacklist"
          >
            确认拉黑
          </button>
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

              <div>
                <label class="block text-sm text-museum-muted mb-1.5 font-medium flex items-center gap-1">
                  <CreditCard class="w-3.5 h-3.5" />
                  身份证号 <span class="text-museum-red">*</span>
                </label>
                <input
                  v-model="form.idCardNumber"
                  type="text"
                  placeholder="请输入身份证号（用于预约权重和去重校验）"
                  class="w-full bg-museum-bg border border-museum-border/60 rounded-lg px-3 py-2.5 text-sm text-museum-text placeholder-museum-muted/50 focus:outline-none focus:ring-1 focus:ring-museum-gold font-mono"
                />
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
                :disabled="!form.sessionId || !form.name.trim() || !form.phone.trim() || !form.idCardNumber.trim()"
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
