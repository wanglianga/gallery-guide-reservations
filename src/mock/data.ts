import type { Exhibition, Session, Visitor, Gallery, Guide, Feedback } from '@/types'

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
  { id: 'gd2', name: '李雪', languages: ['zh', 'ja'], avatar: 'L' },
  { id: 'gd3', name: '张远', languages: ['zh', 'fr'], avatar: 'Z' },
  { id: 'gd4', name: '王芳', languages: ['zh', 'en', 'de'], avatar: 'W' },
  { id: 'gd5', name: '陈静', languages: ['zh'], avatar: 'C' },
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
