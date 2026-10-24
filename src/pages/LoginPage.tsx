import { useState, type FormEvent } from 'react'
import { useAuth } from '../auth/context'
import { AuthError } from '../auth/authApi'
import { Button, Divider, Panel, TextField } from '../components/ui'
import { PageHead } from '../layout/AppLayout'
import a from './auth.module.css'
import s from './pages.module.css'

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

  return (
    <>
      <PageHead
        section={null}
        crumb="Вход"
        title="Вход в Альфа-Бизнес"
        subtitle="Новостная аналитика доступна сотрудникам компании с доступом к интернет-банку"
        tag={null}
      />

      <div className={s.col} style={{ gap: 20 }}>
        <Panel>
          <form className={a.form} onSubmit={onSubmit} noValidate>
            <h2 className="t-h2">Вход по email</h2>
            <p className="t-13">Используйте email и пароль, указанные при регистрации.</p>
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
              Сессия действует 24 часа и хранится только в этом браузере.
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
              После входа — сводка событий, отобранных под вашу компанию, с источниками и позицией
              банка.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
