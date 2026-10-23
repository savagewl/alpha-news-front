// Авторизация через бэкенд: POST /user/login отдаёт JWT, профиль — GET /user/{userId}.
// userId в ответе логина нет, поэтому берём его из поля sub токена.
import { ApiError, api, tokenStorage } from '../api/client'

export interface User {
  id: string
  name: string
  email: string
}

export interface RegisterInput {
  name: string
  email: string
  password: string
}

interface UserResponse {
  userId: string
  login: string
  fullName: string | null
}

interface TokenResponse {
  access_token: string
  token_type: string
  expires_in: number
}

export class AuthError extends Error {}

const toUser = (u: UserResponse): User => ({
  id: u.userId,
  name: u.fullName || u.login,
  email: u.login,
})

/** Полезная нагрузка JWT без проверки подписи — её проверяет бэк */
function readToken(token: string): { sub?: string; exp?: number } {
  try {
    const part = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const json = decodeURIComponent(
      [...atob(part)].map((c) => `%${c.charCodeAt(0).toString(16).padStart(2, '0')}`).join(''),
    )
    return JSON.parse(json)
  } catch {
    return {}
  }
}

async function profile(token: string): Promise<User> {
  const { sub } = readToken(token)
  if (!sub) throw new AuthError('Сессия повреждена, войдите заново')
  return toUser(await api.get<UserResponse>(`/user/${sub}`))
}

const normalizeEmail = (email: string) => email.trim().toLowerCase()

export const authApi = {
  async current(): Promise<User | null> {
    const token = tokenStorage.get()
    if (!token) return null
    const { exp } = readToken(token)
    if (exp && exp * 1000 <= Date.now()) {
      tokenStorage.set(null)
      return null
    }
    try {
      return await profile(token)
    } catch {
      tokenStorage.set(null)
      return null
    }
  },

  async login(email: string, password: string): Promise<User> {
    tokenStorage.set(null)
    try {
      const { access_token } = await api.post<TokenResponse>('/user/login', {
        login: normalizeEmail(email),
        password,
      })
      tokenStorage.set(access_token)
      return await profile(access_token)
    } catch (err) {
      tokenStorage.set(null)
      if (err instanceof ApiError && err.status === 401)
        throw new AuthError('Неверный email или пароль')
      if (err instanceof ApiError && err.status === 422)
        throw new AuthError('Проверьте формат email и пароль')
      throw err
    }
  },

  async register({ name, email, password }: RegisterInput): Promise<User> {
    try {
      await api.post<UserResponse>('/user/register', {
        login: normalizeEmail(email),
        password,
        fullName: name.trim() || null,
      })
    } catch (err) {
      if (err instanceof ApiError && err.status === 409)
        throw new AuthError('Пользователь с таким email уже зарегистрирован')
      if (err instanceof ApiError && err.status === 422) throw new AuthError(err.message)
      throw err
    }
    // регистрация не выдаёт токен — сразу входим теми же данными
    return authApi.login(email, password)
  },

  /** После смены пароля бэк отзывает все токены пользователя — нужно войти заново */
  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
    try {
      await api.post<void>('/user/reset-password', { userId, oldPassword, newPassword })
    } catch (err) {
      if (err instanceof ApiError && err.status === 400)
        throw new AuthError('Текущий пароль указан неверно')
      if (err instanceof ApiError && err.status === 422) throw new AuthError(err.message)
      throw err
    }
  },

  async logout(): Promise<void> {
    tokenStorage.set(null)
  },
}
