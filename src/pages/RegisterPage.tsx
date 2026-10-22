import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/context'
import { AuthError } from '../auth/mockAuth'
import { Button, Divider, Panel, Tag, TextField } from '../components/ui'
import { PageHead } from '../layout/AppLayout'
import { companies, roles } from '../mocks/data'
import a from './auth.module.css'
import s from './pages.module.css'

interface FormState {
  name: string
  email: string
  password: string
  repeat: string
  companyId: string
  role: string
  consent: boolean
}

type Errors = Partial<Record<keyof FormState, string>>

const empty: FormState = {
  name: '',
  email: '',
  password: '',
  repeat: '',
  companyId: '',
  role: '',
  consent: false,
}

function validate(f: FormState): Errors {
  const e: Errors = {}
  if (!f.name.trim()) e.name = 'Укажите имя и фамилию'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) e.email = 'Проверьте формат email'
  if (f.password.length < 8) e.password = 'Не менее 8 символов'
  if (f.repeat !== f.password) e.repeat = 'Пароли не совпадают'
  if (!f.companyId) e.companyId = 'Выберите компанию'
  if (!f.role) e.role = 'Выберите роль'
  if (!f.consent) e.consent = 'Нужно подтвердить доступ к интернет-банку'
  return e
}

export default function RegisterPage() {
  const { register } = useAuth()
  const [form, setForm] = useState<FormState>(empty)
  const [errors, setErrors] = useState<Errors>({})
  const [serverError, setServerError] = useState('')
  const [pending, setPending] = useState(false)

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((e) => ({ ...e, [key]: undefined }))
    setServerError('')
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const found = validate(form)
    setErrors(found)
    if (Object.keys(found).length) return
    setPending(true)
    setServerError('')
    try {
      const { name, email, password, companyId, role } = form
      await register({ name, email, password, companyId, role })
    } catch (err) {
      setServerError(
        err instanceof AuthError
          ? err.message
          : 'Не удалось зарегистрироваться. Попробуйте ещё раз',
      )
      setPending(false)
    }
  }

  return (
    <>
      <PageHead
        section={null}
        crumb="Регистрация"
        title="Регистрация пользователя"
        subtitle="Доступ выдаётся человеку, а не компании: у одной компании может быть несколько пользователей с разными ролями."
        tag={null}
      />

      <form className={`${s.split} ${s.split330}`} onSubmit={onSubmit} noValidate>
        <div className={s.col} style={{ gap: 20 }}>
          <Panel>
            <h2 className="t-h2">Данные пользователя</h2>
            <TextField
              label="Имя и фамилия"
              autoComplete="name"
              placeholder="Анна Смирнова"
              value={form.name}
              error={errors.name}
              onChange={(e) => set('name', e.target.value)}
            />
            <TextField
              label="Рабочий email"
              type="email"
              autoComplete="email"
              placeholder="name@company.ru"
              value={form.email}
              error={errors.email}
              onChange={(e) => set('email', e.target.value)}
            />
            <div className={s.grid2}>
              <TextField
                label="Пароль"
                type="password"
                autoComplete="new-password"
                placeholder="Не менее 8 символов"
                value={form.password}
                error={errors.password}
                onChange={(e) => set('password', e.target.value)}
              />
              <TextField
                label="Повторите пароль"
                type="password"
                autoComplete="new-password"
                value={form.repeat}
                error={errors.repeat}
                onChange={(e) => set('repeat', e.target.value)}
              />
            </div>
          </Panel>

          <Panel>
            <h2 className="t-h2">Компания и роль</h2>
            <p className="t-12 c-muted">Компания · 6 профилей из набора данных кейса</p>
            <div className={a.options}>
              {companies.map((c) => {
                const active = form.companyId === c.id
                return (
                  <button
                    key={c.id}
                    type="button"
                    className={`${a.option} ${active ? a.optionActive : ''}`}
                    onClick={() => set('companyId', c.id)}
                  >
                    {active ? '✓ ' : ''}
                    {c.name}
                    <span className={a.optionHint}>
                      ID {c.id} · {c.city}
                    </span>
                  </button>
                )
              })}
            </div>
            {errors.companyId && <p className="t-12 c-red">{errors.companyId}</p>}
            <Divider />
            <p className="t-12 c-muted">Роль</p>
            <div className={a.options}>
              {roles.map((r) => {
                const active = form.role === r
                return (
                  <button
                    key={r}
                    type="button"
                    className={`${a.option} ${active ? a.optionActive : ''}`}
                    onClick={() => set('role', r)}
                  >
                    {active ? `✓ ${r}` : r}
                  </button>
                )
              })}
            </div>
            {errors.role && <p className="t-12 c-red">{errors.role}</p>}
            <p className="t-12 c-muted">
              Роль меняет порядок событий и вопросы к бизнесу, но не расширяет права доступа.
            </p>
          </Panel>

          <Panel>
            <label className={a.consent}>
              <input
                type="checkbox"
                checked={form.consent}
                onChange={(e) => set('consent', e.target.checked)}
              />
              Подтверждаю, что имею доступ к интернет-банку выбранной компании, и согласен на
              обработку данных
            </label>
            {errors.consent && <p className="t-12 c-red">{errors.consent}</p>}
            {serverError && (
              <p className={a.alert} role="alert">
                {serverError}
              </p>
            )}
            <div className={a.actions}>
              <Button variant="primary" type="submit" disabled={pending}>
                {pending ? 'Регистрируем…' : 'Зарегистрироваться →'}
              </Button>
              <span className="t-13">
                Уже есть доступ?{' '}
                <Link to="/login" className={a.link}>
                  Войти
                </Link>
              </span>
            </div>
          </Panel>
        </div>

        <div className={s.aside}>
          <Panel>
            <h2 className="t-h2">Как устроен доступ</h2>
            <Tag variant="red">company_id → user_id → role</Tag>
            <p className="t-13">
              Компания задаёт границу данных, пользователь — принадлежность сессии, роль — порядок
              событий и вопросы. Смена роли не открывает чужую компанию.
            </p>
            <p className="t-13">
              AI объясняет события, но не создаёт и не исполняет платежи — read-only по умолчанию.
            </p>
            <p className="t-12 c-muted">
              Права проверяются до поиска, RAG и выдачи ответа. Запрет по умолчанию.
            </p>
          </Panel>
          <Panel green>
            <h2 className="t-h2">Кто может зарегистрироваться</h2>
            <p className="t-13">
              Собственник, генеральный и финансовый директор, главный бухгалтер, руководитель
              казначейства, другой C-level или иной сотрудник с доступом к интернет-банку.
            </p>
          </Panel>
        </div>
      </form>
    </>
  )
}
