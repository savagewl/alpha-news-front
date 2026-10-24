// Персональная лента компании, AI-интерпретация, личный чат по новости и аналитика банка —
// запросы к бэкенду.
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiError, api, requestBlob } from './client'
import type {
  AnalyticsDocument,
  AnalyticsSearchResult,
  ChatHistory,
  ChatMessageResult,
  ChatThread,
  CompanyNewsPage,
  CompanyNewsQuery,
  DocumentPassage,
  InterpretationResult,
} from './companyNewsTypes'

const newsPath = (companyId: string, newsId?: string) =>
  `/companies/${encodeURIComponent(companyId)}/news` +
  (newsId ? `/${encodeURIComponent(newsId)}` : '')

export const companyNewsApi = {
  list: (companyId: string, q: CompanyNewsQuery, signal?: AbortSignal) =>
    api.get<CompanyNewsPage>(newsPath(companyId), { ...q }, signal),
  // Первый вызов ждёт LLM, повторный отдаёт кеш — тела запроса нет
  interpretation: (companyId: string, newsId: string) =>
    api.post<InterpretationResult>(`${newsPath(companyId, newsId)}/interpretation`),
  createThread: (companyId: string, newsId: string) =>
    api.post<ChatThread>(`${newsPath(companyId, newsId)}/chat/threads`),
  history: (companyId: string, newsId: string, threadId: string, signal?: AbortSignal) =>
    api.get<ChatHistory>(
      `${newsPath(companyId, newsId)}/chat/threads/${encodeURIComponent(threadId)}/messages`,
      { limit: 100 },
      signal,
    ),
  ask: (companyId: string, newsId: string, threadId: string, question: string) =>
    api.post<ChatMessageResult>(
      `${newsPath(companyId, newsId)}/chat/threads/${encodeURIComponent(threadId)}/messages`,
      { question, client_message_id: crypto.randomUUID() },
    ),
  documents: (signal?: AbortSignal) =>
    api.get<AnalyticsDocument[]>('/analytics/documents', { limit: 100 }, signal),
  passages: (documentId: string, signal?: AbortSignal) =>
    api.get<DocumentPassage[]>(
      `/analytics/documents/${encodeURIComponent(documentId)}/passages`,
      { limit: 100 },
      signal,
    ),
  search: (query: string) =>
    api.post<AnalyticsSearchResult>('/analytics/search', { query, limit: 10, mode: 'hybrid' }),
  file: (documentId: string) =>
    requestBlob(`/analytics/documents/${encodeURIComponent(documentId)}/file`),
}

export const companyNewsKeys = {
  feed: (companyId: string, q: CompanyNewsQuery) => ['company-news', companyId, 'feed', q] as const,
  head: (companyId: string, q: CompanyNewsQuery) => ['company-news', companyId, 'head', q] as const,
  interpretation: (companyId: string, newsId: string) =>
    ['interpretation', companyId, newsId] as const,
  history: (threadId: string) => ['chat', threadId] as const,
  documents: ['analytics', 'documents'] as const,
  passages: (documentId: string) => ['analytics', 'documents', documentId, 'passages'] as const,
}

export const feedPageSize = 20

const assessingPollMs = 15_000

/** Лента сводки: страницы по limit/offset, «Показать ещё» догружает следующую */
export const useCompanyNews = (companyId: string, q: CompanyNewsQuery) =>
  useInfiniteQuery({
    queryKey: companyNewsKeys.feed(companyId, q),
    queryFn: ({ pageParam, signal }) =>
      companyNewsApi.list(companyId, { ...q, limit: feedPageSize, offset: pageParam }, signal),
    initialPageParam: 0,
    getNextPageParam: (last) =>
      last.offset + last.limit < last.total ? last.offset + last.limit : undefined,
    enabled: !!companyId,
    // пока LLM оценивает новости ленты, подтягиваем готовые оценки
    refetchInterval: (query) =>
      query.state.data?.pages.some((p) => p.items.some((n) => n.processing_status === 'processing'))
        ? assessingPollMs
        : false,
  })

/** Как часто проверяем, не появились ли в ленте новые публикации */
const pollMs = 60_000

/** Верх ленты без кеша страниц — для счётчика новых публикаций и числа приоритетов */
export const useCompanyNewsHead = (companyId: string, q: CompanyNewsQuery = {}, poll = false) =>
  useQuery({
    queryKey: companyNewsKeys.head(companyId, q),
    queryFn: ({ signal }) =>
      companyNewsApi.list(companyId, { ...q, limit: feedPageSize, offset: 0 }, signal),
    enabled: !!companyId,
    refetchInterval: poll ? pollMs : false,
  })

/** Пока идёт генерация, опрашиваем с этим интервалом */
const generatingPollMs = 3_000

export const useInterpretation = (companyId: string, newsId: string | undefined) =>
  useQuery({
    queryKey: companyNewsKeys.interpretation(companyId, newsId ?? ''),
    queryFn: () => companyNewsApi.interpretation(companyId, newsId!),
    enabled: !!companyId && !!newsId,
    // бэк кеширует результат сам, повторные POST дешёвые
    staleTime: 5 * 60_000,
    refetchInterval: (query) =>
      query.state.data?.status === 'generating' ? generatingPollMs : false,
    // 409 — генерация уже запущена другим запросом, ждём её
    retry: (count, error) => error instanceof ApiError && error.status === 409 && count < 10,
    retryDelay: generatingPollMs,
  })

/** Понятная причина, почему разбор не получен */
export function interpretationError(error: unknown): string {
  if (!(error instanceof ApiError)) return 'Нет связи с сервисом. Проверьте подключение.'
  switch (error.status) {
    case 404:
      return 'Новость или компания не найдены, либо у вас нет доступа к компании.'
    case 429:
      return 'Превышен лимит запросов к AI. Повторите через минуту.'
    case 502:
      return 'Модель вернула ответ без подтверждённых доказательств — он не показан.'
    case 503:
      return 'Сервис AI временно недоступен.'
    case 504:
      return 'Модель не успела ответить. Повторите попытку.'
    default:
      return error.message
  }
}

// Чат принадлежит пользователю, а бэк не отдаёт список тредов — id треда помним сами
const threadKey = (userId: string, companyId: string, newsId: string) =>
  `alpha-news:chat:${userId}:${companyId}:${newsId}`

export const threadStorage = {
  get(userId: string, companyId: string, newsId: string): string | null {
    try {
      return localStorage.getItem(threadKey(userId, companyId, newsId))
    } catch {
      return null
    }
  },
  set(userId: string, companyId: string, newsId: string, threadId: string | null) {
    try {
      const k = threadKey(userId, companyId, newsId)
      if (threadId === null) localStorage.removeItem(k)
      else localStorage.setItem(k, threadId)
    } catch {
      // хранилище недоступно — диалог проживёт до перезагрузки
    }
  },
}

export const useChatHistory = (companyId: string, newsId: string, threadId: string | null) =>
  useQuery({
    queryKey: companyNewsKeys.history(threadId ?? ''),
    queryFn: ({ signal }) => companyNewsApi.history(companyId, newsId, threadId!, signal),
    enabled: !!threadId,
    retry: false,
    // ответ, принятый с 202, дописывается в фоне — ждём его в истории
    refetchInterval: (query) =>
      query.state.data?.messages.some((m) => m.status === 'generating') ? generatingPollMs : false,
  })

/** Вопрос по новости: тред создаётся при первом вопросе, после ответа обновляется история */
export const useAsk = (
  companyId: string,
  newsId: string,
  threadId: string | null,
  onThread: (threadId: string) => void,
) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (question: string) => {
      let id = threadId
      if (!id) {
        id = (await companyNewsApi.createThread(companyId, newsId)).id
        onThread(id)
      }
      await companyNewsApi.ask(companyId, newsId, id, question)
      return id
    },
    // неудачный ответ бэк тоже сохраняет в истории — обновляем её в любом случае
    onSettled: () => qc.invalidateQueries({ queryKey: ['chat'] }),
  })
}

const processingStatuses = new Set(['queued', 'extracting', 'indexing'])

export const useAnalyticsDocuments = () =>
  useQuery({
    queryKey: companyNewsKeys.documents,
    queryFn: ({ signal }) => companyNewsApi.documents(signal),
    // PDF обрабатывается в фоне — ждём, пока статус станет итоговым
    refetchInterval: (query) =>
      query.state.data?.some((d) => processingStatuses.has(d.status)) ? 5_000 : false,
  })

export const useDocumentPassages = (documentId: string | null) =>
  useQuery({
    queryKey: companyNewsKeys.passages(documentId ?? ''),
    queryFn: ({ signal }) => companyNewsApi.passages(documentId!, signal),
    enabled: !!documentId,
    staleTime: 5 * 60_000,
  })

/** Поиск по материалам банка: гибрид BGE и полнотекстового, без BGE — только текстовый */
export const useAnalyticsSearch = () =>
  useMutation({ mutationFn: (query: string) => companyNewsApi.search(query) })

/**
 * PDF отдаётся только с токеном, поэтому обычная ссылка не подходит:
 * скачиваем файл и открываем его во вкладке, #page=N листает к нужной странице.
 */
export async function openDocument(documentId: string, page?: number | null) {
  const tab = window.open('', '_blank')
  try {
    const blob = await companyNewsApi.file(documentId)
    const url = URL.createObjectURL(blob)
    if (tab) tab.location.href = page ? `${url}#page=${page}` : url
    else window.location.href = url
  } catch (err) {
    tab?.close()
    throw err
  }
}
