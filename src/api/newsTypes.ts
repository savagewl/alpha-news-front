// Контракт экранов новостной аналитики. Сейчас его отдают моки (src/mocks/api.ts);
// при подключении бэкенда сверить с OpenAPI и поправить здесь, а не в компонентах.

/** Происхождение утверждения — ТЗ требует отделять факт, позицию банка и вывод модели */
export type Origin = 'fact' | 'bank' | 'ai'

export type EventKind = 'risk' | 'opportunity'
export type RelevanceLevel = 'Высокая' | 'Средняя' | 'Низкая'

export type Topic =
  | 'Ставка'
  | 'Инфляция'
  | 'Сырьё'
  | 'Регулирование'
  | 'Контрагенты'
  | 'Рынок труда'
  | 'Финрынок'
  | 'Логистика'
  | 'Спрос'
  | 'Стратегия'

export interface Company {
  id: string
  name: string
  shortName: string
  okved: string
  okvedName: string
  /** Короткое название отрасли для карточек */
  industry: string
  revenue: string
  group: string
  city: string
  region: string
  products: string[]
  fts: { flag: boolean | null; countries: string[] }
  orgType: string
  okfs: string | null
  scale: string
  age: string | null
  workers: string | null
  ecoMark: string | null
  marketShare: string | null
  activities: string | null
  marketPosition: string
  /** Признаки, которые сильнее всего влияют на отбор событий */
  selection: string[]
  completeness: { status: string; text: string }
  links: CounterpartyLink[]
}

export interface CounterpartyLink {
  who: string
  direction: string
  amount: string
  count: number
}

export interface Source {
  code: string
  title: string
  kind: 'news' | 'case' | 'bank' | 'profile'
  date?: string
  /** Ссылка на первоисточник; у синтетических источников её нет */
  url?: string
  available: boolean
  note: string
}

export interface NewsEvent {
  id: string
  companyId: string
  kind: EventKind
  topic: Topic
  title: string
  text: string
  relevance: RelevanceLevel
  relevanceReason: string
  sourceCode: string
  sourceTitle: string
  date: string
  /** Код материала аналитики банка, если он есть по событию */
  bankRef?: string
}

export interface Digest {
  companyId: string
  role: string
  date: string
  title: string
  hero: { lines: string[]; text: string; basis: string }
  events: NewsEvent[]
  unconfirmed: { text: string }
}

export interface InterpretationBlock {
  question: string
  origin: Origin
  label: string
  text: string
  strong?: string
  basis: string
}

export interface Interpretation {
  event: NewsEvent
  title: string
  main: string
  /** false — подробного разбора по событию ещё нет, показываем только факт и связь с компанией */
  detailed: boolean
  blocks: InterpretationBlock[]
  context: string
  limits: string
  sources: Source[]
}

export type TraceStatus = 'done' | 'retry' | 'warn'

export interface TraceStep {
  id: string
  title: string
  short: string
  at: string
  ms: number
  call: string
  result: string
  note: string
  status: TraceStatus
}

export interface Trace {
  eventId: string
  headline: string
  summary: string
  totalSec: string
  steps: TraceStep[]
  context: { company: string; event: string; access: string }
}

export interface Answer {
  id: string
  question: string
  headline: string
  lead: string
  section?: { title: string; items: string[] }
  need: string
  limits: string
  refs: { origin: Origin; label: string }[]
}

export interface AnalyticsMaterial {
  code: string
  title: string
  available: boolean
  /** Короткая выдержка позиции банка, если материал загружен */
  summary?: string
}
