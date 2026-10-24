// Рабочий контекст пользователя: выбранная компания, роль, сохранённые события.
// Хранится в localStorage отдельно для каждого пользователя. Компанию выбирают из списка с бэка.
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useAuth } from '../auth/context'
import {
  WorkspaceContext,
  workspaceKey as key,
  type Workspace,
  type WorkspaceData,
} from './context'

function load(userId: string, fallback: WorkspaceData): WorkspaceData {
  try {
    const raw = localStorage.getItem(key(userId))
    if (!raw) return fallback
    const data = { ...fallback, ...(JSON.parse(raw) as Partial<WorkspaceData>) }
    // отметки моковых событий без компании больше ничему не соответствуют
    return { ...data, saved: data.saved.filter((x) => x.includes(':')) }
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
        companyId: '',
        role: 'Финансовый директор',
        saved: [],
        lastEventId: null,
        notes: {},
      }),
    [userId],
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

  const value = useMemo<Workspace>(() => {
    const prefix = `${data.companyId}:`
    const saved = data.saved.filter((x) => x.startsWith(prefix)).map((x) => x.slice(prefix.length))
    return {
      ...data,
      saved,
      savedTotal: data.saved.length,
      // событие другой компании в контексте новой не имеет смысла — сбрасываем
      setCompany: (companyId) => setData((d) => ({ ...d, companyId, lastEventId: null })),
      setRole: (role) => setData((d) => ({ ...d, role })),
      toggleSaved: (id) =>
        setData((d) => {
          const entry = `${d.companyId}:${id}`
          return {
            ...d,
            saved: d.saved.includes(entry)
              ? d.saved.filter((x) => x !== entry)
              : [...d.saved, entry],
          }
        }),
      isSaved: (id) => saved.includes(id),
      setNote: (companyId, note) =>
        setData((d) => ({ ...d, notes: { ...d.notes, [companyId]: note.trim() } })),
      openEvent: (lastEventId) =>
        setData((d) => (d.lastEventId === lastEventId ? d : { ...d, lastEventId })),
    }
  }, [data])

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}
