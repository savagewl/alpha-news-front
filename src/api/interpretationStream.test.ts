import { afterEach, describe, expect, it, vi } from 'vitest'
import { applyDelta, emptyDraft, streamInterpretation } from './interpretationStream'

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
  onReset: vi.fn(),
  onDelta: vi.fn(),
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

  it('passes reset and text deltas', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      sseResponse([
        'event: reset\ndata: {"revision_version":0,"verified":false}\n\nevent: delta\ndata: {"revision_',
        'version":0,"field":"ai_interpretation","text":"Для «компании»\\n","verified":false}\n\n',
      ]),
    )
    const h = handlers()
    await streamInterpretation('QA9001', 'n1', h, new AbortController().signal)
    expect(h.onReset).toHaveBeenCalledWith(0)
    expect(h.onDelta.mock.calls[0][0]).toMatchObject({
      field: 'ai_interpretation',
      text: 'Для «компании»\n',
    })
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

describe('applyDelta', () => {
  const delta = (field: string, text: string, index?: number, revision_version = 0) =>
    ({ revision_version, field, index, text, verified: false }) as Parameters<typeof applyDelta>[1]

  it('appends text to string fields and list items by index', () => {
    const d = emptyDraft(0)
    applyDelta(d, delta('ai_interpretation', 'Для компании '))
    applyDelta(d, delta('ai_interpretation', 'рост затрат'))
    applyDelta(d, delta('bank_position', 'Банк'))
    applyDelta(d, delta('risks', 'Рост', 0))
    applyDelta(d, delta('risks', ' затрат', 0))
    applyDelta(d, delta('risks', 'Курс', 1))
    expect(d.draft.ai_interpretation).toBe('Для компании рост затрат')
    expect(d.draft.bank_position).toBe('Банк')
    expect(d.draft.risks).toEqual(['Рост затрат', 'Курс'])
  })

  it('ignores fragments of another revision', () => {
    const d = emptyDraft(1)
    expect(applyDelta(d, delta('headline', 'Старая версия', undefined, 0))).toBe(false)
    expect(d.draft.headline).toBe('')
  })
})
