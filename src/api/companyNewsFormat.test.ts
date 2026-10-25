import { describe, expect, it } from 'vitest'
import { documentIdOf, stripCitations } from './companyNewsFormat'

describe('company news format', () => {
  it('strips model citation markers', () => {
    expect(
      stripCitations(
        'Для компании (company:Отрасль (ОКВЭД 25.11)) риск растёт [B2]. Спрос (news:https://x.ru/a) ниже.',
      ),
    ).toBe('Для компании риск растёт. Спрос ниже.')
    expect(stripCitations('Названы три компании (Источник: news:https://x.ru/a).')).toBe(
      'Названы три компании.',
    )
  })

  it('finds bank document id in evidence_ref or source_url', () => {
    expect(documentIdOf({ evidence_ref: 'bank:abc#p1-c2', source_url: '' })).toBe('abc')
    expect(documentIdOf({ evidence_ref: 'analytics:def#p2', source_url: '' })).toBe('def')
    expect(
      documentIdOf({ evidence_ref: 'x', source_url: '/analytics/documents/ghi/file#page=2' }),
    ).toBe('ghi')
  })
})
