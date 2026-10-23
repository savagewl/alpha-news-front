import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { setUnauthorizedHandler } from '../api/client'
import { seedWorkspace } from '../state/context'
import { authApi, type User } from './authApi'
import { AuthContext, useAuth, type AuthState } from './context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    authApi
      .current()
      .then(setUser)
      .finally(() => setLoading(false))
  }, [])

  // бэк отверг токен — выходим, RequireAuth отправит на страницу входа
  useEffect(() => {
    setUnauthorizedHandler(() => {
      void authApi.logout()
      setUser(null)
      queryClient.clear()
    })
    return () => setUnauthorizedHandler(null)
  }, [queryClient])

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,
      login: async (email, password) => {
        const u = await authApi.login(email, password)
        setUser(u)
        return u
      },
      register: async ({ role, ...input }) => {
        const u = await authApi.register(input)
        // роли на бэке нет — выбор из формы кладём в локальный контекст пользователя
        seedWorkspace(u.id, { role })
        setUser(u)
        return u
      },
      logout: async () => {
        await authApi.logout()
        setUser(null)
        queryClient.clear()
      },
    }),
    [user, loading, queryClient],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/** Закрытые разделы: без сессии отправляем на вход и помним, куда шли */
export function RequireAuth() {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <Outlet />
}

/**
 * Вход и регистрация: авторизованного пользователя ведём туда, откуда его отправили на вход,
 * иначе на главную. После регистрации — к компаниям: у нового пользователя их ещё нет.
 */
export function GuestOnly() {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return null
  if (user) {
    const from = (location.state as { from?: string } | null)?.from
    const fallback = location.pathname === '/register' ? '/companies' : '/'
    return <Navigate to={from ?? fallback} replace />
  }
  return <Outlet />
}
