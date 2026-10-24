import { useState } from 'react'
import type { ArticleTopic } from '../api/articleTypes'
import { useCompanyNews, useCompanyNewsHead } from '../api/companyNewsHooks'
import type { CompanyNewsQuery } from '../api/companyNewsTypes'

export interface Filters {
  topic: ArticleTopic | null
  risks: boolean
  opportunities: boolean
  /** false — показать и новости без совпадений с профилем компании */
  relevantOnly: boolean
}

const noFilters: Filters = { topic: null, risks: false, opportunities: false, relevantOnly: true }

/** Лента сводки: ранжированные бэком новости компании, фильтры и счётчик новых публикаций */
export function useDigestFeed(companyId: string) {
  const [filters, setFilters] = useState<Filters>(noFilters)
  // тема и релевантность фильтруются на бэке, риски и возможности — по загруженной ленте
  const query: CompanyNewsQuery = { topic: filters.topic, relevant_only: filters.relevantOnly }
  const feed = useCompanyNews(companyId, query)
  const head = useCompanyNewsHead(companyId, query, true)

  const set = (patch: Partial<Filters>) => setFilters((f) => ({ ...f, ...patch }))
  const reset = () => setFilters(noFilters)
  const filtered = !!(filters.topic || filters.risks || filters.opportunities)

  const pages = feed.data?.pages ?? []
  const first = pages[0]
  const all = pages.flatMap((p) => p.items)
  const visible = all.filter(
    (n) =>
      // «Риски» и «Возможности» вместе — то же, что без фильтра по типу
      filters.risks === filters.opportunities ||
      (filters.risks ? !!n.risks?.length : !!n.opportunities?.length),
  )

  // Новые — те, что поднялись в верх ленты после загрузки и ещё не показаны
  const shown = new Set(all.map((n) => n.id))
  const fresh = feed.isFetching ? 0 : (head.data?.items.filter((n) => !shown.has(n.id)).length ?? 0)

  return {
    feed,
    first,
    all,
    visible,
    fresh,
    filters,
    set,
    reset,
    filtered,
    refresh: () => feed.refetch(),
  }
}
