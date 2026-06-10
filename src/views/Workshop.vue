<script setup lang="ts">
import { ref, computed } from 'vue'
import { Palette, Users, Clock, MapPin, Baby, AlertTriangle, CheckCircle, XCircle, Plus, X, Search, Package, ChevronRight } from 'lucide-vue-next'
import { useWorkshopStore } from '@/stores/workshop'
import { useVisitorStore } from '@/stores/visitor'
import { useSessionStore } from '@/stores/session'
import { useAppStore } from '@/stores/app'
import CapacityBar from '@/components/common/CapacityBar.vue'
import { exhibitions, languageLabels } from '@/mock/data'
import type { Workshop, WorkshopBooking } from '@/types'

const workshopStore = useWorkshopStore()
const visitorStore = useVisitorStore()
const sessionStore = useSessionStore()
const appStore = useAppStore()

const selectedWorkshopId = ref<string | null>(null)
const showBookingPanel = ref(false)
const filterType = ref('all')
const searchQuery = ref('')

const bookingForm = ref({
  visitorId: '',
  childName: '',
  childAge: 6,
})

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
  return selectedWorkshopId.value ? workshopStore.bookingsByWorkshop(selectedWorkshopId.value) : []
})

const confirmedBookings = computed(() => {
  return workshopBookings.value.filter(b => b.confirmed)
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

const canConfirm = computed(() => {
  if (!bookingForm.value.childName.trim()) return false
  if (!ageCheckResult.value.ageOk) return false
  if (!capacityCheck.value.canBook) return false
  if (!materialCheck.value.hasAllMaterials) return false
  return true
})

function fmtTime(iso: string) {
  return iso.slice(11, 16)
}

function fmtDate(iso: string) {
  return iso.slice(5, 10)
}

function getExhibitionTitle(exhibitionId: string) {
  const ex = exhibitions.find(e => e.id === exhibitionId)
  return ex?.title || ''
}

function selectWorkshop(id: string) {
  selectedWorkshopId.value = selectedWorkshopId.value === id ? null : id
}

function openBookingPanel(workshopId: string) {
  selectedWorkshopId.value = workshopId
  bookingForm.value = { visitorId: '', childName: '', childAge: 6 }
  showBookingPanel.value = true
}

function closeBookingPanel() {
  showBookingPanel.value = false
}

function addFromVisitor(visitorId: string) {
  const visitor = visitorStore.visitors.find(v => v.id === visitorId)
  if (visitor) {
    bookingForm.value.visitorId = visitorId
    bookingForm.value.childName = visitor.name + ' 孩子'
  }
}

function submitBooking() {
  if (!selectedWorkshopId.value || !bookingForm.value.childName.trim()) return

  const hasMaterials = materialCheck.value.hasAllMaterials

  const booking = {
    workshopId: selectedWorkshopId.value,
    visitorId: bookingForm.value.visitorId,
    childName: bookingForm.value.childName.trim(),
    childAge: bookingForm.value.childAge,
    hasAllMaterials: hasMaterials,
    missingMaterials: hasMaterials ? [] : materialCheck.value.missingMaterials,
    confirmed: hasMaterials,
  }

  workshopStore.addBooking(booking)

  if (hasMaterials) {
    workshopStore.useMaterials(selectedWorkshopId.value, 1)
  }

  bookingForm.value = { visitorId: '', childName: '', childAge: 6 }
}

function refreshBookingMaterials(bookingId: string) {
  const booking = workshopStore.bookings.find(b => b.id === bookingId)
  if (!booking) return
  const matCheck = workshopStore.checkMaterials(booking.workshopId, 1)
  workshopStore.updateBookingMaterials(bookingId, matCheck)
}

function confirmBooking(bookingId: string) {
  refreshBookingMaterials(bookingId)
  const booking = workshopStore.bookings.find(b => b.id === bookingId)
  if (!booking || booking.confirmed) return
  if (!booking.hasAllMaterials || booking.missingMaterials.length > 0) return
  const ok = workshopStore.confirmBooking(bookingId)
  if (ok) {
    workshopStore.useMaterials(booking.workshopId, 1)
  }
}

function cancelBooking(bookingId: string) {
  const booking = workshopStore.bookings.find(b => b.id === bookingId)
  if (booking) {
    if (booking.confirmed) {
      workshopStore.returnMaterials(booking.workshopId, 1)
    }
    workshopStore.cancelBooking(bookingId)
  }
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
                    <p class="text-sm font-medium text-museum-text">{{ booking.childName }}</p>
                    <p class="text-[10px] text-museum-muted">{{ booking.childAge }}岁</p>
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
                    <p class="text-sm font-medium text-museum-text">{{ booking.childName }}</p>
                    <p class="text-[10px] text-museum-muted">{{ booking.childAge }}岁</p>
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
        <div class="w-[420px] h-full bg-museum-surface shadow-xl overflow-y-auto animate-slide-in border-l border-museum-border/30">
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
                    <p class="text-[10px] text-museum-muted">{{ visitor.childAgeRange }} · {{ visitor.headcount }}人</p>
                  </div>
                  <span class="text-[10px] text-museum-blue">带入</span>
                </div>
              </div>
            </div>

            <div class="space-y-4">
              <div>
                <label class="block text-sm text-museum-muted mb-1.5 font-medium">儿童姓名 <span class="text-museum-red">*</span></label>
                <input v-model="bookingForm.childName" type="text" placeholder="请输入儿童姓名" class="w-full bg-museum-bg border border-museum-border/60 rounded-lg px-3 py-2.5 text-sm text-museum-text placeholder-museum-muted/50 focus:outline-none focus:ring-1 focus:ring-museum-gold" />
              </div>

              <div>
                <label class="block text-sm text-museum-muted mb-1.5 font-medium">年龄 <span class="text-museum-red">*</span></label>
                <input v-model.number="bookingForm.childAge" type="number" min="1" max="18" class="w-full bg-museum-bg border border-museum-border/60 rounded-lg px-3 py-2.5 text-sm text-museum-text focus:outline-none focus:ring-1 focus:ring-museum-gold" />
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
                </div>
                <div v-if="materialCheck.missingMaterials.length > 0" class="mt-2 p-2 bg-museum-orange/5 rounded border border-museum-orange/20">
                  <p class="text-[10px] text-museum-orange">
                    缺少：{{ materialCheck.missingMaterials.join('、') }}
                  </p>
                  <p class="text-[10px] text-museum-muted mt-1">提交后将进入待确认状态，材料补齐后方可确认席位</p>
                </div>
              </div>

              <button
                :disabled="!bookingForm.childName.trim() || !ageCheckResult.ageOk || !capacityCheck.canBook"
                class="w-full py-2.5 rounded-lg text-sm font-medium transition-colors bg-museum-gold text-white hover:bg-museum-gold/90 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm shadow-museum-gold/20"
                @click="submitBooking"
              >
                {{ materialCheck.hasAllMaterials ? '确认预约' : '提交待确认' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
