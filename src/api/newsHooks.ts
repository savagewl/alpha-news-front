// Хуки экранов новостной аналитики. Сейчас источник — мок newsMock; при подключении бэкенда
// заменить вызовы newsMock.* на запросы через api-клиент, сигнатуры хуков не меняются.
import { useMutation, useQuery } from '@tanstack/react-query'
import { newsMock } from '../mocks/api'

export const newsKeys = {
  digest: (companyId: string, role: string) => ['digest', companyId, role] as const,
  interpretation: (eventId: string) => ['interpretation', eventId] as const,
  trace: (eventId: string, role: string) => ['trace', eventId, role] as const,
}

export const useDigest = (companyId: string, role: string) =>
  useQuery({
    queryKey: newsKeys.digest(companyId, role),
    queryFn: () => newsMock.digest(companyId, role),
  })

export const useInterpretation = (eventId: string | undefined) =>
  useQuery({
    queryKey: newsKeys.interpretation(eventId ?? ''),
    queryFn: () => newsMock.interpretation(eventId!),
    enabled: !!eventId,
    retry: false,
  })

export const useTrace = (eventId: string | undefined, role: string) =>
  useQuery({
    queryKey: newsKeys.trace(eventId ?? '', role),
    queryFn: () => newsMock.trace(eventId!, role),
    enabled: !!eventId,
    retry: false,
  })

export const useAsk = (eventId: string, role: string) =>
  useMutation({ mutationFn: (question: string) => newsMock.ask(eventId, question, role) })
