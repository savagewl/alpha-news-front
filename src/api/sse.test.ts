import { describe, expect, it } from 'vitest'
import { createSseParser, type SseEvent } from './sse'

const collect = () => {
  const events: SseEvent[] = []
  return { events, parser: createSseParser((e) => events.push(e)) }
}

describe('sse parser', () => {
  it('parses named events and skips ping comments', () => {
    const { events, parser } = collect()
    parser.push('event: assessment\ndata: {"a":1}\n\n: ping\n\nevent: done\ndata: {}\n\n')
    expect(events).toEqual([
      { event: 'assessment', data: '{"a":1}' },
      { event: 'done', data: '{}' },
    ])
  })

  it('joins an event split across network chunks', () => {
    const { events, parser } = collect()
    parser.push('event: assess')
    parser.push('ment\ndata: {"news_id":')
    expect(events).toHaveLength(0)
    parser.push('"x"}\n')
    expect(events).toHaveLength(0)
    parser.push('\n')
    expect(events).toEqual([{ event: 'assessment', data: '{"news_id":"x"}' }])
  })

  it('handles CRLF and multi-line data', () => {
    const { events, parser } = collect()
    parser.push('data: line1\r\ndata: line2\r\n\r\n')
    expect(events).toEqual([{ event: 'message', data: 'line1\nline2' }])
  })

  it('drops an unfinished event on flush', () => {
    const { events, parser } = collect()
    parser.push('event: assessment\ndata: {"a"')
    parser.flush()
    parser.push('\n\n')
    expect(events).toHaveLength(0)
  })
})
