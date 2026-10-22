import { useState, type FormEvent } from 'react'
import { useAuth } from '../auth/context'
import { AuthError, TEST_PASSWORD, testAccounts } from '../auth/mockAuth'
import { Button, Divider, Panel, TextField } from '../components/ui'
import { PageHead } from '../layout/AppLayout'
import a from './auth.module.css'
import s from './pages.module.css'

const nextSteps = [
  '1. Главная Альфа-Бизнеса и постоянная точка входа',
  '2. Выбор компании и роли',
  '3. Персональная сводка и разбор событий',
]

export default function LoginPage() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password) {
      setError('Введите email и пароль')
      return
    }
    setPending(true)
    setError('')
    try {
      // после успешного входа GuestOnly сам уведёт на нужную страницу
      await login(email, password)
    } catch (err) {
      setError(err instanceof AuthError ? err.message : 'Не удалось войти. Попробуйте ещё раз')
      setPending(false)
    }
  }

  const fillTestAccount = (testEmail: string) => {
    setEmail(testEmail)
    setPassword(TEST_PASSWORD)
    setError('')
  }

  return (
    <>
      <PageHead
        section={null}
        crumb="Вход"
        title="Вход в Альфа-Бизнес"
        subtitle="Новостная аналитика доступна сотрудникам компании с доступом к интернет-банку"
        tag={null}
      />

      <div className={`${s.split} ${s.split330}`}>
        <div className={s.col} style={{ gap: 20 }}>
          <Panel>
            <form className={a.form} onSubmit={onSubmit} noValidate>
              <h2 className="t-h2">Вход по email</h2>
              <p className="t-13">
                Используйте учётную запись, выданную администратором компании, или одну из тестовых
                записей справа.
              </p>
              <TextField
                label="Email"
                type="email"
                autoComplete="username"
                placeholder="name@company.ru"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <TextField
                label="Пароль"
                type="password"
                autoComplete="current-password"
                placeholder="Не менее 8 символов"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {error && (
                <p className={a.alert} role="alert">
                  {error}
                </p>
              )}
              <div className={a.actions}>
                <Button variant="primary" type="submit" disabled={pending}>
                  {pending ? 'Входим…' : 'Войти →'}
                </Button>
                <Button to="/register">Регистрация</Button>
              </div>
              <Divider />
              <p className="t-12 c-muted">
                Сессия хранится только в этом браузере. Тестовые записи не являются реальными
                учётными данными банка.
              </p>
            </form>
          </Panel>

          <div className={s.lime}>
            <div className={s.col} style={{ gap: 12 }}>
              <p className={s.eyebrow}>АЛЬФА БУДУЩЕЕ / FINANCIAL INTELLIGENCE</p>
              <h2 className={s.limeTitle}>
                Не просто новости.
                <br />
                Контекст для ваших решений.
              </h2>
              <p className="t-15">
                После входа — сводка событий, отобранных под вашу компанию и роль, с источниками и
                позицией банка.
              </p>
            </div>
          </div>
        </div>

        <div className={s.aside}>
          <Panel>
            <h2 className="t-h2">Тестовые учётные записи</h2>
            <p className="t-13">
              Для проверки сквозного сценария. Пароль для всех: <b>{TEST_PASSWORD}</b>
            </p>
            <div className={a.accounts}>
              {testAccounts.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  className={`${a.option} ${email === u.email ? a.optionActive : ''}`}
                  onClick={() => fillTestAccount(u.email)}
                >
                  {email === u.email ? '✓ ' : ''}
                  {u.companyId} / {u.role}
                  <span className={a.optionHint}>{u.email}</span>
                </button>
              ))}
            </div>
            <p className="t-12 c-muted">Нажмите на запись, чтобы подставить email и пароль.</p>
          </Panel>
          <Panel green>
            <h2 className="t-h2">Что дальше</h2>
            {nextSteps.map((step) => (
              <p key={step} className="t-13">
                {step}
              </p>
            ))}
          </Panel>
        </div>
      </div>
    </>
  )
}
