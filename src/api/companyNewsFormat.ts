import type { ClaimKind, InterpretationSource } from './companyNewsTypes'
import type { Origin } from './newsTypes'

/** Тип утверждения бэка → метка происхождения в UI (критерий ТЗ 03) */
export const originOf: Record<ClaimKind, Origin> = {
  fact: 'fact',
  bank_position: 'bank',
  ai_inference: 'ai',
}

export const originLabel: Record<Origin, string> = {
  fact: 'Факт',
  bank: 'Аналитика банка',
  ai: 'Вывод AI',
}

/** «news:https://…» → заголовок источника, «company:Отрасль» → «Профиль: Отрасль» */
export function refLabel(ref: string, sources: InterpretationSource[] = []): string {
  const known = sources.find((s) => s.evidence_ref === ref)
  if (known) return known.title
  const [kind, ...rest] = ref.split(':')
  const value = rest.join(':')
  if (kind === 'company') return `Профиль: ${value}`
  if (kind === 'news') return hostOf(value) ?? value
  if (kind === 'bank') return `Банк: ${value}`
  return ref
}

function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}

/** Вид источника по префиксу evidence_ref */
export const refKind = (ref: string) => ref.split(':')[0] as 'news' | 'bank' | 'company' | string

const stepTitles: Record<string, string> = {
  analyst: 'Аналитик: черновик разбора',
  verifier: 'Верификатор: проверка доказательств',
  revise: 'Доработка по замечаниям',
}

export const stepTitle = (step: string) => stepTitles[step] ?? step

export const stepShort = (step: string) =>
  ({ analyst: 'Анализ', verifier: 'Проверка', revise: 'Доработка' })[step] ?? step

export type StepState = 'done' | 'retry' | 'warn'

/** ok / APPROVED — шаг пройден, REVISE — вернули на доработку, остальное — ограничение */
export function stepState(status: string): StepState {
  const s = status.toLowerCase()
  if (s === 'ok' || s === 'approved' || s === 'done') return 'done'
  if (s === 'revise') return 'retry'
  return 'warn'
}

export const verificationLabel = {
  APPROVED: 'Вывод подтверждён верификатором',
  REVISE: 'Верификатор вернул вывод на доработку',
  INSUFFICIENT: 'Доказательств недостаточно для вывода',
} as const
