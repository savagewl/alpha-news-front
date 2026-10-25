// Персональная лента компании, AI-интерпретация, личный чат по новости и аналитика банка —
// запросы к бэкенду.
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiError, api, requestBlob } from './client'
import type {
  AnalyticsDocument,
  AnalyticsSearchResult,
  BankDocumentsSelection,
  ChatHistory,
  ChatMessageResult,
  ChatThread,
  CompanyNewsPage,
  CompanyNewsQuery,
  DocumentPassage,
  UploadDocumentInput,
  UploadDocumentResult,
} from './companyNewsTypes'

const newsPath = (companyId: string, newsId?: string) =>
  `/companies/${encodeURIComponent(companyId)}/news` +
  (newsId ? `/${encodeURIComponent(newsId)}` : '')

export const companyNewsApi = {
  list: (companyId: string, q: CompanyNewsQuery, signal?: AbortSignal) =>
    api.get<CompanyNewsPage>(newsPath(companyId), { ...q }, signal),
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
  upload: ({ file, publisher, title, published_at, topics }: UploadDocumentInput) => {
    const form = new FormData()
    form.append('file', file)
    form.append('publisher', publisher)
    if (title) form.append('title', title)
    if (published_at) form.append('published_at', published_at)
    if (topics) form.append('topics', topics)
    return api.post<UploadDocumentResult>('/analytics/documents', form)
  },
  bankDocuments: (signal?: AbortSignal) =>
    api.get<BankDocumentsSelection>('/analytics/bank-documents', undefined, signal),
  setBankDocuments: (ids: string[]) =>
    api.put<BankDocumentsSelection>('/analytics/bank-documents', { document_ids: ids }),
  passages: (documentId: string, signal?: AbortSignal) =>
    api.get<DocumentPassage[]>(
      `/analytics/documents/${encodeURIComponent(documentId)}/passages`,
      { limit: 100 },
      signal,
    ),
  search: (query: string) =>
    api.post<AnalyticsSearchResult>('/analytics/search', { query, limit: 10, mode: 'hybrid' }),
  file: (
    documentId: string,
    onProgress?: (loaded: number, total: number) => void,
    signal?: AbortSignal,
  ) =>
    requestBlob(`/analytics/documents/${encodeURIComponent(documentId)}/file`, onProgress, signal),
}

export const companyNewsKeys = {
  feed: (companyId: string, q: CompanyNewsQuery) => ['company-news', companyId, 'feed', q] as const,
  head: (companyId: string, q: CompanyNewsQuery) => ['company-news', companyId, 'head', q] as const,
  interpretation: (companyId: string, newsId: string) =>
    ['interpretation', companyId, newsId] as const,
  history: (threadId: string) => ['chat', threadId] as const,
  documents: ['analytics', 'documents'] as const,
  bankDocuments: ['analytics', 'bank-documents'] as const,
  passages: (documentId: string) => ['analytics', 'documents', documentId, 'passages'] as const,
}

export const feedPageSize = 20

/** Лента сводки: страницы по limit/offset, прокрутка догружает следующую */
export const useCompanyNews = (companyId: string, q: CompanyNewsQuery) =>
  useInfiniteQuery({
    queryKey: companyNewsKeys.feed(companyId, q),
    queryFn: ({ pageParam, signal }) =>
      companyNewsApi.list(companyId, { ...q, limit: feedPageSize, offset: pageParam }, signal),
    initialPageParam: 0,
    getNextPageParam: (last) =>
      last.offset + last.limit < last.total ? last.offset + last.limit : undefined,
    enabled: !!companyId,
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

/** Пока ответ чата генерируется, опрашиваем историю с этим интервалом */
const generatingPollMs = 3_000

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
      let thread: ChatThread | null = null
      if (!id) {
        thread = await companyNewsApi.createThread(companyId, newsId)
        id = thread.id
        onThread(id)
      }
      const result = await companyNewsApi.ask(companyId, newsId, id, question)
      return { id, thread, result }
    },
    // ответ уже в теле POST — показываем его сразу, не дожидаясь перезапроса истории:
    // если тот упадёт, диалог не пропадёт с экрана
    onSuccess: async ({ id, thread, result }) => {
      const key = companyNewsKeys.history(id)
      // история, запрошенная до ответа, не должна затереть его
      await qc.cancelQueries({ queryKey: key })
      qc.setQueryData<ChatHistory>(key, (old) => {
        const base = old ?? (thread && { thread, messages: [], limit: 100, has_more: false })
        if (!base) return old
        const added = [result.user_message, result.assistant_message]
        const ids = new Set(added.map((m) => m.id))
        return { ...base, messages: [...base.messages.filter((m) => !ids.has(m.id)), ...added] }
      })
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

/** Загрузка PDF в общий корпус: документ сразу появляется в каталоге и обрабатывается в фоне */
export const useUploadDocument = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: companyNewsApi.upload,
    onSuccess: () => qc.invalidateQueries({ queryKey: companyNewsKeys.documents }),
  })
}

/** Документы, которые сейчас применяются как аналитика банка */
export const useBankDocuments = () =>
  useQuery({
    queryKey: companyNewsKeys.bankDocuments,
    queryFn: ({ signal }) => companyNewsApi.bankDocuments(signal),
  })

/** Заменить набор аналитики банка — действует для всех пользователей и новых разборов */
export const useApplyBankDocuments = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: companyNewsApi.setBankDocuments,
    onSuccess: (selection) => qc.setQueryData(companyNewsKeys.bankDocuments, selection),
  })
}

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

/** Скачанные за сессию PDF: повторное открытие, в том числе другой страницы, — без загрузки */
const pdfUrls = new Map<string, string>()

const megabytes = (bytes: number) =>
  (bytes / 1024 / 1024).toLocaleString('ru-RU', { maximumFractionDigits: 1 })

/**
 * Пока PDF качается, во вкладке — заглушка с прогрессом, а не пустой about:blank:
 * файлы аналитики весят мегабайты и грузятся десятки секунд. Возвращает, куда писать прогресс.
 */
function showLoading(tab: Window): (text: string) => void {
  try {
    const d = tab.document
    d.title = 'Загружаем PDF…'
    const box = d.createElement('div')
    box.style.cssText =
      'font:15px/1.5 system-ui,sans-serif;color:#0b1f35;max-width:480px;margin:0 auto;padding:64px 24px'
    const title = d.createElement('p')
    title.style.cssText = 'margin:0 0 8px;font-size:18px;font-weight:600'
    title.textContent = 'Загружаем PDF…'
    const status = d.createElement('p')
    status.style.cssText = 'margin:0;color:#6b7280'
    status.textContent = 'Файл аналитики большой — загрузка может занять до минуты.'
    box.append(title, status)
    d.body.append(box)
    return (text) => {
      status.textContent = text
    }
  } catch {
    // вкладка недоступна для записи — просто ждём файл
    return () => {}
  }
}

/**
 * PDF отдаётся только с токеном, поэтому обычная ссылка не подходит:
 * скачиваем файл и открываем его во вкладке, #page=N листает к нужной странице.
 */
export async function openDocument(documentId: string, page?: number | null) {
  // вкладку открываем сразу, пока действует клик пользователя, — иначе её заблокируют
  const tab = window.open('', '_blank')
  const show = (url: string) => {
    const target = page ? `${url}#page=${page}` : url
    if (tab) tab.location.href = target
    else window.location.href = target
  }
  const cached = pdfUrls.get(documentId)
  if (cached) return show(cached)

  const progress = tab ? showLoading(tab) : () => {}
  const ctrl = new AbortController()
  try {
    const blob = await companyNewsApi.file(
      documentId,
      (loaded, total) => {
        // вкладку закрыли, не дождавшись, — дальше не качаем
        if (tab?.closed) return ctrl.abort()
        progress(
          total
            ? `${megabytes(loaded)} из ${megabytes(total)} МБ · ${Math.floor((loaded / total) * 100)}%`
            : `${megabytes(loaded)} МБ`,
        )
      },
      ctrl.signal,
    )
    const url = URL.createObjectURL(blob)
    pdfUrls.set(documentId, url)
    show(url)
  } catch (err) {
    tab?.close()
    if (ctrl.signal.aborted) return
    throw err
  }
}
