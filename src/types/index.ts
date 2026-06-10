export type Role = 'front-desk' | 'guide' | 'education'

export type SessionType = 'regular' | 'family' | 'group' | 'foreign'
export type SessionLanguage = 'zh' | 'en' | 'ja' | 'fr' | 'de'
export type SessionStatus = 'upcoming' | 'ongoing' | 'completed'
export type AccessibilityNeed = 'wheelchair' | 'hearing' | 'sign-language' | 'visual'

export interface Exhibition {
  id: string
  title: string
  startDate: string
  endDate: string
  galleryId: string
}

export interface Session {
  id: string
  exhibitionId: string
  galleryId: string
  guideId: string
  startTime: string
  endTime: string
  language: SessionLanguage
  type: SessionType
  meetingPoint: string
  capacity: number
  booked: number
  keyWorks: string[]
}

export interface Visitor {
  id: string
  sessionId: string
  name: string
  phone: string
  headcount: number
  languagePref: SessionLanguage
  isChildGroup: boolean
  childAgeRange: string
  accessibilityNeeds: AccessibilityNeed[]
  isLate: boolean
  lateMinutes: number
  createdAt: string
}

export interface Gallery {
  id: string
  name: string
  capacity: number
  currentCount: number
}

export interface Guide {
  id: string
  name: string
  languages: SessionLanguage[]
  avatar: string
}

export interface LateRecord {
  id: string
  visitorId: string
  sessionId: string
  lateMinutes: number
  recordedAt: string
}

export interface Feedback {
  id: string
  sessionId: string
  guideId: string
  rating: number
  comment: string
  issues: string
  createdAt: string
}

export interface CalendarDay {
  date: string
  hasSessions: boolean
  sessionCount: number
}
