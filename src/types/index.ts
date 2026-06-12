export type Role = 'front-desk' | 'guide' | 'education'

export type SessionType = 'regular' | 'family' | 'group' | 'foreign'
export type SessionLanguage = 'zh' | 'en' | 'ja' | 'fr' | 'de' | 'sign'
export type SessionStatus = 'upcoming' | 'ongoing' | 'completed'
export type AccessibilityNeed = 'wheelchair' | 'hearing' | 'sign-language' | 'visual'
export type SpecialNeedType = 'allergy' | 'mobility' | 'visual-impairment' | 'hearing-impairment' | 'medical' | 'other'
export type AbsenceStatus = 'attended' | 'late' | 'absent' | 'cancelled'

export type AssistiveDeviceType = 'audio-guide' | 'hearing-loop' | 'sign-interpreter' | 'magnifier' | 'wheelchair'

export interface AssistiveDevice {
  id: string
  type: AssistiveDeviceType
  name: string
  total: number
  available: number
}

export interface SpecialNeed {
  id: string
  type: SpecialNeedType
  description: string
  severity: 'mild' | 'moderate' | 'severe'
  allergyDetail?: string
}

export interface ChildProfile {
  id: string
  name: string
  age: number
  gender?: 'male' | 'female' | 'unknown'
  specialNeeds: SpecialNeed[]
  guardianName: string
  guardianPhone: string
  idCardNumber?: string
  notes?: string
}

export interface BehaviorRecord {
  id: string
  visitorId: string
  idCardNumber: string
  type: 'absence' | 'late' | 'complaint' | 'violation'
  sessionId?: string
  workshopId?: string
  reason: string
  lateMinutes?: number
  recordedAt: string
}

export interface GuideLeave {
  id: string
  guideId: string
  date: string
  reason: string
  replacementGuideId: string | null
  affectedSessionIds: string[]
}

export interface GuideMatchInfo {
  sessionId: string
  language: SessionLanguage
  availableGuides: string[]
  bookedCount: number
  capacity: number
  assistiveDevices: AssistiveDevice[]
  isLeaveAffected: boolean
  leaveRecordId: string | null
  originalGuideId: string
  replacementGuideId: string | null
}

export type BookingSource = 'individual' | 'group'

export interface GalleryTimeSlot {
  id: string
  galleryId: string
  exhibitionId: string | null
  date: string
  startTime: string
  endTime: string
  capacity: number
  individualBooked: number
  groupBooked: number
  groupReservations: GroupReservation[]
}

export interface GroupReservation {
  id: string
  groupName: string
  headcount: number
  contactName: string
  contactPhone: string
  confirmed: boolean
}

export type SlotStatus = 'available' | 'warning' | 'full'
export type OverCapacityAction = 'suggest-next' | 'self-guided'

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
  idCardNumber: string
  headcount: number
  languagePref: SessionLanguage
  isChildGroup: boolean
  childAgeRange: string
  childProfiles: ChildProfile[]
  accessibilityNeeds: AccessibilityNeed[]
  isLate: boolean
  lateMinutes: number
  isBlacklisted: boolean
  complaintCount: number
  blacklistReason?: string
  createdAt: string
}

export interface BookingWeightResult {
  visitorId: string
  idCardNumber: string
  weight: number
  maxWeight: number
  belowThreshold: boolean
  needDoubleDeposit: boolean
  queuePriority: 1 | 2
  absenceCount30d: number
  lateCount30d: number
  complaintCount30d: number
  isBlacklisted: boolean
  breakdown: {
    baseScore: number
    absenceDeduction: number
    lateDeduction: number
    complaintDeduction: number
    blacklistDeduction: number
  }
}

export interface BookingLockInfo {
  idCardNumber: string
  lockedUntil: string
  lockedVenueIds: string[]
  reason: string
  sourceBookingId: string
  sourceType: 'session' | 'workshop'
}

export interface IdCardDuplicateCheck {
  isDuplicate: boolean
  duplicateBookings: Array<{
    id: string
    type: 'session' | 'workshop'
    startTime: string
    venueId: string
    title: string
  }>
  earliestBooking?: {
    id: string
    type: 'session' | 'workshop'
    startTime: string
  }
  willCancelCurrent: boolean
}

export interface GuideAttentionItem {
  id: string
  sessionId: string
  guideId: string
  visitorId: string
  visitorName: string
  type: 'allergy' | 'mobility' | 'wheelchair' | 'hearing' | 'medical' | 'other'
  description: string
  severity: 'mild' | 'moderate' | 'severe'
  childName?: string
  createdAt: string
  acknowledged: boolean
}

export interface CapacityReservation {
  id: string
  sessionId: string
  workshopId?: string
  reason: 'wheelchair' | 'stretcher' | 'medical-equipment' | 'child-group-special'
  reservedSpots: number
  channelWidthReserved: boolean
  visitorId: string
  description: string
}

export interface WorkshopBooking {
  id: string
  workshopId: string
  visitorId: string
  idCardNumber: string
  childName: string
  childAge: number
  childSpecialNeeds: SpecialNeed[]
  hasAllMaterials: boolean
  missingMaterials: string[]
  confirmed: boolean
  depositAmount: number
  depositMultiplier: number
  queuePosition: number
  queuePriority: 1 | 2
  weightScore: number
  attendanceStatus: AbsenceStatus
  createdAt: string
  cancelledAt?: string
}

export interface SessionBooking {
  id: string
  sessionId: string
  visitorId: string
  idCardNumber: string
  headcount: number
  confirmed: boolean
  depositAmount: number
  depositMultiplier: number
  queuePosition: number
  weightScore: number
  attendanceStatus: AbsenceStatus
  createdAt: string
  cancelledAt?: string
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

export type RelocationType = 'next-session' | 'tail-join' | 'audio-guide'

export interface RelocationRecord {
  id: string
  visitorId: string
  originalSessionId: string
  newSessionId: string | null
  type: RelocationType
  reason: string
  lateMinutes: number
  createdAt: string
}

export interface WorkshopMaterial {
  id: string
  name: string
  total: number
  used: number
}

export interface Workshop {
  id: string
  title: string
  description: string
  sessionId: string | null
  startTime: string
  endTime: string
  classroom: string
  capacity: number
  booked: number
  minAge: number
  maxAge: number
  materialIds: string[]
  coverImage?: string
}

export interface WorkshopMaterialCheckResult {
  hasAllMaterials: boolean
  missingMaterials: string[]
}

export interface WorkshopCapacityResult {
  canBook: boolean
  availableSpots: number
}

export interface WorkshopAgeResult {
  ageOk: boolean
  minAge: number
  maxAge: number
}
