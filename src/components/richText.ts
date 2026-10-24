// Лёгкая разметка в ответах модели: **жирный**, __жирный__, *курсив*, `код`, заголовки «# …».
// Полноценный markdown не нужен — модель присылает только эти приёмы.

export type Style = 'bold' | 'italic' | 'code'

export interface Segment {
  text: string
  style?: Style
}

const inline = /(\*\*|__)(?=\S)(.+?)(?<=\S)\1|`([^`\n]+)`|\*(?=\S)([^*\n]+?)(?<=\S)\*/g

function parseLine(line: string): Segment[] {
  const out: Segment[] = []
  let last = 0
  for (const m of line.matchAll(inline)) {
    if (m.index > last) out.push({ text: line.slice(last, m.index) })
    if (m[2] !== undefined) out.push({ text: m[2], style: 'bold' })
    else if (m[3] !== undefined) out.push({ text: m[3], style: 'code' })
    else out.push({ text: m[4], style: 'italic' })
    last = m.index + m[0].length
  }
  if (last < line.length) out.push({ text: line.slice(last) })
  return out
}

/** Текст → куски со стилем; незакрытая пара маркеров остаётся как есть */
export function parseRichText(text: string): Segment[] {
  const out: Segment[] = []
  text.split('\n').forEach((line, i) => {
    if (i > 0) out.push({ text: '\n' })
    // заголовок строки — просто жирная строка, отдельной иерархии в ответах нет
    const heading = /^\s{0,3}#{1,6}\s+(.*)$/.exec(line)
    if (heading) out.push(...parseLine(heading[1]).map((s) => ({ ...s, style: s.style ?? 'bold' })))
    else out.push(...parseLine(line))
  })
  return out.filter((s) => s.text)
}

export const plainText = (segments: Segment[]) => segments.map((s) => s.text).join('')
