import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, api } from './client'

afterEach(() => vi.restoreAllMocks())

const mockFetch = (res: Partial<Response> & { text: () => Promise<string> }) =>
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(res as Response)

describe('api client', () => {
  it('parses json and builds query string', async () => {
    const spy = mockFetch({ ok: true, text: async () => '{"a":1}' })
    const data = await api.get<{ a: number }>('/x', { q: 'hi', skip: undefined })
    expect(data).toEqual({ a: 1 })
    expect(spy.mock.calls[0][0]).toBe('/api/x?q=hi')
  })

  it('throws ApiError with detail', async () => {
    mockFetch({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      text: async () => '{"detail":"nope"}',
    })
    await expect(api.get('/x')).rejects.toMatchObject({
      name: 'ApiError',
      status: 404,
      message: 'nope',
    })
    expect(ApiError).toBeDefined()
  })
})
