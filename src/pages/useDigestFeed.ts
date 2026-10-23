import { useState } from 'react'
import { usePullArticle } from '../api/articleHooks'
import type { Article } from '../api/articleTypes'
import { useDigest } from '../api/newsHooks'
import type { Topic } from '../api/newsTypes'

export interface Filters {
  topic: Topic | null
  risks: boolean
  opportunities: boolean
  bankOnly: boolean
}

const noFilters: Filters = { topic: null, risks: false, opportunities: false, bankOnly: false }

/** Лента сводки: события компании под роль, фильтры и подгрузка свежих публикаций */
export function useDigestFeed(companyId: string, role: string) {
  const digest = useDigest(companyId, role)
  const [filters, setFilters] = useState<Filters>(noFilters)
  // Подгруженные публикации — новые сверху; ранжирования у них нет, поэтому живут отдельно от событий
  const [articles, setArticles] = useState<Article[]>([])
  const pull = usePullArticle(articles.map((a) => a.id))

  const set = (patch: Partial<Filters>) => setFilters((f) => ({ ...f, ...patch }))
  const reset = () => setFilters(noFilters)
  const filtered = !!(filters.topic || filters.risks || filters.opportunities || filters.bankOnly)

  const all = digest.data?.events ?? []
  const topics = [...new Set(all.map((e) => e.topic))]
  const visible = all.filter(
    (e) =>
      (!filters.topic || e.topic === filters.topic) &&
      // «Риски» и «Возможности» вместе — то же, что без фильтра по типу
      (filters.risks === filters.opportunities ||
        (filters.risks ? e.kind === 'risk' : e.kind === 'opportunity')) &&
      (!filters.bankOnly || !!e.bankRef),
  )

  const onPull = () =>
    pull.mutate(undefined, {
      onSuccess: (article) => article && setArticles((list) => [article, ...list]),
    })

  return { digest, pull, onPull, articles, filters, set, reset, filtered, all, topics, visible }
}
