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
  if (kind === 'bank' || kind === 'analytics') return 'Аналитика банка'
  return ref
}

function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}

/** Вид источника по префиксу evidence_ref; материалы банка приходят как «analytics:<id>#<фрагмент>» */
export function refKind(ref: string): 'news' | 'bank' | 'company' | string {
  const kind = ref.split(':')[0]
  return kind === 'analytics' ? 'bank' : kind
}

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

/**
 * id PDF банка у источника: из evidence_ref «bank:<id>#…» / «analytics:<id>#…»
 * или из source_url «/analytics/documents/<id>/file#page=N»
 */
export function documentIdOf(src: Pick<InterpretationSource, 'evidence_ref' | 'source_url'>) {
  return (
    /^(?:bank|analytics):([^#]+)/.exec(src.evidence_ref)?.[1] ??
    /\/analytics\/documents\/([^/]+)\/file/.exec(src.source_url)?.[1] ??
    null
  )
}

/**
 * Служебные ссылки модели в тексте не сопоставлены с источниками — не показываем их:
 * метки [B2] и вставки evidence_ref вида «(company:Отрасль (ОКВЭД 25.11))»
 */
export const stripCitations = (text: string) =>
  text
    .replace(/\s*\[[A-Z]\d+\]/g, '')
    .replace(/\s*\((?:Источники?:\s*)?(?:company|news|bank|analytics):(?:[^()]|\([^()]*\))*\)/g, '')
