import { createContext, useContext } from 'react'
import type { LiveInterpretation } from '../api/interpretationStream'

/** Интерпретация текущей новости — её держит EventGuard, экраны события только читают */
export const EventInterpretationContext = createContext<LiveInterpretation | null>(null)

export function useEventInterpretation() {
  const ctx = useContext(EventInterpretationContext)
  if (!ctx) throw new Error('useEventInterpretation используется вне EventGuard')
  return ctx
}
