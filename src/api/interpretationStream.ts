// Подробная AI-интерпретация новости потоком: этапы, черновики по мере доработки
// и итоговый результат. Подтверждён только result со status === 'ready'.
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useState } from 'react'
import { ApiError, openStream } from './client'
import { companyNewsKeys } from './companyNewsHooks'
import type {
  InterpretationDraft,
  InterpretationResult,
  InterpretationStage,
  StreamError,
} from './companyNewsTypes'
import { readSse } from './sse'

export const stageLabel: Record<InterpretationStage, string> = {
  preparing: 'Готовим контекст компании',
  generating: 'Пишем черновик разбора',
  verifying: 'Верификатор проверяет доказательства',
  revising: 'Дорабатываем по замечаниям',
  retrieving: 'Ищем источники',
  waiting: 'Ждём свободную модель',
}

interface Handlers {
  onStage: (stage: InterpretationStage) => void
  onDraft: (draft: InterpretationDraft) => void
  onResult: (result: InterpretationResult) => void
  onError: (error: StreamError) => void
}

/** true — поток закрылся событием done; false — оборвался раньше */
export async function streamInterpretation(
  companyId: string,
  newsId: string,
  h: Handlers,
  signal: AbortSignal,
): Promise<boolean> {
  const body = await openStream(
    `/companies/${encodeURIComponent(companyId)}/news/${encodeURIComponent(newsId)}/interpretation/stream`,
    undefined,
    signal,
  )
  let done = false
  await readSse(body, ({ event, data }) => {
    try {
      const json = data ? JSON.parse(data) : {}
      if (event === 'progress') h.onStage((json as { stage: InterpretationStage }).stage)
      else if (event === 'draft') h.onDraft(json as InterpretationDraft)
      else if (event === 'result') h.onResult(json as InterpretationResult)
      else if (event === 'error') h.onError(json as StreamError)
      else if (event === 'done') done = true
    } catch {
      // битое событие пропускаем: без result экран предложит повторить
    }
  })
  return done
}

export interface LiveInterpretation {
  /** Итог: ready, needs_revision или insufficient */
  result: InterpretationResult | undefined
  /** Последний непроверенный черновик — пока нет итога */
  draft: InterpretationDraft | null
  stage: InterpretationStage | null
  error: StreamError | null
  /** Поток оборвался без done и без итога */
  interrupted: boolean
  retry: () => void
}

/**
 * Интерпретация для экранов события. Итог кладётся в кеш react-query, поэтому разбор,
 * источники и Agent Trace одной новости не запускают генерацию повторно.
 */
export function useInterpretationLive(companyId: string, newsId: string): LiveInterpretation {
  const qc = useQueryClient()
  const key = companyNewsKeys.interpretation(companyId, newsId)
  // только чтение кеша — запрос делает поток
  const { data: result } = useQuery<InterpretationResult>({
    queryKey: key,
    queryFn: () => Promise.reject(new Error('интерпретация приходит потоком')),
    enabled: false,
    staleTime: Infinity,
  })
  const [draft, setDraft] = useState<InterpretationDraft | null>(null)
  const [stage, setStage] = useState<InterpretationStage | null>(null)
  const [error, setError] = useState<StreamError | null>(null)
  const [interrupted, setInterrupted] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!companyId || !newsId) return
    if (qc.getQueryData<InterpretationResult>(key)) return
    const ctrl = new AbortController()
    let finished = false
    setDraft(null)
    setStage(null)
    setError(null)
    setInterrupted(false)
    streamInterpretation(
      companyId,
      newsId,
      {
        onStage: setStage,
        // новый снимок полностью заменяет предыдущий
        onDraft: setDraft,
        onResult: (r) => {
          finished = true
          qc.setQueryData(key, r)
          setDraft(null)
        },
        onError: (e) => {
          finished = true
          setError(e)
        },
      },
      ctrl.signal,
    )
      .then(() => {
        // поток закрылся без result и error — итог неизвестен, предлагаем повторить
        if (!ctrl.signal.aborted && !finished) setInterrupted(true)
      })
      .catch((err) => {
        if (ctrl.signal.aborted) return
        // до открытия потока бэк отвечает обычным JSON: 401/404/422/503
        setError({
          detail: err instanceof Error ? err.message : undefined,
          http_status: err instanceof ApiError ? err.status : undefined,
          retryable: !(err instanceof ApiError && [404, 422].includes(err.status)),
        })
      })
    return () => ctrl.abort()
    // key выводится из companyId и newsId
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, newsId, attempt, qc])

  const retry = useCallback(() => {
    qc.removeQueries({ queryKey: companyNewsKeys.interpretation(companyId, newsId) })
    setAttempt((n) => n + 1)
  }, [qc, companyId, newsId])

  return { result, draft: result ? null : draft, stage, error, interrupted, retry }
}

/** Понятная причина, почему разбор не получен */
export function streamErrorText(e: StreamError): string {
  switch (e.http_status) {
    case 401:
      return 'Сессия истекла — войдите заново.'
    case 404:
      return 'Новость или компания не найдены, либо у вас нет доступа к компании.'
    case 429:
      return 'Модель сейчас занята. Повторите через минуту.'
    case 503:
      return 'Сервис временно недоступен.'
    default:
      return e.detail || 'Разбор не сформирован.'
  }
}
