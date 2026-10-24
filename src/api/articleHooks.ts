// Публикации и RSS-источники — запросы к бэкенду.
import { useQuery } from '@tanstack/react-query'
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
