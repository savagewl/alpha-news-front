import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { businessApi, insightsApi } from './endpoints'
import type { BusinessProfileInput, InsightsQuery } from './types'

export const qk = {
  businesses: ['businesses'] as const,
  business: (id: string) => ['businesses', id] as const,
  insights: (q: InsightsQuery) => ['insights', q] as const,
}

export const useBusinesses = () => useQuery({ queryKey: qk.businesses, queryFn: businessApi.list })

export const useBusiness = (id: string) =>
  useQuery({ queryKey: qk.business(id), queryFn: () => businessApi.get(id), enabled: !!id })

export const useCreateBusiness = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: BusinessProfileInput) => businessApi.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.businesses }),
  })
}

export const useInsights = (q: InsightsQuery) =>
  useQuery({
    queryKey: qk.insights(q),
    queryFn: ({ signal }) => insightsApi.list(q, signal),
    enabled: !!q.businessId,
    placeholderData: keepPreviousData,
  })

export const useRefreshInsights = (businessId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => insightsApi.refresh(businessId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['insights'] }),
  })
}
