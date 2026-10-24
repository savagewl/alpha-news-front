// Контракт разделов Company news, Company news chat и Analytics бэкенда (OpenAPI: /docs):
// персональная лента компании, AI-интерпретация новости, личный чат по ней и каталог PDF банка.
import type { ArticleTopic } from './articleTypes'

export interface CompanyNewsItem {
  id: string
  source_code: string
  title: string
  summary: string
  /** Откуда анонс: AI-пересказ, RSS-анонс или только заголовок */
  summary_origin: 'ai' | 'rss' | 'title'
  processing_status?: 'ready' | 'processing' | 'pending' | 'unavailable'
  canonical_url: string
  published_at: string | null
  first_seen_at: string
  topics: ArticleTopic[]
  /** 0…1 — чем выше, тем важнее для компании */
  relevance_score: number
  relevance_reasons: string[]
  /** not_assessed — влияние на компанию ещё не оценено, риски и возможности пустые */
  assessment_status?: 'ready' | 'not_assessed'
  brief_impact?: string | null
  risks?: string[] | null
  opportunities?: string[] | null
}

export interface CompanyNewsPage {
  company_id: string
  items: CompanyNewsItem[]
  total: number
  limit: number
  offset: number
  ranking_method?: 'rules' | 'hybrid'
  personalization_status?: 'ready' | 'preparing' | 'unavailable'
  ranking_note?: string | null
}

export interface CompanyNewsQuery {
  limit?: number
  offset?: number
  source?: string | null
  topic?: ArticleTopic | null
  published_from?: string | null
  published_to?: string | null
  /** false — вместе с новостями без совпадений с профилем */
  relevant_only?: boolean
}

/** Происхождение утверждения в ответе AI */
export type ClaimKind = 'fact' | 'bank_position' | 'ai_inference'

export interface InsightClaim {
  id?: string
  text?: string
  kind: ClaimKind
  /** «news:<url>», «company:<поле профиля>», «bank:…» */
  evidence_refs?: string[]
}

export interface InsightDraft {
  event_id?: string | null
  company_id?: string | null
  headline: string
  facts?: string[]
  /** null — подтверждённых материалов банка нет, позиция не сформирована */
  bank_position?: string | null
  ai_interpretation: string
  risks?: string[]
  opportunities?: string[]
  suggested_actions?: string[]
  limitations?: string[]
  claims?: InsightClaim[]
}

export interface InsightStep {
  /** analyst, verifier, revise… */
  step: string
  /** ok, APPROVED, REVISE, INSUFFICIENT… */
  status: string
  tokens_prompt?: number
  tokens_completion?: number
  detail?: string
}

export interface InterpretationSource {
  evidence_ref: string
  title: string
  source_url: string
  published_at?: string | null
  page_number?: number | null
}

export interface Verification {
  status: 'APPROVED' | 'REVISE' | 'INSUFFICIENT'
  remarks?: string[]
  missing_evidence?: string[]
  retry_queries?: string[]
}

export type InterpretationStatus = 'generating' | 'ready' | 'needs_revision' | 'insufficient'

export interface InterpretationResult {
  id: string
  company_id: string
  news_id: string
  status: InterpretationStatus
  /** null, пока черновик не прошёл проверку */
  interpretation?: InsightDraft | null
  verification?: Verification | null
  steps?: InsightStep[]
  sources?: InterpretationSource[]
  warnings?: string[]
  model: string
  is_demo?: boolean
  /** true — ответ взят из кеша без нового запуска LLM */
  reused?: boolean
  generated_at?: string | null
}

export interface ChatThread {
  id: string
  company_id: string
  news_id: string
  created_at: string
  updated_at: string
}

export interface ChatSource {
  evidence_ref: string
  kind: 'news' | 'bank' | 'company'
  title: string
  source_url?: string | null
  published_at?: string | null
  page_number?: number | null
}

export interface ChatMessage {
  id: string
  thread_id: string
  client_message_id?: string | null
  /** У ответа ассистента — id вопроса пользователя */
  reply_to_id?: string | null
  role: 'user' | 'assistant'
  status?: 'generating' | 'ready' | 'failed'
  content: string
  answer_kind?: ClaimKind | null
  sources?: ChatSource[]
  warnings?: string[]
  created_at: string
}

export interface ChatHistory {
  thread: ChatThread
  messages: ChatMessage[]
  limit: number
  has_more: boolean
  next_before?: string | null
}

export interface ChatMessageResult {
  user_message: ChatMessage
  assistant_message: ChatMessage
  reused?: boolean
}

export type DocumentStatus = 'queued' | 'extracting' | 'indexing' | 'parsed' | 'ready' | 'failed'

/** Аналитический PDF в общем корпусе материалов */
export interface AnalyticsDocument {
  id: string
  filename: string
  title: string
  publisher: string
  published_at: string | null
  topics: string[]
  created_at: string
  status: DocumentStatus
  page_count: number
  chunk_count: number
  warnings: string[]
  error: string | null
  embedding_error: string | null
}

/** Фрагмент PDF с привязкой к странице */
export interface DocumentPassage {
  document_id: string
  chunk_id: string
  page_number: number
  section: string
  text: string
  bbox: number[]
}

export interface AnalyticsSearchHit extends DocumentPassage {
  title: string
  publisher: string
  published_at: string | null
  /** Относительный балл ранжирования, не вероятность */
  score: number
  evidence_ref: string
  source_url: string
}

export interface AnalyticsSearchResult {
  items: AnalyticsSearchHit[]
  /** Без BGE бэк откатывается на текстовый поиск */
  mode_used: 'hybrid' | 'keyword' | 'semantic'
  warnings?: string[]
}
