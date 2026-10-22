// Рабочий контекст пользователя: выбранная компания, роль, сохранённые события.
// Хранится в localStorage отдельно для каждого пользователя; при входе берётся из учётной записи.
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useAuth } from '../auth/context'
import { WorkspaceContext, type Workspace, type WorkspaceData } from './context'

const key = (userId: string) => `alpha-news:workspace:${userId}`

function load(userId: string, fallback: WorkspaceData): WorkspaceData {
  try {
    const raw = localStorage.getItem(key(userId))
    return raw ? { ...fallback, ...(JSON.parse(raw) as Partial<WorkspaceData>) } : fallback
  } catch {
    return fallback
  }
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const userId = user?.id ?? 'guest'
  const initial = useCallback(
    (): WorkspaceData =>
      load(userId, {
        companyId: user?.companyId ?? 'U001',
        role: user?.role ?? 'Финансовый директор',
        saved: [],
        lastEventId: null,
        notes: {},
      }),
    [userId, user?.companyId, user?.role],
  )
  const [data, setData] = useState<WorkspaceData>(initial)
  const [owner, setOwner] = useState(userId)

  // сменился пользователь — подхватываем его контекст (паттерн «состояние от пропсов» без эффекта)
  if (owner !== userId) {
    setOwner(userId)
    setData(initial())
  }

  useEffect(() => {
    try {
      localStorage.setItem(key(userId), JSON.stringify(data))
    } catch {
      // хранилище недоступно — контекст проживёт до перезагрузки
    }
  }, [userId, data])

  const value = useMemo<Workspace>(
    () => ({
      ...data,
      // событие другой компании в контексте новой не имеет смысла — сбрасываем
      setCompany: (companyId) => setData((d) => ({ ...d, companyId, lastEventId: null })),
      setRole: (role) => setData((d) => ({ ...d, role })),
      toggleSaved: (id) =>
        setData((d) => ({
          ...d,
          saved: d.saved.includes(id) ? d.saved.filter((x) => x !== id) : [...d.saved, id],
        })),
      isSaved: (id) => data.saved.includes(id),
      setNote: (companyId, note) =>
        setData((d) => ({ ...d, notes: { ...d.notes, [companyId]: note.trim() } })),
      openEvent: (lastEventId) =>
        setData((d) => (d.lastEventId === lastEventId ? d : { ...d, lastEventId })),
    }),
    [data],
  )

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}
