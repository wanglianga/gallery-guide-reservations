<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  Globe2, UserCheck, Users, Headphones, AlertTriangle, CheckCircle2,
  ChevronDown, ChevronUp, Filter, UserCircle, ArrowRight, X, CalendarDays
} from 'lucide-vue-next'
import { useForeignGuideStore } from '@/stores/foreignGuide'
import { useSessionStore } from '@/stores/session'
import { exhibitions, guides, languageForeignOptions, assistiveDeviceLabels } from '@/mock/data'
import LanguageTag from '@/components/common/LanguageTag.vue'
import CapacityBar from '@/components/common/CapacityBar.vue'
import type { SessionLanguage } from '@/types'

const fgStore = useForeignGuideStore()
const sessionStore = useSessionStore()

const filterLang = ref<string>('')
const filterLeaveAffectedOnly = ref(false)
const selectedId = ref<string | null>(null)
const expandedId = ref<string | null>(null)

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

const guideLanguagesMap = computed(() => {
  const m: Record<string, string[]> = {}
  guides.forEach(g => { m[g.id] = g.languages })
  return m
})

const filteredMatches = computed(() => {
  let result = fgStore.matchInfos
  if (filterLang.value) {
    result = result.filter(m => m.language === filterLang.value)
  }
  if (filterLeaveAffectedOnly.value) {
    result = result.filter(m => m.isLeaveAffected)
  }
  return result
})

const affectedCount = computed(() => fgStore.matchInfos.filter(m => m.isLeaveAffected).length)

function getSessionById(id: string) {
  return sessionStore.getSessionById(id)
}

function fmtTime(iso: string) {
  return iso.slice(11, 16)
}

function fmtDate(iso: string) {
  return iso.slice(5, 10)
}

function toggleExpand(id: string) {
  expandedId.value = expandedId.value === id ? null : id
}

function selectMatch(id: string) {
  selectedId.value = selectedId.value === id ? null : id
}

function deviceTypeIcon(type: string) {
  switch (type) {
    case 'audio-guide': return '🎧'
    case 'hearing-loop': return '🔊'
    case 'sign-interpreter': return '🤟'
    case 'magnifier': return '🔍'
    case 'wheelchair': return '♿'
    default: return '📦'
  }
}

const leaveReplacementModalOpen = ref(false)
const editingMatch = ref<any>(null)
const newReplacementId = ref<string>('')

function openReplacement(match: any) {
  editingMatch.value = match
  newReplacementId.value = match.replacementGuideId || ''
  leaveReplacementModalOpen.value = true
}

function closeReplacement() {
  leaveReplacementModalOpen.value = false
  editingMatch.value = null
  newReplacementId.value = ''
}

function confirmReplacement() {
  if (editingMatch.value && newReplacementId.value) {
    fgStore.assignReplacement(editingMatch.value.leaveRecordId, newReplacementId.value)
  }
  closeReplacement()
}

const replacementOptions = computed(() => {
  if (!editingMatch.value) return []
  const lang = editingMatch.value.language as SessionLanguage
  const originalId = editingMatch.value.originalGuideId
  const ids = fgStore.getAvailableGuidesForLanguage(lang, originalId)
  return ids.map(id => ({ id, name: guideMap.value[id], avatar: guideAvatarMap.value[id] }))
})
</script>

<template>
  <div class="animate-fade-in-up space-y-5">
    <div class="flex items-end justify-between">
      <div>
        <p class="text-sm text-museum-muted mb-1 font-sans tracking-wide">外语导览</p>
        <h1 class="text-3xl font-serif font-bold text-museum-text tracking-tight">讲解员匹配</h1>
      </div>
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-museum-orange/10 border border-museum-orange/20">
          <AlertTriangle class="w-4 h-4 text-museum-orange" />
          <span class="text-sm text-museum-orange font-medium">{{ affectedCount }} 场受请假影响</span>
        </div>
        <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-museum-blue/10 border border-museum-blue/20">
          <Globe2 class="w-4 h-4 text-museum-blue" />
          <span class="text-sm text-museum-blue font-medium">{{ fgStore.foreignSessions.length }} 场外语导览</span>
        </div>
      </div>
    </div>

    <div class="flex items-center gap-2 bg-museum-surface rounded-xl p-3 border border-museum-border/30 shadow-sm">
      <Filter class="w-4 h-4 text-museum-muted" />
      <select
        v-model="filterLang" class="bg-museum-bg border border-museum-border/60 rounded-lg px-3 py-1.5 text-sm text-museum-text focus:outline-none focus:ring-1 focus:ring-museum-gold"
      >
        <option v-for="opt in languageForeignOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
      </select>
      <label class="flex items-center gap-1.5 ml-2 cursor-pointer select-none">
        <input type="checkbox" v-model="filterLeaveAffectedOnly" class="rounded border-museum-border/60 text-museum-gold focus:ring-museum-gold" />
        <span class="text-sm text-museum-muted">仅显示受请假影响</span>
      </label>
      <div class="flex-1" />
      <span class="text-xs text-museum-muted">{{ filteredMatches.length }} 个匹配</span>
    </div>

    <div class="space-y-3">
      <div
        v-for="match in filteredMatches"
        :key="match.sessionId"
        class="bg-museum-surface rounded-xl shadow-sm border overflow-hidden transition-all duration-200"
        :class="match.isLeaveAffected ? 'border-museum-orange/40 ring-1 ring-museum-orange/20' : 'border-museum-border/30'"
      >
        <div
          class="p-4 cursor-pointer hover:bg-museum-gold/5"
          @click="toggleExpand(match.sessionId)"
        >
          <div class="flex items-start justify-between gap-4">
          <div class="flex-1 flex items-start gap-4 min-w-0">
            <div class="flex items-center gap-3 flex-shrink-0">
              <component :is="expandedId === match.sessionId ? ChevronUp : ChevronDown" class="w-4 h-4 text-museum-muted" />
              <div
                class="w-10 h-10 rounded-xl flex items-center justify-center"
                :class="match.isLeaveAffected ? 'bg-museum-orange/15' : 'bg-museum-blue/15'"
              >
                <Globe2 class="w-5 h-5" :class="match.isLeaveAffected ? 'text-museum-orange' : 'text-museum-blue'" />
              </div>
            </div>

            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <LanguageTag :language="match.language" />
                <span v-if="match.isLeaveAffected" class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-museum-orange/10 text-museum-orange border border-museum-orange/20">
                  <AlertTriangle class="w-3 h-3" /> 讲解员请假
                </span>
                <span v-if="match.replacementGuideId" class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 class="w-3 h-3" /> 已指派替换
                </span>
              </div>
              <h3 class="mt-1.5 text-base font-serif font-semibold text-museum-text truncate">
                {{ exhibitionMap[getSessionById(match.sessionId)?.exhibitionId || ''] || '—' }}
              </h3>
              <div class="mt-1 flex items-center gap-3 text-xs text-museum-muted">
                <CalendarDays class="w-3 h-3" />
                <span class="tabular-nums">
                  {{ fmtDate(getSessionById(match.sessionId)?.startTime || '') }} ·
                  {{ fmtTime(getSessionById(match.sessionId)?.startTime || '') }}-{{ fmtTime(getSessionById(match.sessionId)?.endTime || '') }}
                </span>
                <span>·</span>
                <span>{{ getSessionById(match.sessionId)?.meetingPoint }}</span>
              </div>
            </div>

            <div class="grid grid-cols-3 gap-6 items-start">
              <div class="text-center">
                <div class="flex items-center justify-center gap-1 text-museum-muted mb-1">
                  <UserCheck class="w-3.5 h-3.5 text-museum-green" />
                  <span class="text-[10px]">可安排</span>
                </div>
                <div class="text-lg font-serif font-bold text-museum-green tabular-nums">
                  {{ match.availableGuides.length }}
                </div>
              </div>
              <div class="text-center">
                <div class="flex items-center justify-center gap-1 text-museum-muted mb-1">
                  <Users class="w-3.5 h-3.5 text-museum-blue" />
                  <span class="text-[10px]">已预约</span>
                </div>
                <div class="text-lg font-serif font-bold text-museum-blue tabular-nums">
                  {{ match.bookedCount }}/{{ match.capacity }}
                </div>
              </div>
              <div class="text-center">
                <div class="flex items-center justify-center gap-1 text-museum-muted mb-1">
                  <Headphones class="w-3.5 h-3.5 text-museum-gold" />
                  <span class="text-[10px]">辅助设备</span>
                </div>
                <div class="text-lg font-serif font-bold text-museum-gold tabular-nums">
                  {{ match.assistiveDevices.length }}
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>

        <Transition name="expand">
          <div v-if="expandedId === match.sessionId" class="border-t border-museum-border/20 bg-museum-bg/30">
            <div class="p-4 grid grid-cols-12 gap-4">
              <div class="col-span-5">
                <div class="flex items-center gap-2 mb-3">
                  <UserCircle class="w-4 h-4 text-museum-green" />
                  <h4 class="text-sm font-serif font-semibold text-museum-text">可安排讲解员</h4>
                </div>
                <div class="space-y-2">
                  <div
                    v-for="gid in match.availableGuides"
                    :key="gid"
                    class="flex items-center justify-between rounded-lg border border-museum-border/30 bg-museum-surface p-2.5"
                    :class="{
                      'ring-2 ring-museum-green/50 border-museum-green/40 bg-museum-green/5': gid === match.replacementGuideId,
                      'opacity-60 line-through': gid === match.originalGuideId && match.isLeaveAffected
                    }"
                  >
                    <div class="flex items-center gap-2.5">
                      <div class="w-8 h-8 rounded-full bg-museum-gold/15 flex items-center justify-center text-museum-gold text-xs font-serif font-bold">
                        {{ guideAvatarMap[gid] }}
                      </div>
                      <div>
                        <div class="text-sm font-medium text-museum-text">{{ guideMap[gid] }}</div>
                        <div class="flex items-center gap-1 mt-0.5">
                          <LanguageTag
                            v-for="lang in guideLanguagesMap[gid]"
                            :key="lang"
                            :language="lang"
                          />
                        </div>
                      </div>
                    </div>
                    <div class="flex items-center gap-1">
                      <span v-if="gid === match.originalGuideId" class="text-[10px] text-museum-muted bg-museum-bg px-2 py-0.5 rounded">原讲解员</span>
                      <span v-if="gid === match.replacementGuideId" class="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded flex items-center gap-1">
                        <CheckCircle2 class="w-3 h-3" /> 替换人选
                      </span>
                    </div>
                  </div>
                </div>

                <div v-if="match.isLeaveAffected && !match.replacementGuideId" class="mt-3">
                  <button
                    class="w-full py-2 rounded-lg text-sm font-medium bg-museum-orange text-white hover:bg-museum-orange/90 flex items-center justify-center gap-1.5"
                    @click.stop="openReplacement(match)"
                  >
                    <ArrowRight class="w-4 h-4" /> 指派替换讲解员
                  </button>
                </div>
                <div v-else-if="match.isLeaveAffected && match.replacementGuideId" class="mt-3">
                  <button
                    class="w-full py-2 rounded-lg text-sm font-medium bg-museum-bg text-museum-text border border-museum-border/40 hover:bg-museum-border/20 flex items-center justify-center gap-1.5"
                    @click.stop="openReplacement(match)"
                  >
                    <ArrowRight class="w-4 h-4" /> 调整替换人选
                  </button>
                </div>
              </div>

              <div class="col-span-3">
                <div class="flex items-center gap-2 mb-3">
                  <Users class="w-4 h-4 text-museum-blue" />
                  <h4 class="text-sm font-serif font-semibold text-museum-text">预约情况</h4>
                </div>
                <div class="rounded-lg border border-museum-border/30 bg-museum-surface p-3">
                  <CapacityBar :current="match.bookedCount" :max="match.capacity" size="md" />
                  <div class="grid grid-cols-2 gap-2 mt-3 text-center">
                    <div class="rounded-md bg-museum-blue/5 py-2">
                      <div class="text-sm font-serif font-bold text-museum-blue tabular-nums">
                        {{ match.bookedCount }}
                      </div>
                      <div class="text-[10px] text-museum-muted">已预约人数</div>
                    </div>
                    <div class="rounded-md bg-museum-green/5 py-2">
                      <div class="text-sm font-serif font-bold text-museum-green tabular-nums">
                        {{ match.capacity - match.bookedCount }}
                      </div>
                      <div class="text-[10px] text-museum-muted">剩余名额</div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="col-span-4">
                <div class="flex items-center gap-2 mb-3">
                  <Headphones class="w-4 h-4 text-museum-gold" />
                  <h4 class="text-sm font-serif font-semibold text-museum-text">辅助设备</h4>
                </div>
                <div class="space-y-1.5">
                  <div
                    v-for="dev in match.assistiveDevices"
                    :key="dev.id"
                    class="flex items-center justify-between rounded-lg border border-museum-border/30 bg-museum-surface p-2.5"
                  >
                    <div class="flex items-center gap-2">
                      <span class="text-lg">{{ deviceTypeIcon(dev.type) }}</span>
                      <div>
                        <div class="text-sm font-medium text-museum-text">{{ dev.name }}</div>
                        <div class="text-[10px] text-museum-muted">{{ assistiveDeviceLabels[dev.type] || dev.type }}</div>
                      </div>
                    </div>
                    <div class="text-right">
                      <span class="text-sm font-serif font-bold tabular-nums"
                        :class="dev.available > 0 ? 'text-museum-green' : 'text-museum-orange'">
                        {{ dev.available }}
                      </span>
                      <span class="text-[10px] text-museum-muted">/{{ dev.total }}</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </Transition>
      </div>

      <div v-if="filteredMatches.length === 0" class="text-center py-12 text-museum-muted bg-museum-surface rounded-xl border border-museum-border/30">
        <Globe2 class="w-10 h-10 mx-auto mb-3 text-museum-border" />
        <p class="text-sm">暂无匹配的外语导览场次</p>
      </div>
    </div>

    <Transition name="fade">
      <div v-if="leaveReplacementModalOpen" class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" @click.self="closeReplacement">
        <div class="bg-museum-surface rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up">
          <div class="flex items-start justify-between p-5 border-b border-museum-border/30">
            <div>
              <h3 class="text-lg font-serif font-bold text-museum-text">指派替换讲解员</h3>
              <p class="text-xs text-museum-muted mt-0.5">选择可安排的同语种讲解员</p>
            </div>
            <button class="w-7 h-7 rounded-lg hover:bg-museum-bg flex items-center justify-center text-museum-muted hover:text-museum-text" @click="closeReplacement">
              <X class="w-4 h-4" />
            </button>
          </div>

          <div class="p-5 space-y-2">
            <div v-for="opt in replacementOptions" :key="opt.id">
              <label
                class="flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer"
                :class="newReplacementId === opt.id
                  ? 'border-museum-gold bg-museum-gold/10 ring-2 ring-museum-gold/30'
                  : 'border-museum-border/30 hover:bg-museum-bg'"
              >
                <input type="radio" v-model="newReplacementId" :value="opt.id" class="hidden" />
                <div class="w-9 h-9 rounded-full bg-museum-gold/15 flex items-center justify-center text-museum-gold text-sm font-serif font-bold">
                  {{ opt.avatar }}
                </div>
                <div class="flex-1">
                  <div class="text-sm font-medium text-museum-text">{{ opt.name }}</div>
                </div>
                <CheckCircle2 v-if="newReplacementId === opt.id" class="w-4 h-4 text-museum-gold" />
              </label>
            </div>
          </div>

          <div class="p-4 bg-museum-bg/50 border-t border-museum-border/30 flex gap-2">
            <button class="flex-1 py-2.5 rounded-lg text-sm font-medium bg-museum-bg border border-museum-border/40 text-museum-text hover:bg-museum-border/20" @click="closeReplacement">
              取消
            </button>
            <button
              class="flex-1 py-2.5 rounded-lg text-sm font-medium bg-museum-gold text-white hover:bg-museum-gold/90 disabled:opacity-40"
              :disabled="!newReplacementId"
              @click="confirmReplacement"
            >
              确认指派
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
}
.expand-enter-to,
.expand-leave-from {
  max-height: 500px;
  opacity: 1;
}
</style>
