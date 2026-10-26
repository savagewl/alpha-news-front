import type { CompanyListItem } from './companyTypes'

/** Название задаётся только при создании компании — у загруженных из CSV его нет */
export const companyTitle = (c: Pick<CompanyListItem, 'id' | 'name'>) =>
  c.name?.trim() || `Компания ${c.id}`

/**
 * Десятичная строка с бэка → «1 234 567,89». Без перевода в number, чтобы не терять точность.
 * Валюта в данных не указана, поэтому её не подставляем.
 */
export function formatDecimal(value: string | null | undefined): string | null {
  if (value === null || value === undefined || value === '') return null
  const [int, frac] = expandExponent(value).split('.')
  const sign = int.startsWith('-') ? '−' : ''
  const digits = int.replace(/^[-+]/, '').replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  const cents = frac?.replace(/0+$/, '').slice(0, 2)
  return `${sign}${digits}${cents ? `,${cents}` : ''}`
}

/** Выручка для карточек: «42,8 млрд ₽», «350 млн ₽»; мелкие суммы — полностью */
export function formatRevenueShort(value: string | null | undefined): string | null {
  const full = formatDecimal(value)
  if (full === null) return null
  const n = Number(value)
  const short = (v: number, unit: string) =>
    `${(Math.round(v * 10) / 10).toString().replace('.', ',')} ${unit} ₽`
  if (Math.abs(n) >= 1e9) return short(n / 1e9, 'млрд')
  if (Math.abs(n) >= 1e6) return short(n / 1e6, 'млн')
  return `${full} ₽`
}

/** Бэк может отдать Decimal в экспоненте («1.2E+5») — сдвигаем запятую в строке */
function expandExponent(value: string): string {
  const m = /^([+-]?)(\d+)(?:\.(\d*))?e([+-]?\d+)$/i.exec(value.trim())
  if (!m) return value
  const [, sign, int, frac = '', exp] = m
  const digits = int + frac
  const point = int.length + Number(exp)
  const whole =
    point <= 0
      ? `0.${'0'.repeat(-point)}${digits}`
      : point >= digits.length
        ? digits + '0'.repeat(point - digits.length)
        : `${digits.slice(0, point)}.${digits.slice(point)}`
  return sign + whole.replace(/^0+(?=\d)/, '')
}

/** 1 строка, 2 строки, 5 строк */
export function plural(n: number, one: string, few: string, many: string) {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few
  return many
}

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('ru-RU', { dateStyle: 'medium', timeStyle: 'short' })

/** «Москва / Московская область» без повторов и пустых частей */
export const place = (c: { city: string | null; region: string | null }) =>
  [c.city, c.region !== c.city ? c.region : null].filter(Boolean).join(' / ') || null
