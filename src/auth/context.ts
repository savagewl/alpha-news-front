import { createContext, useContext } from 'react'
import type { RegisterInput, User } from './authApi'

export interface AuthState {
  user: User | null
  /** true, пока проверяем сохранённую сессию */
  loading: boolean
  login: (email: string, password: string) => Promise<User>
  register: (input: RegisterInput) => Promise<User>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthState | null>(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth используется вне AuthProvider')
  return ctx
}
