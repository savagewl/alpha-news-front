import { createContext, useContext } from 'react'

export interface WorkspaceData {
  /** Выбранная компания с бэка; пустая строка — компаний у пользователя пока нет */
  companyId: string
  /** Сохранённые новости в виде «компания:новость» — одна новость важна разным компаниям по-разному */
  saved: string[]
  /** Последнее открытое событие — с него открываются «Источники» и «Agent Trace» */
  lastEventId: string | null
  /** Дополнения профиля от пользователя по компаниям — не проверены банком */
  notes: Record<string, string>
}

export interface Workspace extends Omit<WorkspaceData, 'saved'> {
  /** Сохранённые новости выбранной компании */
  saved: string[]
  /** Сколько сохранено по всем компаниям */
  savedTotal: number
  setCompany: (id: string) => void
  toggleSaved: (newsId: string) => void
  isSaved: (newsId: string) => boolean
  openEvent: (eventId: string) => void
  setNote: (companyId: string, note: string) => void
}

export const WorkspaceContext = createContext<Workspace | null>(null)

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) throw new Error('useWorkspace используется вне WorkspaceProvider')
  return ctx
}

export const workspaceKey = (userId: string) => `alpha-news:workspace:${userId}`
