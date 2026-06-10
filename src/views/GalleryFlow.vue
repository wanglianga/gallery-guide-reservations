<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  Building2, Users, UserSquare2, AlertCircle, CalendarDays, Clock,
  ChevronDown, ChevronUp, Filter, Phone, ShieldAlert,
  ArrowRight, Headphones, X, CheckCircle2, Info
} from 'lucide-vue-next'
import { useGalleryFlowStore } from '@/stores/galleryFlow'
import { galleries, exhibitions } from '@/mock/data'
import CapacityBar from '@/components/common/CapacityBar.vue'
import type { GalleryTimeSlot, OverCapacityAction } from '@/types'

const gfStore = useGalleryFlowStore()

const filterDate = ref(gfStore.uniqueDates[0] || '')
const filterGalleryId = ref<string>('')
const expandedSlotId = ref<string | null>(null)
const selectedOverSlot = ref<GalleryTimeSlot | null>(null)
const overCapacityModalOpen = ref(false)

const galleryMap = computed(() => {
  const m: Record<string, string> = {}
  galleries.forEach(g => { m[g.id] = g.name })
  return m
})

const galleryCapacityMap = computed(() => {
  const m: Record<string, number> = {}
  galleries.forEach(g => { m[g.id] = g.capacity })
  return m
})

const exhibitionMap = computed(() => {
  const m: Record<string, string> = {}
  exhibitions.forEach(e => { m[e.id] = e.title })
  return m
})

const galleryOptions = computed(() => {
  const opts: Array<{ id: string; name: string }> = [{ id: '', name: '全部展厅' }]
  galleries.forEach(g => opts.push({ id: g.id, name: g.name }))
  return opts
})

const filteredData = computed(() => {
  let data = gfStore.getSlotsByDate(filterDate.value)
  if (filterGalleryId.value) {
    data = data.filter(s => s.galleryId === filterGalleryId.value)
  }
  return data
})

const groupedByGallery = computed(() => {
  const groups: Record<string, GalleryTimeSlot[]> = {}
  filteredData.value.forEach(s => {
    if (!groups[s.galleryId]) groups[s.galleryId] = []
    groups[s.galleryId].push(s)
  })
  return groups
})

const galleryStats = computed(() => {
  const stats: Record<string, { total: number; warning: number; full: number }> = {}
  filteredData.value.forEach(s => {
    if (!stats[s.galleryId]) stats[s.galleryId] = { total: 0, warning: 0, full: 0 }
    stats[s.galleryId].total++
    const status = gfStore.getSlotStatus(s)
    if (status === 'warning') stats[s.galleryId].warning++
    if (status === 'full') stats[s.galleryId].full++
  })
  return stats
})

const todaySummary = computed(() => {
  const all = filteredData.value
  return {
    total: all.length,
    warning: all.filter(s => gfStore.getSlotStatus(s) === 'warning').length,
    full: all.filter(s => gfStore.getSlotStatus(s) === 'full').length,
    available: all.filter(s => gfStore.getSlotStatus(s) === 'available').length,
  }
})

function toggleExpand(id: string) {
  expandedSlotId.value = expandedSlotId.value === id ? null : id
}

function fmtDateDisplay(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}月${d.getDate()}日 周${'日一二三四五六'[d.getDay()]}`
}

function openOverCapacity(slot: GalleryTimeSlot) {
  selectedOverSlot.value = slot
  overCapacityModalOpen.value = true
}

function closeOverCapacity() {
  overCapacityModalOpen.value = false
  selectedOverSlot.value = null
}

const selectedAction = ref<OverCapacityAction | null>(null)

function selectAction(a: OverCapacityAction) {
  selectedAction.value = a
}

function confirmAction() {
  closeOverCapacity()
  selectedAction.value = null
}

function nextSlotDisplay(slot: GalleryTimeSlot) {
  const next = gfStore.findNextAvailableSlot(slot.date, slot.galleryId, slot.startTime)
  if (!next) return null
  return `${next.startTime}-${next.endTime}`
}

function occupancyColorClass(rate: number) {
  if (rate >= 1) return 'text-rose-600'
  if (rate >= 0.85) return 'text-amber-600'
  return 'text-emerald-600'
}

function occupancyBgClass(rate: number) {
  if (rate >= 1) return 'bg-rose-500'
  if (rate >= 0.85) return 'bg-amber-500'
  return 'bg-emerald-500'
}

const actionIcon = {
  'suggest-next': ArrowRight,
  'self-guided': Headphones,
}
</script>

<template>
  <div class="animate-fade-in-up space-y-5">
    <div class="flex items-end justify-between">
      <div>
        <p class="text-sm text-museum-muted mb-1 font-sans tracking-wide">展厅人流</p>
        <h1 class="text-3xl font-serif font-bold text-museum-text tracking-tight">特展容量管理</h1>
      </div>
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200">
          <CheckCircle2 class="w-4 h-4 text-emerald-600" />
          <span class="text-sm text-emerald-700 font-medium">{{ todaySummary.available }} 时段可预约</span>
        </div>
        <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200">
          <AlertCircle class="w-4 h-4 text-amber-600" />
          <span class="text-sm text-amber-700 font-medium">{{ todaySummary.warning }} 即将满员</span>
        </div>
        <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200">
          <ShieldAlert class="w-4 h-4 text-rose-600" />
          <span class="text-sm text-rose-700 font-medium">{{ todaySummary.full }} 已满员</span>
        </div>
      </div>
    </div>

    <div class="flex items-center gap-2 bg-museum-surface rounded-xl p-3 border border-museum-border/30 shadow-sm">
      <Filter class="w-4 h-4 text-museum-muted" />
      <label class="flex items-center gap-1.5">
        <CalendarDays class="w-4 h-4 text-museum-muted" />
        <select
          v-model="filterDate"
          class="bg-museum-bg border border-museum-border/60 rounded-lg px-3 py-1.5 text-sm text-museum-text focus:outline-none focus:ring-1 focus:ring-museum-gold"
        >
          <option v-for="d in gfStore.uniqueDates" :key="d" :value="d">{{ fmtDateDisplay(d) }}</option>
        </select>
      </label>
      <label class="flex items-center gap-1.5">
        <Building2 class="w-4 h-4 text-museum-muted" />
        <select
          v-model="filterGalleryId"
          class="bg-museum-bg border border-museum-border/60 rounded-lg px-3 py-1.5 text-sm text-museum-text focus:outline-none focus:ring-1 focus:ring-museum-gold"
        >
          <option v-for="g in galleryOptions" :key="g.id" :value="g.id">{{ g.name }}</option>
        </select>
      </label>
      <div class="flex-1" />
      <span class="text-xs text-museum-muted">{{ filteredData.length }} 个时段</span>
    </div>

    <div class="space-y-6">
      <div v-for="(slots, gid) in groupedByGallery" :key="gid" class="bg-museum-surface rounded-xl shadow-sm border border-museum-border/30 overflow-hidden">
        <div class="px-5 py-4 border-b border-museum-border/20 bg-museum-bg/30 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-museum-gold/15 flex items-center justify-center">
              <Building2 class="w-5 h-5 text-museum-gold" />
            </div>
            <div>
              <h3 class="text-base font-serif font-semibold text-museum-text">{{ galleryMap[gid] || gid }}</h3>
              <p class="text-xs text-museum-muted mt-0.5">
                容量 {{ galleryCapacityMap[gid] }} 人 ·
                特展：{{ slots[0]?.exhibitionId ? exhibitionMap[slots[0].exhibitionId] : '常设展览' }}
              </p>
            </div>
          </div>
          <div v-if="galleryStats[gid]" class="flex items-center gap-4 text-xs">
            <div class="flex items-center gap-1">
              <span class="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
              <span class="text-museum-muted">可预约</span>
              <span class="font-semibold text-emerald-600 tabular-nums">{{ galleryStats[gid].total - galleryStats[gid].warning - galleryStats[gid].full }}</span>
            </div>
            <div class="flex items-center gap-1">
              <span class="inline-block w-2 h-2 rounded-full bg-amber-500"></span>
              <span class="text-museum-muted">预警</span>
              <span class="font-semibold text-amber-600 tabular-nums">{{ galleryStats[gid].warning }}</span>
            </div>
            <div class="flex items-center gap-1">
              <span class="inline-block w-2 h-2 rounded-full bg-rose-500"></span>
              <span class="text-museum-muted">满员</span>
              <span class="font-semibold text-rose-600 tabular-nums">{{ galleryStats[gid].full }}</span>
            </div>
          </div>
        </div>

        <div class="divide-y divide-museum-border/15">
          <div
            v-for="slot in slots"
            :key="slot.id"
            class="transition-colors"
            :class="{
              'bg-rose-50/40': gfStore.getSlotStatus(slot) === 'full',
              'bg-amber-50/30': gfStore.getSlotStatus(slot) === 'warning'
            }"
          >
            <div
              class="px-5 py-3.5 cursor-pointer hover:bg-museum-gold/5 flex items-center gap-4"
              @click="toggleExpand(slot.id)"
            >
              <component :is="expandedSlotId === slot.id ? ChevronUp : ChevronDown" class="w-4 h-4 text-museum-muted flex-shrink-0" />

              <div class="flex items-center gap-3 w-36 flex-shrink-0">
                <Clock class="w-4 h-4 text-museum-blue" />
                <span class="text-sm font-medium text-museum-text tabular-nums">{{ slot.startTime }} - {{ slot.endTime }}</span>
              </div>

              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-3">
                  <div class="flex-1 h-2.5 bg-museum-border/30 rounded-full overflow-hidden flex">
                    <div
                      class="h-full transition-all duration-300"
                      :class="occupancyBgClass(slot.groupBooked / slot.capacity)"
                      :style="{ width: `${Math.min(100, slot.groupBooked / slot.capacity * 100)}%` }"
                      :title="`团队占用 ${slot.groupBooked} 人`"
                    />
                    <div
                      class="h-full bg-museum-blue/70 transition-all duration-300"
                      :style="{ width: `${Math.min(100, slot.individualBooked / slot.capacity * 100)}%` }"
                      :title="`散客预约 ${slot.individualBooked} 人`"
                    />
                  </div>
                  <span
                    class="text-sm font-serif font-bold tabular-nums flex-shrink-0 min-w-[80px] text-right"
                    :class="occupancyColorClass(gfStore.occupancyRate(slot))"
                  >
                    {{ gfStore.totalBooked(slot) }}/{{ slot.capacity }}
                    <span class="text-[10px] text-museum-muted ml-0.5">
                      ({{ Math.round(gfStore.occupancyRate(slot) * 100) }}%)
                    </span>
                  </span>
                </div>
                <div class="flex items-center gap-4 mt-1.5 text-[11px]">
                  <div class="flex items-center gap-1">
                    <span class="inline-block w-2 h-2 rounded-full bg-amber-500"></span>
                    <span class="text-museum-muted">团队占用</span>
                    <span class="font-medium text-amber-700 tabular-nums">{{ slot.groupBooked }} 人</span>
                    <span v-if="slot.groupReservations.length" class="text-museum-muted">({{ slot.groupReservations.length }} 个团队)</span>
                  </div>
                  <div class="flex items-center gap-1">
                    <span class="inline-block w-2 h-2 rounded-full bg-museum-blue"></span>
                    <span class="text-museum-muted">散客预约</span>
                    <span class="font-medium text-museum-blue tabular-nums">{{ slot.individualBooked }} 人</span>
                  </div>
                  <div class="flex items-center gap-1">
                    <span class="inline-block w-2 h-2 rounded-full bg-museum-border/60"></span>
                    <span class="text-museum-muted">剩余</span>
                    <span
                      class="font-medium tabular-nums"
                      :class="slot.capacity - gfStore.totalBooked(slot) > 0 ? 'text-emerald-600' : 'text-rose-600'"
                    >
                      {{ slot.capacity - gfStore.totalBooked(slot) }} 人
                    </span>
                  </div>
                </div>
              </div>

              <div class="flex-shrink-0 ml-2">
                <span
                  class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border"
                  :class="gfStore.slotStatusLabel[gfStore.getSlotStatus(slot)].class"
                >
                  {{ gfStore.slotStatusLabel[gfStore.getSlotStatus(slot)].text }}
                </span>
                <button
                  v-if="gfStore.getSlotStatus(slot) !== 'available'"
                  class="ml-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-white border border-museum-border/60 text-museum-text hover:bg-museum-bg transition-colors"
                  @click.stop="openOverCapacity(slot)"
                >
                  <Info class="w-3 h-3 text-museum-gold" />
                  处理建议
                </button>
              </div>
            </div>

            <Transition name="expand">
              <div v-if="expandedSlotId === slot.id" class="px-5 pb-4">
                <div v-if="slot.groupReservations.length" class="mb-4">
                  <h4 class="text-xs font-semibold text-museum-muted uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <Users class="w-3.5 h-3.5 text-amber-600" />
                    团队预约明细
                  </h4>
                  <div class="grid grid-cols-2 gap-2">
                    <div
                      v-for="gr in slot.groupReservations"
                      :key="gr.id"
                      class="flex items-center justify-between rounded-lg border bg-white p-3"
                      :class="gr.confirmed ? 'border-amber-200 bg-amber-50/50' : 'border-museum-border/40 opacity-80'"
                    >
                      <div class="flex items-center gap-3 min-w-0">
                        <div
                          class="w-8 h-8 rounded-lg flex items-center justify-center"
                          :class="gr.confirmed ? 'bg-amber-100' : 'bg-museum-border/30'"
                        >
                          <UserSquare2 class="w-4 h-4" :class="gr.confirmed ? 'text-amber-600' : 'text-museum-muted'" />
                        </div>
                        <div class="min-w-0">
                          <div class="text-sm font-medium text-museum-text truncate">{{ gr.groupName }}</div>
                          <div class="flex items-center gap-1.5 mt-0.5 text-[11px] text-museum-muted">
                            <Phone class="w-3 h-3" />
                            <span>{{ gr.contactName }}</span>
                            <span>·</span>
                            <span>{{ gr.contactPhone }}</span>
                          </div>
                        </div>
                      </div>
                      <div class="flex items-center gap-3 flex-shrink-0 ml-2">
                        <div class="text-right">
                          <div class="text-base font-serif font-bold text-amber-700 tabular-nums">{{ gr.headcount }}</div>
                          <div class="text-[10px] text-museum-muted">人</div>
                        </div>
                        <span
                          class="text-[10px] px-2 py-0.5 rounded"
                          :class="gr.confirmed ? 'bg-amber-100 text-amber-700' : 'bg-museum-bg text-museum-muted'"
                        >
                          {{ gr.confirmed ? '已确认' : '待确认' }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div v-if="slot.groupReservations.length === 0" class="mb-4 text-xs text-museum-muted bg-museum-bg/50 rounded-lg p-3 text-center">
                  暂无团队预约
                </div>

                <div class="flex items-center justify-between text-xs">
                  <div class="flex items-center gap-4">
                    <div class="flex items-center gap-1.5">
                      <span class="inline-block w-3 h-3 rounded bg-museum-blue/70"></span>
                      <span class="text-museum-muted">散客预约</span>
                      <span class="font-semibold text-museum-blue tabular-nums">{{ slot.individualBooked }} 人</span>
                    </div>
                    <div class="flex items-center gap-1.5">
                      <span class="inline-block w-3 h-3 rounded bg-amber-500"></span>
                      <span class="text-museum-muted">团队占用</span>
                      <span class="font-semibold text-amber-600 tabular-nums">{{ slot.groupBooked }} 人</span>
                    </div>
                    <div class="flex items-center gap-1.5">
                      <span class="inline-block w-3 h-3 rounded bg-emerald-500"></span>
                      <span class="text-museum-muted">剩余</span>
                      <span class="font-semibold text-emerald-600 tabular-nums">{{ slot.capacity - gfStore.totalBooked(slot) }} 人</span>
                    </div>
                  </div>
                  <div class="flex items-center gap-1.5 text-museum-muted">
                    <CapacityBar :current="gfStore.totalBooked(slot)" :max="slot.capacity" :showText="false" size="sm" />
                    <span class="tabular-nums">{{ Math.round(gfStore.occupancyRate(slot) * 100) }}%</span>
                  </div>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </div>

      <div v-if="filteredData.length === 0" class="text-center py-16 text-museum-muted bg-museum-surface rounded-xl border border-museum-border/30">
        <Building2 class="w-10 h-10 mx-auto mb-3 text-museum-border" />
        <p class="text-sm">当前筛选条件下暂无时段数据</p>
      </div>
    </div>

    <Transition name="fade">
      <div
        v-if="overCapacityModalOpen && selectedOverSlot"
        class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
        @click.self="closeOverCapacity"
      >
        <div class="bg-museum-surface rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up">
          <div class="flex items-start justify-between p-5 border-b border-museum-border/30"
            :class="gfStore.getSlotStatus(selectedOverSlot) === 'full' ? 'bg-rose-50/60' : 'bg-amber-50/60'"
          >
            <div>
              <div class="flex items-center gap-2">
                <AlertCircle class="w-5 h-5" :class="gfStore.getSlotStatus(selectedOverSlot) === 'full' ? 'text-rose-600' : 'text-amber-600'" />
                <h3 class="text-lg font-serif font-bold text-museum-text">前台处理建议</h3>
              </div>
              <p class="text-xs text-museum-muted mt-1.5">
                {{ galleryMap[selectedOverSlot.galleryId] || selectedOverSlot.galleryId }} ·
                {{ selectedOverSlot.startTime }}-{{ selectedOverSlot.endTime }} ·
                当前 <span class="font-semibold" :class="gfStore.getSlotStatus(selectedOverSlot) === 'full' ? 'text-rose-600' : 'text-amber-600'">
                  {{ gfStore.totalBooked(selectedOverSlot) }}/{{ selectedOverSlot.capacity }}
                </span>
              </p>
            </div>
            <button class="w-7 h-7 rounded-lg hover:bg-white/60 flex items-center justify-center text-museum-muted hover:text-museum-text" @click="closeOverCapacity">
              <X class="w-4 h-4" />
            </button>
          </div>

          <div class="p-5 space-y-2">
            <p class="text-sm text-museum-muted mb-3">该时段容量{{ gfStore.getSlotStatus(selectedOverSlot) === 'full' ? '已满' : '即将饱和' }}，请向前台推荐以下方案：</p>
            <div
              v-for="act in gfStore.getOverCapacityActions(selectedOverSlot)"
              :key="act"
              class="p-4 rounded-xl border cursor-pointer transition-all"
              :class="selectedAction === act
                ? 'border-museum-gold bg-museum-gold/10 ring-2 ring-museum-gold/30'
                : 'border-museum-border/40 hover:bg-museum-bg'"
              @click="selectAction(act)"
            >
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-museum-gold/15 flex items-center justify-center text-xl">
                  {{ gfStore.overCapacityActionLabel[act].icon }}
                </div>
                <div class="flex-1">
                  <div class="text-sm font-semibold text-museum-text flex items-center gap-2">
                    {{ gfStore.overCapacityActionLabel[act].text }}
                    <template v-if="act === 'suggest-next' && nextSlotDisplay(selectedOverSlot)">
                      <span class="text-xs text-museum-muted bg-museum-bg px-2 py-0.5 rounded-md border border-museum-border/30">
                        下一场 {{ nextSlotDisplay(selectedOverSlot)! }}
                      </span>
                    </template>
                  </div>
                  <div class="text-xs text-museum-muted mt-0.5">
                    {{ gfStore.overCapacityActionLabel[act].desc }}
                  </div>
                </div>
                <CheckCircle2 v-if="selectedAction === act" class="w-5 h-5 text-museum-gold" />
              </div>
            </div>
          </div>

          <div class="p-4 bg-museum-bg/50 border-t border-museum-border/30 flex gap-2">
            <button
              class="flex-1 py-2.5 rounded-lg text-sm font-medium bg-museum-bg border border-museum-border/40 text-museum-text hover:bg-museum-border/20"
              @click="closeOverCapacity"
            >
              关闭
            </button>
            <button
              class="flex-1 py-2.5 rounded-lg text-sm font-medium bg-museum-gold text-white hover:bg-museum-gold/90 disabled:opacity-40"
              :disabled="!selectedAction"
              @click="confirmAction"
            >
              确认并记录建议
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.expand-enter-active,
.expand-leave-active {
  transition: all 0.25s ease;
  overflow: hidden;
}
.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
  padding-top: 0 !important;
  padding-bottom: 0 !important;
}
.expand-enter-to,
.expand-leave-from {
  max-height: 600px;
  opacity: 1;
}
</style>
