import type {
  Exhibition, Session, Visitor, Gallery, Guide, Feedback,
  GuideLeave, AssistiveDevice, GalleryTimeSlot, GroupReservation
} from '@/types'

const today = new Date()
const fmt = (d: Date) => d.toISOString().slice(0, 10)
const addDays = (d: Date, n: number) => { const r = new Date(d); r.setDate(r.getDate() + n); return r }

export const galleries: Gallery[] = [
  { id: 'g1', name: '一层·当代厅', capacity: 60, currentCount: 42 },
  { id: 'g2', name: '二层·国画厅', capacity: 45, currentCount: 38 },
  { id: 'g3', name: '三层·油画厅', capacity: 50, currentCount: 50 },
  { id: 'g4', name: '地下一层·雕塑厅', capacity: 35, currentCount: 12 },
]

export const guides: Guide[] = [
  { id: 'gd1', name: '周明', languages: ['zh', 'en'], avatar: 'Z' },
  { id: 'gd2', name: '李雪', languages: ['zh', 'ja', 'sign'], avatar: 'L' },
  { id: 'gd3', name: '张远', languages: ['zh', 'fr'], avatar: 'Z' },
  { id: 'gd4', name: '王芳', languages: ['zh', 'en', 'de'], avatar: 'W' },
  { id: 'gd5', name: '陈静', languages: ['zh', 'sign'], avatar: 'C' },
  { id: 'gd6', name: '林浩', languages: ['zh', 'en', 'ja'], avatar: 'L' },
  { id: 'gd7', name: '赵敏', languages: ['zh', 'sign', 'en'], avatar: 'Z' },
]

export const exhibitions: Exhibition[] = [
  { id: 'e1', title: '山河之间——当代水墨大展', startDate: fmt(addDays(today, -5)), endDate: fmt(addDays(today, 25)), galleryId: 'g2' },
  { id: 'e2', title: '光影实验·新媒体艺术展', startDate: fmt(addDays(today, -2)), endDate: fmt(addDays(today, 30)), galleryId: 'g1' },
  { id: 'e3', title: '古典与先锋——欧洲油画百年', startDate: fmt(addDays(today, 0)), endDate: fmt(addDays(today, 40)), galleryId: 'g3' },
  { id: 'e4', title: '形与空·雕塑空间对话', startDate: fmt(addDays(today, -10)), endDate: fmt(addDays(today, 10)), galleryId: 'g4' },
]

export const sessions: Session[] = [
  { id: 's1', exhibitionId: 'e1', galleryId: 'g2', guideId: 'gd1', startTime: `${fmt(today)}T09:30:00`, endTime: `${fmt(today)}T10:30:00`, language: 'zh', type: 'regular', meetingPoint: '二层入口', capacity: 25, booked: 18, keyWorks: ['溪山行旅图', '烟雨江南', '墨韵山居'] },
  { id: 's2', exhibitionId: 'e2', galleryId: 'g1', guideId: 'gd4', startTime: `${fmt(today)}T10:00:00`, endTime: `${fmt(today)}T11:00:00`, language: 'en', type: 'foreign', meetingPoint: '一层服务台', capacity: 20, booked: 16, keyWorks: ['数字花园', '脉冲之光', '虚拟边界'] },
  { id: 's3', exhibitionId: 'e3', galleryId: 'g3', guideId: 'gd2', startTime: `${fmt(today)}T10:30:00`, endTime: `${fmt(today)}T11:30:00`, language: 'zh', type: 'family', meetingPoint: '三层亲子区', capacity: 30, booked: 24, keyWorks: ['日出印象', '星夜', '睡莲'] },
  { id: 's4', exhibitionId: 'e4', galleryId: 'g4', guideId: 'gd3', startTime: `${fmt(today)}T13:00:00`, endTime: `${fmt(today)}T14:00:00`, language: 'fr', type: 'foreign', meetingPoint: '地下一层大厅', capacity: 20, booked: 8, keyWorks: ['空间对话#3', '虚空之形', '重力诗篇'] },
  { id: 's5', exhibitionId: 'e1', galleryId: 'g2', guideId: 'gd5', startTime: `${fmt(today)}T14:00:00`, endTime: `${fmt(today)}T15:00:00`, language: 'zh', type: 'group', meetingPoint: '二层入口', capacity: 30, booked: 28, keyWorks: ['溪山行旅图', '烟雨江南', '墨韵山居'] },
  { id: 's6', exhibitionId: 'e2', galleryId: 'g1', guideId: 'gd1', startTime: `${fmt(today)}T14:30:00`, endTime: `${fmt(today)}T15:30:00`, language: 'zh', type: 'regular', meetingPoint: '一层入口', capacity: 25, booked: 10, keyWorks: ['数字花园', '脉冲之光', '虚拟边界'] },
  { id: 's7', exhibitionId: 'e3', galleryId: 'g3', guideId: 'gd2', startTime: `${fmt(today)}T15:00:00`, endTime: `${fmt(today)}T16:00:00`, language: 'ja', type: 'foreign', meetingPoint: '三层入口', capacity: 15, booked: 12, keyWorks: ['日出印象', '星夜', '睡莲'] },
  { id: 's8', exhibitionId: 'e4', galleryId: 'g4', guideId: 'gd4', startTime: `${fmt(today)}T16:00:00`, endTime: `${fmt(today)}T17:00:00`, language: 'zh', type: 'family', meetingPoint: '地下一层亲子区', capacity: 25, booked: 20, keyWorks: ['空间对话#3', '虚空之形', '重力诗篇'] },
  { id: 's9', exhibitionId: 'e1', galleryId: 'g2', guideId: 'gd3', startTime: `${fmt(addDays(today, 1))}T09:30:00`, endTime: `${fmt(addDays(today, 1))}T10:30:00`, language: 'fr', type: 'foreign', meetingPoint: '二层入口', capacity: 20, booked: 5, keyWorks: ['溪山行旅图', '烟雨江南', '墨韵山居'] },
  { id: 's10', exhibitionId: 'e2', galleryId: 'g1', guideId: 'gd5', startTime: `${fmt(addDays(today, 1))}T10:00:00`, endTime: `${fmt(addDays(today, 1))}T11:00:00`, language: 'zh', type: 'regular', meetingPoint: '一层服务台', capacity: 25, booked: 3, keyWorks: ['数字花园', '脉冲之光', '虚拟边界'] },
  { id: 's11', exhibitionId: 'e2', galleryId: 'g1', guideId: 'gd6', startTime: `${fmt(today)}T11:00:00`, endTime: `${fmt(today)}T12:00:00`, language: 'en', type: 'foreign', meetingPoint: '一层服务台', capacity: 20, booked: 14, keyWorks: ['数字花园', '脉冲之光', '虚拟边界'] },
  { id: 's12', exhibitionId: 'e1', galleryId: 'g2', guideId: 'gd7', startTime: `${fmt(today)}T13:30:00`, endTime: `${fmt(today)}T14:30:00`, language: 'sign', type: 'foreign', meetingPoint: '二层手语服务台', capacity: 15, booked: 9, keyWorks: ['溪山行旅图', '烟雨江南', '墨韵山居'] },
  { id: 's13', exhibitionId: 'e3', galleryId: 'g3', guideId: 'gd6', startTime: `${fmt(addDays(today, 1))}T14:00:00`, endTime: `${fmt(addDays(today, 1))}T15:00:00`, language: 'ja', type: 'foreign', meetingPoint: '三层入口', capacity: 15, booked: 7, keyWorks: ['日出印象', '星夜', '睡莲'] },
  { id: 's14', exhibitionId: 'e2', galleryId: 'g1', guideId: 'gd7', startTime: `${fmt(addDays(today, 1))}T15:30:00`, endTime: `${fmt(addDays(today, 1))}T16:30:00`, language: 'sign', type: 'foreign', meetingPoint: '一层手语服务台', capacity: 15, booked: 4, keyWorks: ['数字花园', '脉冲之光', '虚拟边界'] },
]

export const visitors: Visitor[] = [
  { id: 'v1', sessionId: 's1', name: '赵军', phone: '138****1234', headcount: 2, languagePref: 'zh', isChildGroup: false, childAgeRange: '', accessibilityNeeds: [], isLate: false, lateMinutes: 0, createdAt: `${fmt(today)}T08:00:00` },
  { id: 'v2', sessionId: 's1', name: '孙丽', phone: '139****5678', headcount: 3, languagePref: 'zh', isChildGroup: true, childAgeRange: '6-10岁', accessibilityNeeds: [], isLate: false, lateMinutes: 0, createdAt: `${fmt(today)}T08:15:00` },
  { id: 'v3', sessionId: 's2', name: 'Emily Chen', phone: '136****9012', headcount: 1, languagePref: 'en', isChildGroup: false, childAgeRange: '', accessibilityNeeds: [], isLate: false, lateMinutes: 0, createdAt: `${fmt(today)}T08:30:00` },
  { id: 'v4', sessionId: 's2', name: 'Tom Wilson', phone: '137****3456', headcount: 2, languagePref: 'en', isChildGroup: false, childAgeRange: '', accessibilityNeeds: ['wheelchair'], isLate: false, lateMinutes: 0, createdAt: `${fmt(today)}T08:45:00` },
  { id: 'v5', sessionId: 's3', name: '刘梅', phone: '135****7890', headcount: 4, languagePref: 'zh', isChildGroup: true, childAgeRange: '4-8岁', accessibilityNeeds: [], isLate: true, lateMinutes: 12, createdAt: `${fmt(today)}T09:00:00` },
  { id: 'v6', sessionId: 's3', name: '王磊', phone: '133****2345', headcount: 3, languagePref: 'zh', isChildGroup: true, childAgeRange: '5-9岁', accessibilityNeeds: ['hearing'], isLate: false, lateMinutes: 0, createdAt: `${fmt(today)}T09:10:00` },
  { id: 'v7', sessionId: 's4', name: 'Pierre Dupont', phone: '131****6789', headcount: 2, languagePref: 'fr', isChildGroup: false, childAgeRange: '', accessibilityNeeds: [], isLate: false, lateMinutes: 0, createdAt: `${fmt(today)}T09:20:00` },
  { id: 'v8', sessionId: 's5', name: '陈华', phone: '130****0123', headcount: 8, languagePref: 'zh', isChildGroup: false, childAgeRange: '', accessibilityNeeds: [], isLate: false, lateMinutes: 0, createdAt: `${fmt(today)}T10:00:00` },
  { id: 'v9', sessionId: 's5', name: '黄芳', phone: '158****4567', headcount: 12, languagePref: 'zh', isChildGroup: false, childAgeRange: '', accessibilityNeeds: ['wheelchair'], isLate: true, lateMinutes: 8, createdAt: `${fmt(today)}T10:30:00` },
  { id: 'v10', sessionId: 's5', name: '吴刚', phone: '159****8901', headcount: 6, languagePref: 'zh', isChildGroup: false, childAgeRange: '', accessibilityNeeds: [], isLate: false, lateMinutes: 0, createdAt: `${fmt(today)}T11:00:00` },
  { id: 'v11', sessionId: 's6', name: '林小明', phone: '186****2345', headcount: 2, languagePref: 'zh', isChildGroup: false, childAgeRange: '', accessibilityNeeds: [], isLate: false, lateMinutes: 0, createdAt: `${fmt(today)}T11:30:00` },
  { id: 'v12', sessionId: 's7', name: '田中太郎', phone: '187****6789', headcount: 3, languagePref: 'ja', isChildGroup: false, childAgeRange: '', accessibilityNeeds: [], isLate: false, lateMinutes: 0, createdAt: `${fmt(today)}T12:00:00` },
  { id: 'v13', sessionId: 's8', name: '何静', phone: '188****0123', headcount: 5, languagePref: 'zh', isChildGroup: true, childAgeRange: '3-7岁', accessibilityNeeds: ['sign-language'], isLate: false, lateMinutes: 0, createdAt: `${fmt(today)}T12:30:00` },
]

export const feedbacks: Feedback[] = [
  { id: 'f1', sessionId: 's1', guideId: 'gd1', rating: 5, comment: '观众对水墨作品反响很好，尤其是溪山行旅图', issues: '有一位观众中途离场', createdAt: `${fmt(addDays(today, -1))}T11:00:00` },
  { id: 'f2', sessionId: 's2', guideId: 'gd4', rating: 4, comment: '外宾对新媒体作品很感兴趣，互动环节气氛热烈', issues: '翻译时间不够充裕', createdAt: `${fmt(addDays(today, -1))}T12:00:00` },
  { id: 'f3', sessionId: 's3', guideId: 'gd2', rating: 5, comment: '亲子场互动效果好，孩子们很喜欢星夜', issues: '场地稍小，建议增加亲子场次', createdAt: `${fmt(addDays(today, -1))}T12:30:00` },
  { id: 'f4', sessionId: 's5', guideId: 'gd5', rating: 3, comment: '团体人数较多，管理困难', issues: '团体预约需提前确认人数，避免超员', createdAt: `${fmt(addDays(today, -1))}T15:30:00` },
  { id: 'f5', sessionId: 's4', guideId: 'gd3', rating: 4, comment: '法语讲解进展顺利，观众互动积极', issues: '雕塑厅光线较暗', createdAt: `${fmt(addDays(today, -1))}T14:30:00` },
]

export const languageLabels: Record<string, string> = {
  zh: '中文',
  en: 'English',
  ja: '日本語',
  fr: 'Français',
  de: 'Deutsch',
  sign: '手语',
}

export const typeLabels: Record<string, string> = {
  regular: '常规',
  family: '亲子',
  group: '团体',
  foreign: '外语',
}

export const accessibilityLabels: Record<string, string> = {
  wheelchair: '轮椅通道',
  hearing: '助听设备',
  'sign-language': '手语翻译',
  visual: '视觉辅助',
}

export const assistiveDeviceLabels: Record<string, string> = {
  'audio-guide': '语音导览器',
  'hearing-loop': '感应线圈',
  'sign-interpreter': '手语翻译器',
  magnifier: '放大设备',
  wheelchair: '轮椅',
}

export const guideLeaves: GuideLeave[] = [
  {
    id: 'gl1',
    guideId: 'gd4',
    date: fmt(today),
    reason: '身体不适请假',
    replacementGuideId: 'gd6',
    affectedSessionIds: ['s2'],
  },
  {
    id: 'gl2',
    guideId: 'gd2',
    date: fmt(addDays(today, 1)),
    reason: '外出培训',
    replacementGuideId: null,
    affectedSessionIds: ['s13'],
  },
]

export const assistiveDevices: AssistiveDevice[] = [
  { id: 'ad1', type: 'audio-guide', name: '英文语音导览器', total: 30, available: 18 },
  { id: 'ad2', type: 'audio-guide', name: '日文语音导览器', total: 15, available: 9 },
  { id: 'ad3', type: 'audio-guide', name: '法文语音导览器', total: 10, available: 7 },
  { id: 'ad4', type: 'hearing-loop', name: '感应线圈系统', total: 5, available: 4 },
  { id: 'ad5', type: 'sign-interpreter', name: '实时手语翻译平板', total: 8, available: 5 },
  { id: 'ad6', type: 'magnifier', name: '便携式放大镜', total: 20, available: 16 },
  { id: 'ad7', type: 'wheelchair', name: '无障碍轮椅', total: 6, available: 3 },
]

const timeRanges = [
  { start: '09:00', end: '10:00' },
  { start: '10:00', end: '11:00' },
  { start: '11:00', end: '12:00' },
  { start: '13:00', end: '14:00' },
  { start: '14:00', end: '15:00' },
  { start: '15:00', end: '16:00' },
  { start: '16:00', end: '17:00' },
]

function makeGroupReservations(seed: number): GroupReservation[] {
  const result: GroupReservation[] = []
  const names = ['阳光小学', '东方旅行社', '市老年大学', '青少年活动中心', '海外游学团', '文化交流团']
  const count = seed % 3
  for (let i = 0; i < count; i++) {
    result.push({
      id: `gr${seed}${i}`,
      groupName: names[(seed + i) % names.length],
      headcount: 8 + ((seed * 3 + i * 5) % 18),
      contactName: ['王老师', '李导', '张主任', '赵经理'][(seed + i) % 4],
      contactPhone: `138****${(1000 + seed * 7 + i * 13) % 9000 + 1000}`,
      confirmed: i === 0 || seed % 2 === 0,
    })
  }
  return result
}

export const galleryTimeSlots: GalleryTimeSlot[] = (() => {
  const slots: GalleryTimeSlot[] = []
  let idx = 1
  const hotExhibitionGalleries = ['g1', 'g2', 'g3']
  const exhibitionMap: Record<string, string> = { g1: 'e2', g2: 'e1', g3: 'e3' }
  const capacityMap: Record<string, number> = { g1: 60, g2: 45, g3: 50, g4: 35 }

  for (let d = 0; d < 3; d++) {
    const date = fmt(addDays(today, d))
    for (const gid of hotExhibitionGalleries) {
      for (let ti = 0; ti < timeRanges.length; ti++) {
        const tr = timeRanges[ti]
        const seed = idx * 7 + d * 11 + ti * 3
        const groupRes = makeGroupReservations(seed)
        const groupBooked = groupRes.reduce((s, g) => s + g.headcount, 0)
        const baseInd = Math.max(0, (capacityMap[gid] - groupBooked) * (0.3 + ((seed % 10) / 15)))
        const individualBooked = Math.round(baseInd)

        slots.push({
          id: `ts${idx++}`,
          galleryId: gid,
          exhibitionId: exhibitionMap[gid] || null,
          date,
          startTime: tr.start,
          endTime: tr.end,
          capacity: capacityMap[gid],
          individualBooked,
          groupBooked,
          groupReservations: groupRes,
        })
      }
    }
  }

  const todayStr = fmt(today)
  const g1Slots = slots.filter(s => s.date === todayStr && s.galleryId === 'g1')
  if (g1Slots.length >= 3) {
    g1Slots[1].individualBooked = 32
    g1Slots[1].groupBooked = 30
    g1Slots[1].groupReservations = [
      { id: 'gr-force-1', groupName: '海外华人艺术交流团', headcount: 22, contactName: '陈导', contactPhone: '139****8899', confirmed: true },
      { id: 'gr-force-2', groupName: '市文化局考察组', headcount: 8, contactName: '王主任', contactPhone: '138****1122', confirmed: true },
    ]
    g1Slots[2].individualBooked = 40
    g1Slots[2].groupBooked = 25
    g1Slots[2].groupReservations = [
      { id: 'gr-force-3', groupName: '国际博物馆协会参访团', headcount: 25, contactName: 'Lisa', contactPhone: '137****6677', confirmed: true },
    ]
  }
  const g3Slots = slots.filter(s => s.date === todayStr && s.galleryId === 'g3')
  if (g3Slots.length >= 5) {
    g3Slots[3].individualBooked = 28
    g3Slots[3].groupBooked = 22
  }

  return slots
})()

export const languageForeignOptions: Array<{ value: string; label: string }> = [
  { value: '', label: '全部外语导览' },
  { value: 'en', label: 'English 英文' },
  { value: 'ja', label: '日本語 日文' },
  { value: 'sign', label: '手语导览' },
  { value: 'fr', label: 'Français 法文' },
  { value: 'de', label: 'Deutsch 德文' },
]
