// Мок-авторизация стенда: пользователи и сессия хранятся в localStorage этого браузера.
// Функции асинхронные и повторяют будущий API — при появлении бэкенда меняется только этот файл.
// Пароли лежат открытым текстом: это допустимо только для тестовых записей.

export interface User {
  id: string
  name: string
  email: string
  companyId: string
  role: string
}

interface StoredUser extends User {
  password: string
}

export interface RegisterInput {
  name: string
  email: string
  password: string
  companyId: string
  role: string
}

export const TEST_PASSWORD = 'alfa2026'

/** Тестовые учётные записи для сквозного сценария (требование ТЗ к сдаче) */
export const testAccounts: User[] = [
  {
    id: 'test-cfo',
    name: 'Финансовый директор · U001',
    email: 'cfo@vector.ru',
    companyId: 'U001',
    role: 'Финансовый директор',
  },
  {
    id: 'test-treasury',
    name: 'Руководитель казначейства · U002',
    email: 'treasury@sever.ru',
    companyId: 'U002',
    role: 'Руководитель казначейства',
  },
  {
    id: 'test-ceo',
    name: 'Генеральный директор · U003',
    email: 'ceo@aurum.ru',
    companyId: 'U003',
    role: 'Генеральный директор',
  },
]

const USERS_KEY = 'alpha-news:users'
const SESSION_KEY = 'alpha-news:session'

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function write(key: string, value: unknown) {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // хранилище недоступно (приватный режим) — сессия проживёт до перезагрузки
  }
}

function allUsers(): StoredUser[] {
  const registered = read<StoredUser[]>(USERS_KEY, [])
  return [...testAccounts.map((u) => ({ ...u, password: TEST_PASSWORD })), ...registered]
}

const strip = ({ id, name, email, companyId, role }: StoredUser): User => ({
  id,
  name,
  email,
  companyId,
  role,
})

const normalizeEmail = (email: string) => email.trim().toLowerCase()

export class AuthError extends Error {}

export const authApi = {
  async current(): Promise<User | null> {
    const id = read<string | null>(SESSION_KEY, null)
    const user = allUsers().find((u) => u.id === id)
    return user ? strip(user) : null
  },

  async login(email: string, password: string): Promise<User> {
    const user = allUsers().find((u) => u.email === normalizeEmail(email))
    if (!user || user.password !== password) throw new AuthError('Неверный email или пароль')
    write(SESSION_KEY, user.id)
    return strip(user)
  },

  async register(input: RegisterInput): Promise<User> {
    const email = normalizeEmail(input.email)
    if (allUsers().some((u) => u.email === email))
      throw new AuthError('Пользователь с таким email уже зарегистрирован')
    const user: StoredUser = { ...input, email, name: input.name.trim(), id: crypto.randomUUID() }
    write(USERS_KEY, [...read<StoredUser[]>(USERS_KEY, []), user])
    write(SESSION_KEY, user.id)
    return strip(user)
  },

  async logout(): Promise<void> {
    write(SESSION_KEY, null)
  },
}
