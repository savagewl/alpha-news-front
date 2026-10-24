import { describe, expect, it } from 'vitest'
import { parseRichText, plainText } from './richText'

describe('rich text', () => {
  it('turns markers into styled segments', () => {
    expect(parseRichText('Риск: **рост ставки** и *спрос*, код `ОКВЭД 25.11`')).toEqual([
      { text: 'Риск: ' },
      { text: 'рост ставки', style: 'bold' },
      { text: ' и ' },
      { text: 'спрос', style: 'italic' },
      { text: ', код ' },
      { text: 'ОКВЭД 25.11', style: 'code' },
    ])
  })

  it('makes heading lines bold and keeps line breaks', () => {
    const s = parseRichText('### Итог\nтекст')
    expect(s).toEqual([{ text: 'Итог', style: 'bold' }, { text: '\n' }, { text: 'текст' }])
  })

  it('leaves unclosed markers and lone asterisks as text', () => {
    expect(plainText(parseRichText('черновик **без пары'))).toBe('черновик **без пары')
    expect(plainText(parseRichText('2 * 3 = 6'))).toBe('2 * 3 = 6')
  })
})
