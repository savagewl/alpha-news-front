import { afterEach, describe, expect, it, vi } from 'vitest'
import { streamInterpretation } from './interpretationStream'

afterEach(() => vi.restoreAllMocks())

const sseResponse = (chunks: string[]) => {
  const enc = new TextEncoder()
  const body = new ReadableStream<Uint8Array>({
    start(c) {
      chunks.forEach((x) => c.enqueue(enc.encode(x)))
      c.close()
    },
  })
  return new Response(body, { headers: { 'Content-Type': 'text/event-stream; charset=utf-8' } })
}

const handlers = () => ({
  onStage: vi.fn(),
  onDraft: vi.fn(),
  onResult: vi.fn(),
  onError: vi.fn(),
})

describe('interpretation stream', () => {
  it('passes stages, drafts and result in order', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      sseResponse([
        'event: progress\ndata: {"stage":"preparing"}\n\nevent: progress\ndata: {"sta',
        'ge":"generating"}\n\n: ping\n\nevent: draft\ndata: {"draft":{"headline":"Ставка"},"revision_version":0,"verified":false}\n\n',
        'event: result\ndata: {"status":"ready","interpretation":{"headline":"Ставка"}}\n\nevent: done\ndata: {}\n\n',
      ]),
    )
    const h = handlers()
    const done = await streamInterpretation('QA9001', 'n1', h, new AbortController().signal)
    expect(done).toBe(true)
    expect(h.onStage.mock.calls.map((c) => c[0])).toEqual(['preparing', 'generating'])
    expect(h.onDraft).toHaveBeenCalledWith({
      draft: { headline: 'Ставка' },
      revision_version: 0,
      verified: false,
    })
    expect(h.onResult.mock.calls[0][0].status).toBe('ready')
  })

  it('reports a stream cut before done', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      sseResponse(['event: progress\ndata: {"stage":"verifying"}\n\n']),
    )
    const h = handlers()
    expect(await streamInterpretation('QA9001', 'n1', h, new AbortController().signal)).toBe(false)
    expect(h.onResult).not.toHaveBeenCalled()
  })

  it('throws ApiError on a JSON error before the stream opens', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('{"detail":"Company not found"}', {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    await expect(
      streamInterpretation('X', 'n1', handlers(), new AbortController().signal),
    ).rejects.toMatchObject({ name: 'ApiError', status: 404, message: 'Company not found' })
  })
})
