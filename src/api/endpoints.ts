import { api } from './client'
import type {
  BusinessProfile,
  BusinessProfileInput,
  InsightsQuery,
  NewsInsight,
  Paginated,
} from './types'

export const businessApi = {
  list: () => api.get<BusinessProfile[]>('/businesses'),
  get: (id: string) => api.get<BusinessProfile>(`/businesses/${id}`),
  create: (input: BusinessProfileInput) => api.post<BusinessProfile>('/businesses', input),
  update: (id: string, input: BusinessProfileInput) =>
    api.put<BusinessProfile>(`/businesses/${id}`, input),
  remove: (id: string) => api.delete<void>(`/businesses/${id}`),
}

export const insightsApi = {
  list: ({ businessId, ...query }: InsightsQuery, signal?: AbortSignal) =>
    api.get<Paginated<NewsInsight>>(`/businesses/${businessId}/insights`, query, signal),
  /** Запустить пересчёт/анализ свежих новостей для бизнеса */
  refresh: (businessId: string) => api.post<void>(`/businesses/${businessId}/insights/refresh`),
}

export const healthApi = {
  ping: () => api.get<{ status: string }>('/health'),
}
