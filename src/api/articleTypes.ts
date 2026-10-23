// Контракт раздела News бэкенда (OpenAPI: /docs): общий корпус публикаций из RSS-источников.
// Публикации не привязаны к компании и не ранжированы — это делает сводка.

export type ArticleTopic =
  'economy' | 'politics' | 'business' | 'finance' | 'taxes' | 'regulation' | 'technology' | 'other'

export const topicLabel: Record<ArticleTopic, string> = {
  economy: 'Экономика',
  politics: 'Политика',
  business: 'Бизнес',
  finance: 'Финансы',
  taxes: 'Налоги',
  regulation: 'Регулирование',
  technology: 'Технологии',
  other: 'Другое',
}

export interface Article {
  id: string
  source_code: string
  external_id: string | null
  original_url: string
  canonical_url: string
  title: string
  summary: string | null
  /** Полный текст есть не у всех источников */
  content_text: string | null
  authors: string[]
  published_at: string | null
  source_updated_at: string | null
  first_seen_at: string
  last_seen_at: string
  updated_at: string
  source_categories: string[]
  topics: ArticleTopic[]
  image_url: string | null
  normalizer_version: number
}

export interface ArticlePage {
  items: Article[]
  /** null — дальше публикаций нет */
  next_cursor: string | null
}

export interface ArticlesQuery {
  limit?: number
  cursor?: string | null
  source?: string | null
  topic?: ArticleTopic | null
}

export interface NewsFeed {
  code: string
  url: string
  enabled: boolean
  poll_interval_seconds: number
  next_poll_at: string
  last_checked_at: string | null
  last_success_at: string | null
  last_new_at: string | null
  consecutive_failures: number
  last_error: string | null
  needs_attention: boolean
}

export interface NewsSource {
  code: string
  name: string
  site_url: string
  kind: string
  feeds: NewsFeed[]
}
