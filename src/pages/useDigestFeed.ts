import { useMemo, useState } from 'react'
import type { ArticleTopic } from '../api/articleTypes'
import { applyAssessment, bankPosition, useAssessments } from '../api/assessments'
import { useCompanyNews, useCompanyNewsHead } from '../api/companyNewsHooks'
import type { CompanyNewsQuery } from '../api/companyNewsTypes'

export interface Filters {
  topic: ArticleTopic | null
  risks: boolean
  opportunities: boolean
  /** false — показать и новости без совпадений с профилем компании */
  relevantOnly: boolean
  /** Только новости с подтверждённой позицией банка */
  bankOnly: boolean
}

const noFilters: Filters = {
  topic: null,
  risks: false,
  opportunities: false,
  relevantOnly: true,
  bankOnly: false,
}

/** Лента сводки: ранжированные бэком новости, AI-оценки из потока, фильтры и счётчик новых публикаций */
export function useDigestFeed(companyId: string) {
  const [filters, setFilters] = useState<Filters>(noFilters)
  // тема и релевантность фильтруются на бэке, риски, возможности и банк — по загруженной ленте
  const query: CompanyNewsQuery = { topic: filters.topic, relevant_only: filters.relevantOnly }
  const feed = useCompanyNews(companyId, query)
  const head = useCompanyNewsHead(companyId, query, true)

  const set = (patch: Partial<Filters>) => setFilters((f) => ({ ...f, ...patch }))
  const reset = () => setFilters(noFilters)
  const filtered = !!(filters.topic || filters.risks || filters.opportunities || filters.bankOnly)

  const pages = feed.data?.pages
  const first = pages?.[0]
  const loaded = useMemo(() => pages?.flatMap((p) => p.items) ?? [], [pages])
  // оценки из потока накладываются на карточки ленты, как только приходят
  const { assessments, observe, retry } = useAssessments(companyId, loaded)
  const all = useMemo(
    () => loaded.map((n) => applyAssessment(n, assessments[n.id])),
    [loaded, assessments],
  )
  const visible = all.filter(
    (n) =>
      // «Риски» и «Возможности» вместе — то же, что без фильтра по типу
      (filters.risks === filters.opportunities ||
        (filters.risks ? !!n.risks?.length : !!n.opportunities?.length)) &&
      (!filters.bankOnly || !!bankPosition(n)),
  )

  // Риски, возможности и банк фильтруются на фронте: если очередная порция не дала ни одной
  // подходящей карточки, дальше грузим по кнопке, а не выкачиваем всю ленту прокруткой
  const lastPage = pages?.[pages.length - 1]
  const clientFiltered = filters.risks !== filters.opportunities || filters.bankOnly
  const autoLoad =
    !clientFiltered || !lastPage || visible.some((n) => lastPage.items.some((x) => x.id === n.id))

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
    autoLoad,
    assessments,
    observe,
    retry,
    refresh: () => feed.refetch(),
  }
}
