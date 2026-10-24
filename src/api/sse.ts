// Разбор text/event-stream вручную: EventSource не умеет POST с телом и Bearer-заголовком.
// Сетевой chunk не равен событию — копим текст до пустой строки.

export interface SseEvent {
  /** Имя из поля event:, по умолчанию message */
  event: string
  /** Строки data: через перевод строки */
  data: string
}

export function createSseParser(onEvent: (e: SseEvent) => void) {
  let buffer = ''

  const dispatch = (block: string) => {
    let event = 'message'
    const data: string[] = []
    for (const line of block.split('\n')) {
      // строка с двоеточием в начале — комментарий (: ping), её пропускаем
      if (!line || line.startsWith(':')) continue
      const colon = line.indexOf(':')
      const field = colon === -1 ? line : line.slice(0, colon)
      let value = colon === -1 ? '' : line.slice(colon + 1)
      if (value.startsWith(' ')) value = value.slice(1)
      if (field === 'event') event = value
      else if (field === 'data') data.push(value)
    }
    if (data.length) onEvent({ event, data: data.join('\n') })
  }

  return {
    push(chunk: string) {
      buffer += chunk.replace(/\r\n?/g, '\n')
      let end: number
      while ((end = buffer.indexOf('\n\n')) !== -1) {
        dispatch(buffer.slice(0, end))
        buffer = buffer.slice(end + 2)
      }
    },
    /** Конец потока: недописанное событие без пустой строки не считается полученным */
    flush() {
      buffer = ''
    },
  }
}

/** Читает тело ответа до конца и отдаёт события по одному */
export async function readSse(body: ReadableStream<Uint8Array>, onEvent: (e: SseEvent) => void) {
  const parser = createSseParser(onEvent)
  const reader = body.getReader()
  // stream: true — многобайтовый символ UTF-8 может разрезаться между chunk'ами
  const decoder = new TextDecoder()
  try {
    for (;;) {
      const { value, done } = await reader.read()
      if (done) break
      parser.push(decoder.decode(value, { stream: true }))
    }
  } finally {
    parser.flush()
    reader.releaseLock()
  }
}
