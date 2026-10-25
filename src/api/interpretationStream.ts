// Подробная AI-интерпретация новости потоком: этапы, текст черновика фрагментами по мере
// генерации и итоговый результат. Подтверждён только result со status === 'ready'.
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useState } from 'react'
import { ApiError, openStream } from './client'
import { companyNewsKeys } from './companyNewsHooks'
import type {
  InsightDraft,
  InterpretationDelta,
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
  /** Началась новая версия черновика — прежний текст больше не нужен */
  onReset: (revision: number) => void
  onDelta: (delta: InterpretationDelta) => void
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
      else if (event === 'reset') h.onReset((json as { revision_version: number }).revision_version)
      else if (event === 'delta') h.onDelta(json as InterpretationDelta)
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

/** Пустой черновик новой версии: поля заполняются фрагментами delta */
export const emptyDraft = (revision: number): InterpretationDraft => ({
  revision_version: revision,
  verified: false,
  draft: {
    headline: '',
    ai_interpretation: '',
    bank_position: null,
    facts: [],
    risks: [],
    opportunities: [],
    suggested_actions: [],
    limitations: [],
  },
})

/** Дописывает фрагмент к полю черновика на месте; фрагменты чужой версии пропускает */
export function applyDelta(target: InterpretationDraft, delta: InterpretationDelta): boolean {
  if (delta.revision_version !== target.revision_version) return false
  const d = target.draft
  const { field, index, text } = delta
  if (field === 'headline' || field === 'ai_interpretation' || field === 'bank_position') {
    d[field] = (d[field] ?? '') + text
  } else if (index !== undefined) {
    const list = (d[field] ??= [])
    list[index] = (list[index] ?? '') + text
  }
  return true
}

/** Копия для React: поля и списки новые, чтобы изменение было заметно */
const snapshot = (x: InterpretationDraft): InterpretationDraft => {
  const d: InsightDraft = { ...x.draft }
  for (const k of ['facts', 'risks', 'opportunities', 'suggested_actions', 'limitations'] as const)
    if (d[k]) d[k] = Array.from(d[k], (v) => v ?? '')
  return { ...x, draft: d }
}

export interface LiveInterpretation {
  /** Итог: ready, needs_revision или insufficient */
  result: InterpretationResult | undefined
  /** Непроверенный черновик, который сейчас пишется, — пока нет итога */
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
    // черновик копится здесь, в React уходит не чаще раза за кадр
    let live: InterpretationDraft | null = null
    let frame = 0
    const cancelFlush = () => {
      cancelAnimationFrame(frame)
      frame = 0
    }
    const scheduleFlush = () => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        setDraft(live && snapshot(live))
      })
    }
    setDraft(null)
    setStage(null)
    setError(null)
    setInterrupted(false)
    streamInterpretation(
      companyId,
      newsId,
      {
        onStage: setStage,
        // новая версия: прежний текст и его отложенный показ отбрасываем
        onReset: (revision) => {
          cancelFlush()
          live = emptyDraft(revision)
          setDraft(snapshot(live))
        },
        onDelta: (delta) => {
          if (live && applyDelta(live, delta)) scheduleFlush()
        },
        // полный снимок заменяет накопленный текст, а не дописывается к нему
        onDraft: (d) => {
          if (live && d.revision_version !== live.revision_version) return
          live = d
          scheduleFlush()
        },
        onResult: (r) => {
          finished = true
          cancelFlush()
          live = null
          qc.setQueryData(key, r)
          setDraft(null)
        },
        onError: (e) => {
          finished = true
          cancelFlush()
          live = null
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
    return () => {
      ctrl.abort()
      cancelFlush()
    }
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
