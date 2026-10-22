import { createContext, useContext } from 'react'

export interface WorkspaceData {
  companyId: string
  role: string
  saved: string[]
  /** Последнее открытое событие — с него открываются «Источники» и «Agent Trace» */
  lastEventId: string | null
  /** Дополнения профиля от пользователя по компаниям — не проверены банком */
  notes: Record<string, string>
}

export interface Workspace extends WorkspaceData {
  setCompany: (id: string) => void
  setRole: (role: string) => void
  toggleSaved: (eventId: string) => void
  isSaved: (eventId: string) => boolean
  openEvent: (eventId: string) => void
  setNote: (companyId: string, note: string) => void
}

export const WorkspaceContext = createContext<Workspace | null>(null)

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) throw new Error('useWorkspace используется вне WorkspaceProvider')
  return ctx
}
