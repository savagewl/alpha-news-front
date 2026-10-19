// ВАЖНО: контракт с бэкендом пока предположительный. Сверить с реальным OpenAPI/Swagger
// и поправить типы (идеально — сгенерировать, см. README).

export type Impact = 'risk' | 'opportunity' | 'neutral'
export type Severity = 'low' | 'medium' | 'high'

export interface BusinessProfile {
  id: string
  name: string
  industry: string
  description?: string
  region?: string
  keywords: string[]
}

export type BusinessProfileInput = Omit<BusinessProfile, 'id'>

export interface NewsItem {
  id: string
  title: string
  summary?: string
  url: string
  source: string
  publishedAt: string // ISO 8601
}

/** Результат ИИ-анализа новости применительно к конкретному бизнесу */
export interface NewsInsight {
  id: string
  news: NewsItem
  impact: Impact
  severity: Severity
  /** 0..1 — релевантность новости бизнесу */
  relevance: number
  explanation: string
  recommendations: string[]
}

export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export interface InsightsQuery {
  businessId: string
  impact?: Impact
  severity?: Severity
  page?: number
  pageSize?: number
}
