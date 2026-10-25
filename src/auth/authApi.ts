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

// Последний полученный профиль — чтобы сбой сети при проверке сессии не разлогинивал
const USER_KEY = 'alpha-news:user'

const userStorage = {
  get(): User | null {
    try {
      const raw = localStorage.getItem(USER_KEY)
      return raw ? (JSON.parse(raw) as User) : null
    } catch {
      return null
    }
  },
  set(user: User | null) {
    try {
      if (user === null) localStorage.removeItem(USER_KEY)
      else localStorage.setItem(USER_KEY, JSON.stringify(user))
    } catch {
      // хранилище недоступно — без кеша профиля
    }
  },
}

const clearSession = () => {
  tokenStorage.set(null)
  userStorage.set(null)
}

async function profile(token: string): Promise<User> {
  const { sub } = readToken(token)
  if (!sub) throw new AuthError('Сессия повреждена, войдите заново')
  const user = toUser(await api.get<UserResponse>(`/user/${sub}`))
  userStorage.set(user)
  return user
}

const normalizeEmail = (email: string) => email.trim().toLowerCase()

export const authApi = {
  async current(): Promise<User | null> {
    const token = tokenStorage.get()
    if (!token) return null
    const { sub, exp } = readToken(token)
    if (exp && exp * 1000 <= Date.now()) {
      clearSession()
      return null
    }
    try {
      return await profile(token)
    } catch (err) {
      // токен отвергнут или пользователя нет — сессия недействительна
      if (
        err instanceof AuthError ||
        (err instanceof ApiError && [401, 404].includes(err.status))
      ) {
        clearSession()
        return null
      }
      // сеть или 5xx: сессия, скорее всего, жива — входим с последним известным профилем
      const cached = userStorage.get()
      return cached?.id === sub ? cached : null
    }
  },

  async login(email: string, password: string): Promise<User> {
    clearSession()
    try {
      const { access_token } = await api.post<TokenResponse>('/user/login', {
        login: normalizeEmail(email),
        password,
      })
      tokenStorage.set(access_token)
      return await profile(access_token)
    } catch (err) {
      clearSession()
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
    clearSession()
  },
}
