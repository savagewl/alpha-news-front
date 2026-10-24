// Постепенная загрузка AI-оценок ленты: видимые карточки без оценки уходят в поток
// POST /companies/{id}/news/assessments/stream, результат приходит по карточкам.
import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError, openStream } from './client'
import type {
  AssessmentDone,
  AssessmentEvent,
  CompanyNewsItem,
  InterpretationSource,
} from './companyNewsTypes'
import { createSseParser } from './sse'

/** Состояние оценки карточки на фронте; interrupted — поток оборвался до итога */
export type CardAssessment =
  | { status: 'queued' }
  | { status: 'generating' }
  | { status: 'interrupted' }
  | Exclude<AssessmentEvent, { status: 'queued' | 'generating' }>

const finalStatuses = new Set(['ready', 'needs_revision', 'insufficient'])
const isFinal = (a: CardAssessment | undefined) => !!a && finalStatuses.has(a.status)

/** Лимит бэка на один поток */
const batchSize = 20
/** Карточки, попавшие в экран почти одновременно, отправляем одной пачкой */
const batchDelayMs = 300

/** Позиция банка: в потоке — bank_position/sources, в ленте пока — bank_analytics/bank_sources */
export const bankPosition = (n: CompanyNewsItem) => n.bank_position ?? n.bank_analytics ?? null
export const bankSources = (n: CompanyNewsItem): InterpretationSource[] =>
  n.sources ?? n.bank_sources ?? []

/** Карточка ленты с наложенным результатом потока */
export function applyAssessment(item: CompanyNewsItem, a: CardAssessment | undefined) {
  if (a?.status !== 'ready') return item
  return {
    ...item,
    assessment_status: 'ready' as const,
    brief_impact: a.brief_impact,
    risks: a.risks,
    opportunities: a.opportunities,
    bank_position: a.bank_position,
    sources: a.sources,
  }
}

/** Карточке нужна оценка: в ленте её нет и итог ещё не получен в этой сессии */
const needsAssessment = (n: CompanyNewsItem | undefined, a: CardAssessment | undefined) =>
  !!n && n.assessment_status !== 'ready' && !a

// Бэк пока не сохраняет результат потока в ленту — держим итоги до конца сессии,
// чтобы перезагрузка не запускала LLM заново
const sessionKey = (companyId: string) => `alpha-news:assessments:${companyId}`

function loadSession(companyId: string): Record<string, CardAssessment> {
  try {
    const raw = sessionStorage.getItem(sessionKey(companyId))
    return raw ? (JSON.parse(raw) as Record<string, CardAssessment>) : {}
  } catch {
    return {}
  }
}

function saveSession(companyId: string, map: Record<string, CardAssessment>) {
  try {
    const finals = Object.fromEntries(Object.entries(map).filter(([, a]) => isFinal(a)))
    sessionStorage.setItem(sessionKey(companyId), JSON.stringify(finals))
  } catch {
    // хранилище недоступно — итоги проживут до перезагрузки
  }
}

export async function streamAssessments(
  companyId: string,
  newsIds: string[],
  onAssessment: (e: AssessmentEvent) => void,
  signal: AbortSignal,
): Promise<AssessmentDone | null> {
  const body = await openStream(
    `/companies/${encodeURIComponent(companyId)}/news/assessments/stream`,
    { news_ids: newsIds },
    signal,
  )
  let done: AssessmentDone | null = null
  const parser = createSseParser(({ event, data }) => {
    try {
      if (event === 'assessment') onAssessment(JSON.parse(data) as AssessmentEvent)
      else if (event === 'done') done = JSON.parse(data) as AssessmentDone
    } catch {
      // битое событие пропускаем — карточка останется без итога и будет помечена прерванной
    }
  })
  const reader = body.getReader()
  // stream: true — многобайтовый символ UTF-8 может разрезаться между chunk'ами
  const decoder = new TextDecoder()
  try {
    for (;;) {
      const { value, done: end } = await reader.read()
      if (end) break
      parser.push(decoder.decode(value, { stream: true }))
    }
  } finally {
    parser.flush()
    reader.releaseLock()
  }
  return done
}

/**
 * Оценки ленты компании: observe(id) вешается на карточку, и как только она попадает в экран
 * без оценки — уходит в поток. Одновременно открыт один поток, остальные ждут своей пачки.
 */
export function useAssessments(companyId: string, items: CompanyNewsItem[]) {
  const [map, setMap] = useState<Record<string, CardAssessment>>(() => loadSession(companyId))
  const [owner, setOwner] = useState(companyId)
  // сменилась компания — свои итоги (паттерн «состояние от пропсов» без эффекта)
  if (owner !== companyId) {
    setOwner(companyId)
    setMap(loadSession(companyId))
  }

  const mapRef = useRef(map)
  const itemsRef = useRef(new Map<string, CompanyNewsItem>())
  const visible = useRef(new Set<string>())
  const wanted = useRef(new Set<string>())
  const controller = useRef<AbortController | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const observer = useRef<IntersectionObserver | null>(null)
  const refs = useRef(new Map<string, (el: HTMLElement | null) => void>())
  // run и schedule вызывают друг друга — связываем через ref, а не через замыкание
  const scheduleRef = useRef<() => void>(() => {})
  const wantRef = useRef<(id: string) => void>(() => {})

  useEffect(() => {
    mapRef.current = map
    saveSession(companyId, map)
  }, [map, companyId])

  useEffect(() => {
    itemsRef.current = new Map(items.map((n) => [n.id, n]))
  }, [items])

  const patch = useCallback((id: string, a: CardAssessment | null) => {
    setMap((m) => {
      const next = { ...m }
      if (a) next[id] = a
      else delete next[id]
      mapRef.current = next
      return next
    })
  }, [])

  const run = useCallback(
    async (ids: string[]) => {
      const ctrl = new AbortController()
      controller.current = ctrl
      const pending = new Set(ids)
      try {
        const done = await streamAssessments(
          companyId,
          ids,
          (e) => {
            if (!pending.has(e.news_id)) return
            if (e.status === 'queued' || e.status === 'generating')
              return patch(e.news_id, { status: e.status })
            pending.delete(e.news_id)
            patch(e.news_id, e)
          },
          ctrl.signal,
        )
        // без done или с недошедшими карточками: итог неизвестен, готовыми их не считаем
        if (!done || pending.size) pending.forEach((id) => patch(id, { status: 'interrupted' }))
      } catch (err) {
        if (ctrl.signal.aborted) return
        const status = err instanceof ApiError ? err.status : undefined
        pending.forEach((id) =>
          patch(id, {
            news_id: id,
            status: 'failed',
            detail: err instanceof Error ? err.message : undefined,
            http_status: status,
            // 404/422 — ошибка в запросе, повтор с теми же ID не поможет
            retryable: status !== 404 && status !== 422,
          }),
        )
      } finally {
        if (controller.current === ctrl) controller.current = null
      }
      if (!ctrl.signal.aborted) scheduleRef.current()
    },
    [companyId, patch],
  )

  const schedule = useCallback(() => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      timer.current = null
      if (controller.current) return
      const batch = [...wanted.current].filter((id) => visible.current.has(id)).slice(0, batchSize)
      // ушедшие из экрана до отправки — не тратим на них LLM
      wanted.current.forEach((id) => {
        if (!visible.current.has(id)) {
          wanted.current.delete(id)
          if (mapRef.current[id]?.status === 'queued') patch(id, null)
        }
      })
      if (!batch.length) return
      batch.forEach((id) => wanted.current.delete(id))
      void run(batch)
    }, batchDelayMs)
  }, [patch, run])

  const want = useCallback(
    (id: string) => {
      if (wanted.current.has(id)) return
      wanted.current.add(id)
      patch(id, { status: 'queued' })
      schedule()
    },
    [patch, schedule],
  )

  useEffect(() => {
    scheduleRef.current = schedule
    wantRef.current = want
  }, [schedule, want])

  // Наблюдатель создаётся лениво: ref карточки срабатывает раньше эффектов
  const getObserver = useCallback(() => {
    observer.current ??= new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = (entry.target as HTMLElement).dataset.newsId
          if (!id) continue
          if (entry.isIntersecting) {
            visible.current.add(id)
            // попала в экран без оценки — в очередь
            if (needsAssessment(itemsRef.current.get(id), mapRef.current[id])) wantRef.current(id)
          } else visible.current.delete(id)
        }
      },
      { rootMargin: '0px 0px 200px 0px' },
    )
    return observer.current
  }, [])

  useEffect(
    () => () => {
      observer.current?.disconnect()
      observer.current = null
    },
    [],
  )

  // Уход со страницы или смена компании — закрываем поток и очередь
  useEffect(
    () => () => {
      controller.current?.abort()
      controller.current = null
      if (timer.current) clearTimeout(timer.current)
      wanted.current.clear()
      visible.current.clear()
    },
    [companyId],
  )

  const observe = useCallback(
    (id: string) => {
      let ref = refs.current.get(id)
      if (!ref) {
        let node: HTMLElement | null = null
        ref = (el) => {
          if (node) getObserver().unobserve(node)
          node = el
          if (el) {
            el.dataset.newsId = id
            getObserver().observe(el)
          } else visible.current.delete(id)
        }
        refs.current.set(id, ref)
      }
      return ref
    },
    [getObserver],
  )

  /** Повтор оценки: сбрасываем итог и снова ставим карточку в очередь */
  const retry = useCallback(
    (id: string) => {
      patch(id, null)
      visible.current.add(id)
      want(id)
    },
    [patch, want],
  )

  return { assessments: map, observe, retry }
}
