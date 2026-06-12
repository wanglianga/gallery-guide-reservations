<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  Palette, Users, Clock, MapPin, Baby, AlertTriangle,
  CheckCircle, XCircle, Plus, X, Search, Package, ChevronRight,
  ShieldAlert, Scale, Lock, CreditCard, User, AlertOctagon,
  Heart, Accessibility, Ear, Eye, Stethoscope, Sparkles,
} from 'lucide-vue-next'
import { useWorkshopStore } from '@/stores/workshop'
import { useVisitorStore } from '@/stores/visitor'
import { useSessionStore } from '@/stores/session'
import { useAppStore } from '@/stores/app'
import { useBookingStore } from '@/stores/booking'
import CapacityBar from '@/components/common/CapacityBar.vue'
import { exhibitions, languageLabels } from '@/mock/data'
import type { Workshop, WorkshopBooking, BookingWeightResult, SpecialNeed, SpecialNeedType } from '@/types'

const workshopStore = useWorkshopStore()
const visitorStore = useVisitorStore()
const sessionStore = useSessionStore()
const appStore = useAppStore()
const bookingStore = useBookingStore()

const selectedWorkshopId = ref<string | null>(null)
const showBookingPanel = ref(false)
const filterType = ref('all')
const searchQuery = ref('')
const lastBookingWarnings = ref<string[]>([])
const showBookingResult = ref(false)

const bookingForm = ref({
  visitorId: '',
  childName: '',
  childAge: 6,
  idCardNumber: '',
  specialNeeds: [] as SpecialNeed[],
})

const newSpecialNeed = ref({
  type: 'allergy' as SpecialNeedType,
  description: '',
  severity: 'mild' as 'mild' | 'moderate' | 'severe',
  allergyDetail: '',
})

const specialNeedTypeOptions: Array<{ value: SpecialNeedType; label: string; icon: any; color: string }> = [
  { value: 'allergy', label: '过敏史', icon: Heart, color: 'text-rose-500' },
  { value: 'mobility', label: '行动障碍', icon: Accessibility, color: 'text-blue-500' },
  { value: 'visual-impairment', label: '视力障碍', icon: Eye, color: 'text-purple-500' },
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

const filteredWorkshops = computed(() => {
  let result = workshopStore.workshops.slice()
  if (filterType.value === 'family') {
    result = result.filter(w => {
      const session = sessionStore.getSessionById(w.sessionId || '')
      return session?.type === 'family'
    })
  } else if (filterType.value === 'available') {
    result = result.filter(w => workshopStore.getConfirmedCountByWorkshop(w.id) < w.capacity)
  }
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(w => w.title.toLowerCase().includes(q) || w.description.toLowerCase().includes(q))
  }
  return result.sort((a, b) => a.startTime.localeCompare(b.startTime))
})

const selectedWorkshop = computed(() => {
  return selectedWorkshopId.value ? workshopStore.getWorkshopById(selectedWorkshopId.value) : null
})

const workshopBookings = computed(() => {
  return selectedWorkshopId.value ? workshopStore.bookingsByWorkshop(selectedWorkshopId.value).filter(b => !b.cancelledAt) : []
})

const confirmedBookings = computed(() => {
  return workshopBookings.value.filter(b => b.confirmed).sort((a, b) => {
    if (a.queuePriority !== b.queuePriority) return a.queuePriority - b.queuePriority
    return b.weightScore - a.weightScore
  })
})

const pendingBookings = computed(() => {
  return workshopBookings.value.filter(b => !b.confirmed)
})

const familyVisitors = computed(() => {
  if (!selectedWorkshop.value || !selectedWorkshop.value.sessionId) return []
  return visitorStore.visitorsBySession(selectedWorkshop.value.sessionId).filter(v => v.isChildGroup)
})

const materialList = computed(() => {
  if (!selectedWorkshop.value) return []
  return selectedWorkshop.value.materialIds.map(id => workshopStore.getMaterialById(id)).filter(Boolean)
})

const ageCheckResult = computed(() => {
  if (!selectedWorkshop.value || !bookingForm.value.childAge) return { ageOk: false, minAge: 0, maxAge: 0 }
  const age = bookingForm.value.childAge
  return {
    ageOk: age >= selectedWorkshop.value.minAge && age <= selectedWorkshop.value.maxAge,
    minAge: selectedWorkshop.value.minAge,
    maxAge: selectedWorkshop.value.maxAge,
  }
})

const capacityCheck = computed(() => {
  if (!selectedWorkshopId.value) return { canBook: false, availableSpots: 0 }
  return workshopStore.checkCapacity(selectedWorkshopId.value)
})

const materialCheck = computed(() => {
  if (!selectedWorkshopId.value) return { hasAllMaterials: false, missingMaterials: [] }
  return workshopStore.checkMaterials(selectedWorkshopId.value, 1)
})

const selectedVisitor = computed(() => {
  if (!bookingForm.value.visitorId) return null
  return visitorStore.getVisitorById(bookingForm.value.visitorId) || null
})

const weightResult = computed<BookingWeightResult | null>(() => {
  if (!bookingForm.value.visitorId && !bookingForm.value.idCardNumber) return null
  const vid = bookingForm.value.visitorId || '__temp__'
  const idc = bookingForm.value.idCardNumber ||
    (selectedVisitor.value?.idCardNumber) ||
    (bookingForm.value.visitorId ? (visitorStore.getVisitorById(bookingForm.value.visitorId)?.idCardNumber || '') : '')
  if (!idc && !bookingForm.value.visitorId) return null
  return workshopStore.calculateWeight(vid, idc || '__temp_idcard__')
})

const duplicateCheck = computed(() => {
  if (!bookingForm.value.idCardNumber && !selectedVisitor.value?.idCardNumber) return null
  if (!selectedWorkshopId.value) return null
  const idc = bookingForm.value.idCardNumber || selectedVisitor.value?.idCardNumber || ''
  return workshopStore.checkIdCardDuplicateForWorkshop(idc, selectedWorkshopId.value)
})

const lockCheck = computed(() => {
  if (!bookingForm.value.idCardNumber && !selectedVisitor.value?.idCardNumber) return null
  if (!selectedWorkshopId.value) return null
  const idc = bookingForm.value.idCardNumber || selectedVisitor.value?.idCardNumber || ''
  return workshopStore.checkBookingLock(idc, selectedWorkshopId.value)
})

const depositInfo = computed(() => {
  if (!weightResult.value) return { standard: 0, required: 0, multiplier: 1 }
  const standard = bookingStore.weightConfig.standardDeposit
  const multiplier = weightResult.value.needDoubleDeposit ? 2 : 1
  return { standard, required: standard * multiplier, multiplier }
})

const bookingWarnings = computed(() => {
  const warnings: Array<{ type: 'error' | 'warning' | 'info'; text: string; icon: any }> = []
  if (weightResult.value) {
    if (weightResult.value.isBlacklisted) {
      warnings.push({ type: 'error', text: '该观众在黑名单中，需经管理员审批方可预约', icon: ShieldAlert })
    }
    if (weightResult.value.belowThreshold && !weightResult.value.isBlacklisted) {
      warnings.push({ type: 'warning', text: `权重分 ${weightResult.value.weight}/${weightResult.value.maxWeight}，低于阈值 ${bookingStore.weightConfig.threshold}`, icon: Scale })
    }
    if (weightResult.value.needDoubleDeposit) {
      warnings.push({ type: 'warning', text: `需缴纳双倍押金 ¥${depositInfo.value.required}`, icon: CreditCard })
    }
    if (weightResult.value.queuePriority === 2) {
      warnings.push({ type: 'info', text: '排位靠后，在正常预约观众之后确认席位', icon: Users })
    }
  }
  if (duplicateCheck.value?.isDuplicate) {
    if (duplicateCheck.value.willCancelCurrent) {
      warnings.push({ type: 'error', text: '该身份证号已有更早场次的预约，当前预约将被取消保留最早场次', icon: AlertOctagon })
    } else {
      warnings.push({ type: 'warning', text: `检测到 ${duplicateCheck.value.duplicateBookings.length} 个同身份证预约记录，系统将自动保留最早一场`, icon: AlertTriangle })
    }
  }
  if (lockCheck.value?.locked && lockCheck.value.lockInfo) {
    warnings.push({ type: 'error', text: `${lockCheck.value.lockInfo.reason}（锁定至 ${lockCheck.value.lockInfo.lockedUntil.slice(11, 16)}）`, icon: Lock })
  }
  return warnings
})

const canConfirm = computed(() => {
  if (!bookingForm.value.childName.trim()) return false
  if (!ageCheckResult.value.ageOk) return false
  if (!capacityCheck.value.canBook) return false
  if (!materialCheck.value.hasAllMaterials) return false
  if (lockCheck.value?.locked) return false
  if (weightResult.value?.isBlacklisted) return false
  return true
})

function fmtTime(iso: string) {
  return iso.slice(11, 16)
}

function fmtDate(iso: string) {
  return iso.slice(5, 10)
}

function fmtDateTime(iso: string) {
  return `${iso.slice(5, 10)} ${iso.slice(11, 16)}`
}

function getExhibitionTitle(exhibitionId: string) {
  const ex = exhibitions.find(e => e.id === exhibitionId)
  return ex?.title || ''
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

function getSpecialNeedIcon(type: SpecialNeedType) {
  const opt = specialNeedTypeOptions.find(o => o.value === type)
  return opt?.icon || Sparkles
}

function getSpecialNeedLabel(type: SpecialNeedType) {
  const opt = specialNeedTypeOptions.find(o => o.value === type)
  return opt?.label || '其他'
}

function getSpecialNeedColor(type: SpecialNeedType) {
  const opt = specialNeedTypeOptions.find(o => o.value === type)
  return opt?.color || 'text-slate-500'
}

function selectWorkshop(id: string) {
  selectedWorkshopId.value = selectedWorkshopId.value === id ? null : id
}

function openBookingPanel(workshopId: string) {
  selectedWorkshopId.value = workshopId
  bookingForm.value = {
    visitorId: '',
    childName: '',
    childAge: 6,
    idCardNumber: '',
    specialNeeds: [],
  }
  newSpecialNeed.value = {
    type: 'allergy',
    description: '',
    severity: 'mild',
    allergyDetail: '',
  }
  lastBookingWarnings.value = []
  showBookingResult.value = false
  showBookingPanel.value = true
}

function closeBookingPanel() {
  showBookingPanel.value = false
  showBookingResult.value = false
}

function addFromVisitor(visitorId: string) {
  const visitor = visitorStore.getVisitorById(visitorId)
  if (visitor) {
    bookingForm.value.visitorId = visitorId
    bookingForm.value.idCardNumber = visitor.idCardNumber
    bookingForm.value.childName = visitor.childProfiles[0]?.name || visitor.name + ' 孩子'
    bookingForm.value.childAge = visitor.childProfiles[0]?.age || 6
    bookingForm.value.specialNeeds = visitor.childProfiles.flatMap(c => c.specialNeeds).map(sn => ({ ...sn }))
  }
}

function addSpecialNeed() {
  if (!newSpecialNeed.value.description.trim()) return
  const sn: SpecialNeed = {
    id: `sn_tmp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    type: newSpecialNeed.value.type,
    description: newSpecialNeed.value.description.trim(),
    severity: newSpecialNeed.value.severity,
    allergyDetail: newSpecialNeed.value.type === 'allergy' ? newSpecialNeed.value.allergyDetail.trim() : undefined,
  }
  bookingForm.value.specialNeeds.push(sn)
  newSpecialNeed.value = {
    type: 'allergy',
    description: '',
    severity: 'mild',
    allergyDetail: '',
  }
}

function removeSpecialNeed(idx: number) {
  bookingForm.value.specialNeeds.splice(idx, 1)
}

function submitBooking() {
  if (!selectedWorkshopId.value || !bookingForm.value.childName.trim()) return

  const idCardNumber = bookingForm.value.idCardNumber ||
    selectedVisitor.value?.idCardNumber ||
    `tmp_${Date.now()}`

  const result = workshopStore.addSmartBooking({
    workshopId: selectedWorkshopId.value,
    visitorId: bookingForm.value.visitorId || `tmp_${Date.now()}`,
    idCardNumber,
    childName: bookingForm.value.childName.trim(),
    childAge: bookingForm.value.childAge,
    childSpecialNeeds: bookingForm.value.specialNeeds,
    autoDeduplicate: true,
  })

  lastBookingWarnings.value = result.warnings
  showBookingResult.value = true

  if (result.success) {
    bookingForm.value = {
      visitorId: '',
      childName: '',
      childAge: 6,
      idCardNumber: '',
      specialNeeds: [],
    }
  }
}

function refreshBookingMaterials(bookingId: string) {
  const booking = workshopStore.bookings.find(b => b.id === bookingId)
  if (!booking) return
  const matCheck = workshopStore.checkMaterials(booking.workshopId, 1)
  workshopStore.updateBookingMaterials(bookingId, matCheck)
}

function confirmBooking(bookingId: string) {
  refreshBookingMaterials(bookingId)
  const ok = workshopStore.confirmBooking(bookingId)
  if (ok) {
    lastBookingWarnings.value = ['预约已确认，已锁定2小时内其他场馆预约权限']
    showBookingResult.value = true
  }
}

function cancelBooking(bookingId: string) {
  workshopStore.cancelBooking(bookingId)
}
</script>

<template>
  <div class="animate-fade-in-up">
    <div class="flex items-end justify-between mb-5">
      <div>
        <p class="text-sm text-museum-muted mb-1 font-sans tracking-wide">教育活动</p>
        <h1 class="text-3xl font-serif font-bold text-museum-text tracking-tight">手作课程</h1>
      </div>
      <div class="flex items-center gap-2 text-museum-muted">
        <Palette class="w-4 h-4" />
        <span class="text-sm">{{ filteredWorkshops.length }} 门课程</span>
      </div>
    </div>

    <div class="flex items-center gap-2 mb-4 bg-museum-surface rounded-xl p-3 border border-museum-border/30 shadow-sm">
      <Search class="w-4 h-4 text-museum-muted flex-shrink-0" />
      <input
        v-model="searchQuery"
        type="text"
        placeholder="搜索课程名称..."
        class="flex-1 bg-museum-bg border border-museum-border/60 rounded-lg px-3 py-1.5 text-sm text-museum-text placeholder-museum-muted/50 focus:outline-none focus:ring-1 focus:ring-museum-gold"
      />
      <select v-model="filterType" class="bg-museum-bg border border-museum-border/60 rounded-lg px-3 py-1.5 text-sm text-museum-text focus:outline-none focus:ring-1 focus:ring-museum-gold">
        <option value="all">全部课程</option>
        <option value="family">亲子导览关联</option>
        <option value="available">有名额</option>
      </select>
    </div>

    <div class="flex gap-5" style="min-height: calc(100vh - 240px)">
      <div class="flex-[3] space-y-3">
        <div
          v-for="workshop in filteredWorkshops"
          :key="workshop.id"
          class="bg-museum-surface rounded-xl shadow-sm border border-museum-border/30 overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-md"
          :class="selectedWorkshopId === workshop.id ? 'border-museum-gold ring-1 ring-museum-gold/30' : ''"
          @click="selectWorkshop(workshop.id)"
        >
          <div class="p-4">
            <div class="flex items-start justify-between mb-2">
              <div>
                <h3 class="text-base font-serif font-semibold text-museum-text">{{ workshop.title }}</h3>
                <p class="text-xs text-museum-muted mt-0.5">{{ workshop.description }}</p>
              </div>
              <span class="px-2 py-1 rounded text-[10px] font-medium bg-museum-orange/10 text-museum-orange whitespace-nowrap">
                手作课程
              </span>
            </div>

            <div class="grid grid-cols-4 gap-2 mt-3">
              <div class="flex items-center gap-1 text-xs text-museum-muted">
                <Clock class="w-3 h-3 text-museum-gold" />
                {{ fmtTime(workshop.startTime) }}-{{ fmtTime(workshop.endTime) }}
              </div>
              <div class="flex items-center gap-1 text-xs text-museum-muted">
                <MapPin class="w-3 h-3 text-museum-gold" />
                {{ workshop.classroom }}
              </div>
              <div class="flex items-center gap-1 text-xs text-museum-muted">
                <Baby class="w-3 h-3 text-museum-gold" />
                {{ workshop.minAge }}-{{ workshop.maxAge }}岁
              </div>
              <div class="flex items-center gap-1 text-xs text-museum-muted">
                <Users class="w-3 h-3 text-museum-gold" />
                {{ workshopStore.getConfirmedCountByWorkshop(workshop.id) }}/{{ workshop.capacity }}
              </div>
            </div>

            <div class="mt-3">
              <CapacityBar :current="workshopStore.getConfirmedCountByWorkshop(workshop.id)" :max="workshop.capacity" size="sm" />
            </div>
          </div>
        </div>

        <div v-if="filteredWorkshops.length === 0" class="bg-museum-surface rounded-xl p-12 text-center text-museum-muted border border-museum-border/30">
          <Palette class="w-12 h-12 mx-auto mb-3 text-museum-border" />
          <p class="text-sm">暂无匹配的课程</p>
        </div>
      </div>

      <div class="flex-[2] space-y-4">
        <div v-if="selectedWorkshop" class="bg-museum-surface rounded-xl shadow-sm border border-museum-border/30 overflow-hidden animate-slide-in">
          <div class="p-4 border-b border-museum-border/30">
            <div class="flex items-start justify-between">
              <div>
                <h2 class="text-lg font-serif font-bold text-museum-text">{{ selectedWorkshop.title }}</h2>
                <p class="text-xs text-museum-muted mt-1">{{ selectedWorkshop.description }}</p>
              </div>
              <button class="w-7 h-7 rounded-lg hover:bg-museum-bg flex items-center justify-center text-museum-muted" @click="selectedWorkshopId = null">
                <X class="w-4 h-4" />
              </button>
            </div>
          </div>

          <div class="p-4 space-y-4">
            <div class="grid grid-cols-2 gap-3">
              <div class="bg-museum-bg/50 rounded-lg p-3 border border-museum-border/20">
                <div class="flex items-center gap-1.5 text-xs text-museum-muted mb-1">
                  <Clock class="w-3 h-3 text-museum-gold" /> 时间
                </div>
                <span class="text-sm font-medium text-museum-text">
                  {{ fmtDate(selectedWorkshop.startTime) }} {{ fmtTime(selectedWorkshop.startTime) }}-{{ fmtTime(selectedWorkshop.endTime) }}
                </span>
              </div>
              <div class="bg-museum-bg/50 rounded-lg p-3 border border-museum-border/20">
                <div class="flex items-center gap-1.5 text-xs text-museum-muted mb-1">
                  <MapPin class="w-3 h-3 text-museum-gold" /> 教室
                </div>
                <span class="text-sm font-medium text-museum-text">{{ selectedWorkshop.classroom }}</span>
              </div>
              <div class="bg-museum-bg/50 rounded-lg p-3 border border-museum-border/20">
                <div class="flex items-center gap-1.5 text-xs text-museum-muted mb-1">
                  <Baby class="w-3 h-3 text-museum-gold" /> 年龄
                </div>
                <span class="text-sm font-medium text-museum-text">{{ selectedWorkshop.minAge }}-{{ selectedWorkshop.maxAge }}岁</span>
              </div>
              <div class="bg-museum-bg/50 rounded-lg p-3 border border-museum-border/20">
                <div class="flex items-center gap-1.5 text-xs text-museum-muted mb-1">
                  <Users class="w-3 h-3 text-museum-gold" /> 名额
                </div>
                <span class="text-sm font-medium text-museum-text">{{ confirmedBookings.length }}/{{ selectedWorkshop.capacity }}</span>
              </div>
            </div>

            <div class="bg-museum-bg/50 rounded-lg p-3 border border-museum-border/20">
              <div class="flex items-center gap-1.5 text-xs text-museum-muted mb-2">
                <Package class="w-3 h-3 text-museum-gold" /> 所需材料
              </div>
              <div class="flex flex-wrap gap-1.5">
                <span
                  v-for="mat in materialList"
                  :key="mat.id"
                  class="px-2 py-1 rounded text-[10px] font-medium"
                  :class="(mat.total - mat.used) > 0 ? 'bg-museum-green/10 text-museum-green' : 'bg-museum-red/10 text-museum-red'"
                >
                  {{ mat.name }} ({{ mat.total - mat.used }}/{{ mat.total }})
                </span>
              </div>
            </div>

            <div v-if="selectedWorkshop.sessionId" class="bg-museum-orange/5 rounded-lg p-3 border border-museum-orange/20">
              <div class="flex items-center gap-1.5 text-sm text-museum-orange mb-2">
                <Palette class="w-4 h-4" />
                <span class="font-medium">关联导览</span>
              </div>
              <p class="text-xs text-museum-muted">
                {{ getExhibitionTitle(sessionStore.getSessionById(selectedWorkshop.sessionId)?.exhibitionId || '') }}
                · {{ fmtTime(sessionStore.getSessionById(selectedWorkshop.sessionId)?.startTime || '') }} 场
              </p>
              <p class="text-xs text-museum-blue mt-1">可将导览观众直接带入课程</p>
            </div>

            <button
              class="w-full py-2.5 rounded-lg text-sm font-medium bg-museum-gold text-white hover:bg-museum-gold/90 transition-colors flex items-center justify-center gap-1.5 shadow-sm shadow-museum-gold/20"
              @click="openBookingPanel(selectedWorkshop.id)"
            >
              <Plus class="w-4 h-4" /> 预约课程
            </button>
          </div>
        </div>

        <div v-if="selectedWorkshop" class="bg-museum-surface rounded-xl shadow-sm border border-museum-border/30 overflow-hidden">
          <div class="p-4 border-b border-museum-border/30">
            <h3 class="text-sm font-serif font-semibold text-museum-text flex items-center gap-1.5">
              <Users class="w-4 h-4 text-museum-gold" />
              课程名单 ({{ confirmedBookings.length + pendingBookings.length }})
            </h3>
          </div>

          <div class="divide-y divide-museum-border/20 max-h-[300px] overflow-y-auto">
            <div v-for="booking in confirmedBookings" :key="booking.id" class="p-3 hover:bg-museum-gold/5">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <CheckCircle class="w-4 h-4 text-museum-green" />
                  <div>
                    <div class="flex items-center gap-1.5">
                      <p class="text-sm font-medium text-museum-text">{{ booking.childName }}</p>
                      <span v-if="booking.queuePriority === 2" class="text-[9px] px-1 rounded bg-amber-100 text-amber-700">低权重</span>
                      <span v-if="booking.depositMultiplier > 1" class="text-[9px] px-1 rounded bg-rose-100 text-rose-700">双倍押金</span>
                    </div>
                    <p class="text-[10px] text-museum-muted">{{ booking.childAge }}岁 · 权重 {{ booking.weightScore }}分 · 排位#{{ booking.queuePosition }}</p>
                    <div v-if="booking.childSpecialNeeds.length > 0" class="flex flex-wrap gap-1 mt-1">
                      <span
                        v-for="sn in booking.childSpecialNeeds"
                        :key="sn.id"
                        class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px]"
                        :class="severityColors[sn.severity]"
                      >
                        <component :is="getSpecialNeedIcon(sn.type)" class="w-2.5 h-2.5" />
                        {{ getSpecialNeedLabel(sn.type) }}
                      </span>
                    </div>
                  </div>
                </div>
                <button class="text-xs text-museum-red hover:underline" @click="cancelBooking(booking.id)">取消</button>
              </div>
            </div>

            <div v-for="booking in pendingBookings" :key="booking.id" class="p-3 bg-museum-orange/5">
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                  <AlertTriangle class="w-4 h-4 text-museum-orange" />
                  <div>
                    <div class="flex items-center gap-1.5">
                      <p class="text-sm font-medium text-museum-text">{{ booking.childName }}</p>
                      <span v-if="booking.queuePriority === 2" class="text-[9px] px-1 rounded bg-amber-100 text-amber-700">低权重</span>
                    </div>
                    <p class="text-[10px] text-museum-muted">{{ booking.childAge }}岁 · 权重 {{ booking.weightScore }}分</p>
                    <div v-if="booking.childSpecialNeeds.length > 0" class="flex flex-wrap gap-1 mt-1">
                      <span
                        v-for="sn in booking.childSpecialNeeds"
                        :key="sn.id"
                        class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px]"
                        :class="severityColors[sn.severity]"
                      >
                        <component :is="getSpecialNeedIcon(sn.type)" class="w-2.5 h-2.5" />
                        {{ getSpecialNeedLabel(sn.type) }}
                      </span>
                    </div>
                  </div>
                </div>
                <span class="text-[10px] text-museum-orange bg-museum-orange/10 px-1.5 py-0.5 rounded">待确认</span>
              </div>
              <div class="text-[10px] text-museum-orange mb-2">
                缺少材料：{{ booking.missingMaterials.join('、') || '暂无' }}
              </div>
              <div class="flex gap-2">
                <button
                  :disabled="booking.hasAllMaterials === false || booking.missingMaterials.length > 0"
                  class="flex-1 py-1.5 rounded text-xs font-medium bg-museum-green text-white hover:bg-museum-green/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  @click="confirmBooking(booking.id)"
                >
                  {{ booking.hasAllMaterials && booking.missingMaterials.length === 0 ? '确认席位' : '请先补齐材料' }}
                </button>
                <button
                  class="py-1.5 px-2 rounded text-xs border border-museum-border/40 text-museum-blue hover:bg-museum-blue/5 transition-colors"
                  @click="refreshBookingMaterials(booking.id)"
                >
                  检查材料
                </button>
                <button class="flex-1 py-1.5 rounded text-xs border border-museum-border/40 text-museum-muted hover:bg-museum-bg transition-colors" @click="cancelBooking(booking.id)">
                  取消预约
                </button>
              </div>
            </div>

            <div v-if="workshopBookings.length === 0" class="p-6 text-center text-museum-muted">
              <Users class="w-8 h-8 mx-auto mb-2 text-museum-border" />
              <p class="text-xs">暂无报名</p>
            </div>
          </div>
        </div>

        <div v-else class="bg-museum-surface rounded-xl shadow-sm border border-museum-border/30 flex flex-col items-center justify-center p-12 text-museum-muted">
          <ChevronRight class="w-10 h-10 text-museum-border mb-3" />
          <p class="text-sm">点击课程查看详情</p>
          <p class="text-xs text-museum-border mt-1">材料检查 · 年龄限制 · 课程名单</p>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="showBookingPanel" class="fixed inset-0 z-40 flex justify-end bg-black/20" @click.self="closeBookingPanel">
        <div class="w-[480px] h-full bg-museum-surface shadow-xl overflow-y-auto animate-slide-in border-l border-museum-border/30">
          <div class="p-5">
            <div class="flex items-center justify-between mb-5">
              <h2 class="text-lg font-serif font-bold text-museum-text">课程预约</h2>
              <button class="w-8 h-8 rounded-lg hover:bg-museum-bg flex items-center justify-center text-museum-muted hover:text-museum-text transition-colors" @click="closeBookingPanel">
                <X class="w-5 h-5" />
              </button>
            </div>

            <div v-if="selectedWorkshop" class="bg-museum-gold/5 rounded-lg p-3 border border-museum-gold/20 mb-4">
              <p class="text-sm font-medium text-museum-text">{{ selectedWorkshop.title }}</p>
              <p class="text-xs text-museum-muted mt-0.5">{{ fmtTime(selectedWorkshop.startTime) }}-{{ fmtTime(selectedWorkshop.endTime) }} · {{ selectedWorkshop.classroom }}</p>
            </div>

            <div v-if="showBookingResult && lastBookingWarnings.length > 0" class="mb-4 space-y-2">
              <div
                v-for="(w, i) in lastBookingWarnings"
                :key="i"
                class="bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-xs text-amber-800 flex items-start gap-2"
              >
                <AlertTriangle class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <span>{{ w }}</span>
              </div>
            </div>

            <div v-if="familyVisitors.length > 0" class="mb-4">
              <label class="block text-sm text-museum-muted mb-2 font-medium">导览观众快速带入</label>
              <div class="space-y-1.5 max-h-[120px] overflow-y-auto">
                <div
                  v-for="visitor in familyVisitors"
                  :key="visitor.id"
                  class="flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-colors"
                  :class="bookingForm.visitorId === visitor.id ? 'border-museum-gold bg-museum-gold/5' : 'border-museum-border/30 hover:border-museum-gold/50'"
                  @click="addFromVisitor(visitor.id)"
                >
                  <div>
                    <p class="text-sm font-medium text-museum-text">{{ visitor.name }}</p>
                    <p class="text-[10px] text-museum-muted">
                      {{ visitor.childAgeRange }} · {{ visitor.headcount }}人
                      <span v-if="visitor.isBlacklisted" class="text-rose-600"> · 黑名单</span>
                    </p>
                  </div>
                  <span class="text-[10px] text-museum-blue">带入</span>
                </div>
              </div>
            </div>

            <div v-if="weightResult" class="mb-4 bg-museum-bg/50 rounded-lg p-3 border border-museum-border/20">
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-1.5 text-sm font-medium text-museum-text">
                  <Scale class="w-4 h-4 text-museum-gold" />
                  预约权重评估
                </div>
                <div class="flex items-baseline gap-1">
                  <span class="text-2xl font-bold" :class="getWeightColor(weightResult.weight, weightResult.maxWeight)">
                    {{ weightResult.weight }}
                  </span>
                  <span class="text-xs text-museum-muted">/ {{ weightResult.maxWeight }}分</span>
                </div>
              </div>
              <div class="w-full h-2 bg-museum-border/30 rounded-full overflow-hidden mb-3">
                <div
                  class="h-full transition-all duration-500"
                  :class="getWeightBgColor(weightResult.weight, weightResult.maxWeight)"
                  :style="{ width: `${(weightResult.weight / weightResult.maxWeight) * 100}%` }"
                />
              </div>
              <div class="grid grid-cols-2 gap-2 text-[10px] text-museum-muted">
                <div class="flex items-center justify-between">
                  <span>基础分</span>
                  <span class="text-museum-text font-medium">+{{ weightResult.breakdown.baseScore }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span>缺席({{ weightResult.absenceCount30d }}次)</span>
                  <span class="text-rose-600 font-medium" v-if="weightResult.breakdown.absenceDeduction > 0">-{{ weightResult.breakdown.absenceDeduction }}</span>
                  <span class="text-museum-green" v-else>—</span>
                </div>
                <div class="flex items-center justify-between">
                  <span>迟到({{ weightResult.lateCount30d }}次)</span>
                  <span class="text-amber-600 font-medium" v-if="weightResult.breakdown.lateDeduction > 0">-{{ weightResult.breakdown.lateDeduction }}</span>
                  <span class="text-museum-green" v-else>—</span>
                </div>
                <div class="flex items-center justify-between">
                  <span>投诉({{ weightResult.complaintCount30d }}次)</span>
                  <span class="text-rose-600 font-medium" v-if="weightResult.breakdown.complaintDeduction > 0">-{{ weightResult.breakdown.complaintDeduction }}</span>
                  <span class="text-museum-green" v-else>—</span>
                </div>
              </div>
              <div class="mt-3 grid grid-cols-2 gap-2 pt-2 border-t border-museum-border/20">
                <div class="bg-museum-surface rounded p-2">
                  <p class="text-[10px] text-museum-muted mb-0.5">押金标准</p>
                  <p class="text-sm font-semibold" :class="depositInfo.multiplier > 1 ? 'text-rose-600' : 'text-museum-text'">
                    ¥{{ depositInfo.required }}
                    <span v-if="depositInfo.multiplier > 1" class="text-[10px]">({{ depositInfo.multiplier }}倍)</span>
                  </p>
                </div>
                <div class="bg-museum-surface rounded p-2">
                  <p class="text-[10px] text-museum-muted mb-0.5">确认优先级</p>
                  <p class="text-sm font-semibold" :class="weightResult.queuePriority === 1 ? 'text-museum-green' : 'text-amber-600'">
                    {{ weightResult.queuePriority === 1 ? '优先排位' : '靠后排位' }}
                  </p>
                </div>
              </div>
            </div>

            <div v-if="bookingWarnings.length > 0" class="mb-4 space-y-2">
              <div
                v-for="(w, i) in bookingWarnings"
                :key="i"
                class="rounded-lg p-2.5 text-xs flex items-start gap-2"
                :class="{
                  'bg-red-50 border border-red-200 text-red-800': w.type === 'error',
                  'bg-amber-50 border border-amber-200 text-amber-800': w.type === 'warning',
                  'bg-blue-50 border border-blue-200 text-blue-800': w.type === 'info',
                }"
              >
                <component :is="w.icon" class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <span>{{ w.text }}</span>
              </div>
            </div>

            <div v-if="duplicateCheck?.isDuplicate" class="mb-4 bg-rose-50 border border-rose-200 rounded-lg p-3">
              <div class="flex items-center gap-1.5 text-sm font-medium text-rose-700 mb-2">
                <AlertOctagon class="w-4 h-4" />
                身份证号重复预约检测
              </div>
              <p class="text-[11px] text-rose-700 mb-2">
                检测到该身份证号已有 {{ duplicateCheck.duplicateBookings.length }} 条预约记录，系统将自动保留最早场次
              </p>
              <div class="space-y-1">
                <div
                  v-for="dup in duplicateCheck.duplicateBookings"
                  :key="dup.id"
                  class="text-[10px] bg-white rounded p-2 border border-rose-100"
                >
                  <div class="flex items-center justify-between">
                    <span class="text-museum-text font-medium">{{ dup.title }}</span>
                    <span class="px-1 rounded" :class="dup.type === 'session' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'">
                      {{ dup.type === 'session' ? '导览' : '课程' }}
                    </span>
                  </div>
                  <p class="text-museum-muted mt-0.5">
                    {{ fmtDateTime(dup.startTime) }} · {{ dup.venueId }}
                  </p>
                </div>
              </div>
            </div>

            <div class="space-y-4">
              <div>
                <label class="block text-sm text-museum-muted mb-1.5 font-medium">身份证号 <span class="text-museum-red">*</span></label>
                <input
                  v-model="bookingForm.idCardNumber"
                  type="text"
                  placeholder="请输入身份证号（用于去重校验和权重评估）"
                  class="w-full bg-museum-bg border border-museum-border/60 rounded-lg px-3 py-2.5 text-sm text-museum-text placeholder-museum-muted/50 focus:outline-none focus:ring-1 focus:ring-museum-gold"
                />
              </div>

              <div>
                <label class="block text-sm text-museum-muted mb-1.5 font-medium">儿童姓名 <span class="text-museum-red">*</span></label>
                <input v-model="bookingForm.childName" type="text" placeholder="请输入儿童姓名" class="w-full bg-museum-bg border border-museum-border/60 rounded-lg px-3 py-2.5 text-sm text-museum-text placeholder-museum-muted/50 focus:outline-none focus:ring-1 focus:ring-museum-gold" />
              </div>

              <div>
                <label class="block text-sm text-museum-muted mb-1.5 font-medium">年龄 <span class="text-museum-red">*</span></label>
                <input v-model.number="bookingForm.childAge" type="number" min="1" max="18" class="w-full bg-museum-bg border border-museum-border/60 rounded-lg px-3 py-2.5 text-sm text-museum-text focus:outline-none focus:ring-1 focus:ring-museum-gold" />
              </div>

              <div class="bg-museum-bg/50 rounded-lg p-3 border border-museum-border/20">
                <p class="text-sm font-medium text-museum-text mb-2 flex items-center gap-1.5">
                  <Heart class="w-4 h-4 text-rose-500" />
                  儿童特殊需求
                  <span class="text-[10px] text-museum-muted font-normal">（过敏史、行动障碍等将推送至讲解员端）</span>
                </p>

                <div v-if="bookingForm.specialNeeds.length > 0" class="space-y-1.5 mb-3">
                  <div
                    v-for="(sn, idx) in bookingForm.specialNeeds"
                    :key="sn.id"
                    class="flex items-center justify-between p-2 rounded-lg bg-white border"
                    :class="severityColors[sn.severity].replace('text-', 'border-').replace('-600', '-200')"
                  >
                    <div class="flex items-center gap-2">
                      <component :is="getSpecialNeedIcon(sn.type)" class="w-4 h-4" :class="getSpecialNeedColor(sn.type)" />
                      <div>
                        <p class="text-xs font-medium text-museum-text">
                          {{ getSpecialNeedLabel(sn.type) }}
                          <span class="ml-1 text-[10px] px-1 rounded" :class="severityColors[sn.severity]">{{ severityLabels[sn.severity] }}</span>
                        </p>
                        <p class="text-[10px] text-museum-muted">
                          {{ sn.description }}
                          <span v-if="sn.allergyDetail">（过敏原：{{ sn.allergyDetail }}）</span>
                        </p>
                      </div>
                    </div>
                    <button
                      class="w-6 h-6 rounded hover:bg-rose-50 text-museum-muted hover:text-rose-600 flex items-center justify-center"
                      @click="removeSpecialNeed(idx)"
                    >
                      <X class="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div class="space-y-2 pt-2 border-t border-museum-border/20">
                  <div class="grid grid-cols-2 gap-2">
                    <div>
                      <label class="block text-[10px] text-museum-muted mb-1">类型</label>
                      <select
                        v-model="newSpecialNeed.type"
                        class="w-full bg-museum-surface border border-museum-border/60 rounded-lg px-2 py-1.5 text-xs text-museum-text focus:outline-none focus:ring-1 focus:ring-museum-gold"
                      >
                        <option v-for="opt in specialNeedTypeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                      </select>
                    </div>
                    <div>
                      <label class="block text-[10px] text-museum-muted mb-1">严重程度</label>
                      <select
                        v-model="newSpecialNeed.severity"
                        class="w-full bg-museum-surface border border-museum-border/60 rounded-lg px-2 py-1.5 text-xs text-museum-text focus:outline-none focus:ring-1 focus:ring-museum-gold"
                      >
                        <option value="mild">轻度</option>
                        <option value="moderate">中度</option>
                        <option value="severe">重度</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label class="block text-[10px] text-museum-muted mb-1">详细描述</label>
                    <input
                      v-model="newSpecialNeed.description"
                      type="text"
                      placeholder="如：花生过敏、轮椅出行等"
                      class="w-full bg-museum-surface border border-museum-border/60 rounded-lg px-2 py-1.5 text-xs text-museum-text placeholder-museum-muted/50 focus:outline-none focus:ring-1 focus:ring-museum-gold"
                    />
                  </div>
                  <div v-if="newSpecialNeed.type === 'allergy'">
                    <label class="block text-[10px] text-museum-muted mb-1">过敏原详情（可选）</label>
                    <input
                      v-model="newSpecialNeed.allergyDetail"
                      type="text"
                      placeholder="如：花生、坚果、海鲜等"
                      class="w-full bg-museum-surface border border-museum-border/60 rounded-lg px-2 py-1.5 text-xs text-museum-text placeholder-museum-muted/50 focus:outline-none focus:ring-1 focus:ring-museum-gold"
                    />
                  </div>
                  <button
                    :disabled="!newSpecialNeed.description.trim()"
                    class="w-full py-1.5 rounded-lg text-xs border border-museum-gold/40 text-museum-gold hover:bg-museum-gold/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                    @click="addSpecialNeed"
                  >
                    <Plus class="w-3 h-3" /> 添加特殊需求
                  </button>
                </div>
              </div>

              <div class="bg-museum-bg/50 rounded-lg p-3 border border-museum-border/20">
                <p class="text-sm font-medium text-museum-text mb-2">资格检查</p>
                <div class="space-y-2">
                  <div class="flex items-center justify-between">
                    <span class="text-xs text-museum-muted">年龄要求</span>
                    <span class="text-xs flex items-center gap-1" :class="ageCheckResult.ageOk ? 'text-museum-green' : 'text-museum-red'">
                      <CheckCircle v-if="ageCheckResult.ageOk" class="w-3 h-3" />
                      <XCircle v-else class="w-3 h-3" />
                      {{ ageCheckResult.minAge }}-{{ ageCheckResult.maxAge }}岁
                    </span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-xs text-museum-muted">教室容量</span>
                    <span class="text-xs flex items-center gap-1" :class="capacityCheck.canBook ? 'text-museum-green' : 'text-museum-red'">
                      <CheckCircle v-if="capacityCheck.canBook" class="w-3 h-3" />
                      <XCircle v-else class="w-3 h-3" />
                      剩余 {{ capacityCheck.availableSpots }} 个名额
                    </span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-xs text-museum-muted">材料库存</span>
                    <span class="text-xs flex items-center gap-1" :class="materialCheck.hasAllMaterials ? 'text-museum-green' : 'text-museum-orange'">
                      <CheckCircle v-if="materialCheck.hasAllMaterials" class="w-3 h-3" />
                      <AlertTriangle v-else class="w-3 h-3" />
                      {{ materialCheck.hasAllMaterials ? '齐全' : '部分缺失' }}
                    </span>
                  </div>
                  <div v-if="weightResult" class="flex items-center justify-between">
                    <span class="text-xs text-museum-muted">预约权限</span>
                    <span class="text-xs flex items-center gap-1" :class="weightResult.isBlacklisted ? 'text-museum-red' : 'text-museum-green'">
                      <ShieldAlert v-if="weightResult.isBlacklisted" class="w-3 h-3" />
                      <CheckCircle v-else class="w-3 h-3" />
                      {{ weightResult.isBlacklisted ? '黑名单受限' : '正常' }}
                    </span>
                  </div>
                  <div v-if="lockCheck" class="flex items-center justify-between">
                    <span class="text-xs text-museum-muted">场馆锁定</span>
                    <span class="text-xs flex items-center gap-1" :class="lockCheck.locked ? 'text-museum-red' : 'text-museum-green'">
                      <Lock v-if="lockCheck.locked" class="w-3 h-3" />
                      <CheckCircle v-else class="w-3 h-3" />
                      {{ lockCheck.locked ? '2小时内已锁定' : '未锁定' }}
                    </span>
                  </div>
                </div>
                <div v-if="materialCheck.missingMaterials.length > 0" class="mt-2 p-2 bg-museum-orange/5 rounded border border-museum-orange/20">
                  <p class="text-[10px] text-museum-orange">
                    缺少：{{ materialCheck.missingMaterials.join('、') }}
                  </p>
                  <p class="text-[10px] text-museum-muted mt-1">提交后将进入待确认状态，材料补齐后方可确认席位</p>
                </div>
              </div>

              <button
                :disabled="!canConfirm"
                class="w-full py-2.5 rounded-lg text-sm font-medium transition-colors bg-museum-gold text-white hover:bg-museum-gold/90 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm shadow-museum-gold/20"
                @click="submitBooking"
              >
                {{ materialCheck.hasAllMaterials ? '确认预约（提交）' : '提交待确认' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
