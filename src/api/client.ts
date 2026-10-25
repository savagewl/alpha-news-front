const BASE_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

export class ApiError extends Error {
  status: number
  body: unknown

  constructor(status: number, message: string, body?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

// JWT из POST /user/login живёт 24 часа; храним в localStorage, чтобы сессия переживала перезагрузку
const TOKEN_KEY = 'alpha-news:token'

export const tokenStorage = {
  get(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY)
    } catch {
      return null
    }
  },
  set(token: string | null) {
    try {
      if (token === null) localStorage.removeItem(TOKEN_KEY)
      else localStorage.setItem(TOKEN_KEY, token)
    } catch {
      // хранилище недоступно (приватный режим) — сессия проживёт до перезагрузки
    }
  },
}

/** Вызывается, когда бэк отверг токен (истёк или отозван после смены пароля) */
let onUnauthorized: (() => void) | null = null
export const setUnauthorizedHandler = (fn: (() => void) | null) => {
  onUnauthorized = fn
}

type Query = Record<string, string | number | boolean | undefined | null>

interface RequestOptions extends Omit<RequestInit, 'body'> {
  query?: Query
  /** Объект уходит JSON, FormData — multipart (загрузка CSV) */
  body?: unknown
}

function buildUrl(path: string, query?: Query) {
  const url = `${BASE_URL}/api${path}`
  if (!query) return url
  const params = new URLSearchParams()
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== null && v !== '') params.set(k, String(v))
  }
  const qs = params.toString()
  return qs ? `${url}?${qs}` : url
}

interface CsvRowError {
  row?: number
  message?: string
  columns?: string[]
}

/**
 * detail бывает строкой, списком ошибок валидации FastAPI (422)
 * или объектом импорта CSV: { code, errors: [{ row, message, columns }] }
 */
function errorMessage(data: unknown, fallback: string): string {
  if (!data || typeof data !== 'object' || !('detail' in data)) return fallback
  const { detail } = data
  if (Array.isArray(detail))
    return detail
      .map((d) => (d && typeof d === 'object' && 'msg' in d ? String(d.msg) : String(d)))
      .join('; ')
  if (detail && typeof detail === 'object') {
    const errors = 'errors' in detail && Array.isArray(detail.errors) ? detail.errors : []
    if (errors.length)
      return (errors as CsvRowError[])
        .slice(0, 5)
        .map(
          (e) =>
            `${e.row !== undefined ? `Строка ${e.row}: ` : ''}${e.message ?? 'ошибка'}` +
            (e.columns?.length ? ` — ${e.columns.join(', ')}` : ''),
        )
        .join('; ')
    return 'code' in detail ? String(detail.code) : fallback
  }
  return String(detail)
}

export async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { query, body, headers, ...rest } = opts
  const token = tokenStorage.get()
  const isForm = body instanceof FormData
  const res = await fetch(buildUrl(path, query), {
    ...rest,
    headers: {
      Accept: 'application/json',
      ...(body !== undefined && !isForm ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
  })

  const text = await res.text()
  const data = text ? safeJson(text) : undefined
  if (!res.ok) {
    // 401 без токена — это неверный пароль при входе, а не протухшая сессия
    if (res.status === 401 && token) onUnauthorized?.()
    throw new ApiError(res.status, errorMessage(data, res.statusText), data)
  }
  return data as T
}

/**
 * POST с ответом text/event-stream. До открытия потока бэк может ответить обычным JSON
 * с ошибкой (401/404/422/503) — поэтому проверяем статус и Content-Type до чтения тела.
 */
export async function openStream(
  path: string,
  body: unknown,
  signal: AbortSignal,
): Promise<ReadableStream<Uint8Array>> {
  const token = tokenStorage.get()
  const res = await fetch(buildUrl(path), {
    method: 'POST',
    signal,
    headers: {
      Accept: 'text/event-stream',
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    // у потока интерпретации тела нет
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const type = res.headers.get('Content-Type') ?? ''
  if (!res.ok || !type.includes('text/event-stream') || !res.body) {
    const text = await res.text()
    const data = text ? safeJson(text) : undefined
    if (res.status === 401 && token) onUnauthorized?.()
    throw new ApiError(res.ok ? 502 : res.status, errorMessage(data, res.statusText), data)
  }
  return res.body
}

/**
 * Файл с авторизацией — для PDF аналитики, которые не открыть обычной ссылкой.
 * onProgress получает загруженные и общие байты (total = 0, если размер неизвестен).
 */
export async function requestBlob(
  path: string,
  onProgress?: (loaded: number, total: number) => void,
  signal?: AbortSignal,
): Promise<Blob> {
  const token = tokenStorage.get()
  const res = await fetch(buildUrl(path), {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    signal,
  })
  if (!res.ok) {
    if (res.status === 401 && token) onUnauthorized?.()
    throw new ApiError(res.status, res.statusText)
  }
  if (!onProgress || !res.body) return res.blob()
  const total = Number(res.headers.get('Content-Length')) || 0
  const type = res.headers.get('Content-Type') ?? ''
  const reader = res.body.getReader()
  const parts: Uint8Array<ArrayBuffer>[] = []
  let loaded = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    parts.push(value)
    loaded += value.length
    onProgress(loaded, total)
  }
  return new Blob(parts, { type })
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

export const api = {
  get: <T>(path: string, query?: Query, signal?: AbortSignal) =>
    request<T>(path, { method: 'GET', query, signal }),
  post: <T>(path: string, body?: unknown, query?: Query) =>
    request<T>(path, { method: 'POST', body, query }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}
