import { describe, expect, it } from 'vitest'
import { companyTitle, formatDecimal, place } from './companyFormat'

describe('companyFormat', () => {
  it('formats decimal strings without float rounding', () => {
    expect(formatDecimal('1234567.50')).toBe('1 234 567,5')
    expect(formatDecimal('98765432109876543210.00')).toBe('98 765 432 109 876 543 210')
    expect(formatDecimal('-1000')).toBe('−1 000')
    expect(formatDecimal(null)).toBeNull()
  })

  it('expands exponent notation from Decimal', () => {
    expect(formatDecimal('1.2E+5')).toBe('120 000')
    expect(formatDecimal('5E+3')).toBe('5 000')
    expect(formatDecimal('1.2345E+2')).toBe('123,45')
    expect(formatDecimal('2.5E-1')).toBe('0,25')
  })

  it('falls back to id when company has no name', () => {
    expect(companyTitle({ id: '001', name: null })).toBe('Компания 001')
    expect(companyTitle({ id: '001', name: 'Вектор' })).toBe('Вектор')
  })

  it('joins city and region without duplicates', () => {
    expect(place({ city: 'Москва', region: 'Москва' })).toBe('Москва')
    expect(place({ city: null, region: null })).toBeNull()
  })
})
