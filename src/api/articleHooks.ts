// Публикации и RSS-источники — запросы к бэкенду.
import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from './client'
import type { Article, ArticlePage, ArticlesQuery, NewsSource } from './articleTypes'

export const articleApi = {
  list: (q: ArticlesQuery, signal?: AbortSignal) => api.get<ArticlePage>('/news', { ...q }, signal),
  get: (id: string, signal?: AbortSignal) =>
    api.get<Article>(`/news/${encodeURIComponent(id)}`, undefined, signal),
  sources: (signal?: AbortSignal) => api.get<NewsSource[]>('/news/sources', undefined, signal),
}

export const articleKeys = {
  one: (id: string) => ['news', id] as const,
  sources: ['news', 'sources'] as const,
}

export const useArticle = (id: string | undefined) =>
  useQuery({
    queryKey: articleKeys.one(id ?? ''),
    queryFn: ({ signal }) => articleApi.get(id!, signal),
    enabled: !!id,
    retry: false,
  })

export const useNewsSources = () =>
  useQuery({
    queryKey: articleKeys.sources,
    queryFn: ({ signal }) => articleApi.sources(signal),
  })

/** Свежих публикаций за один запрос хватает, чтобы найти ещё не показанную */
const pullWindow = 20

/** Самая свежая публикация, которой ещё нет в ленте; null — новых нет */
export const usePullArticle = (shownIds: string[]) =>
  useMutation({
    mutationFn: async () => {
      const { items } = await articleApi.list({ limit: pullWindow })
      return items.find((a) => !shownIds.includes(a.id)) ?? null
    },
  })
