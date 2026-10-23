import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthError, authApi } from '../auth/authApi'
import { useAuth } from '../auth/context'
import { Icon } from '../components/Icons'
import { Button, TextField } from '../components/ui'
import s from './AppLayout.module.css'

interface Form {
  current: string
  next: string
  repeat: string
}

const empty: Form = { current: '', next: '', repeat: '' }

function validate(f: Form) {
  const e: Partial<Record<keyof Form, string>> = {}
  if (!f.current) e.current = 'Введите текущий пароль'
  if (f.next.length < 8) e.next = 'Не менее 8 символов'
  else if (f.next === f.current) e.next = 'Новый пароль совпадает с текущим'
  if (f.repeat !== f.next) e.repeat = 'Пароли не совпадают'
  return e
}

/** Смена пароля из меню профиля. Бэк отзывает все токены — после успеха входим заново */
export function ChangePasswordDialog({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState<Form>(empty)
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({})
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => ref.current?.showModal(), [])

  const set = (key: keyof Form, value: string) => {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const found = validate(form)
    setErrors(found)
    if (Object.keys(found).length || !user) return
    setPending(true)
    setError('')
    try {
      await authApi.changePassword(user.id, form.current, form.next)
      setDone(true)
    } catch (err) {
      setError(
        err instanceof AuthError ? err.message : 'Не удалось сменить пароль, повторите позже',
      )
    } finally {
      setPending(false)
    }
  }

  const relogin = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    // После смены старая сессия уже недействительна — закрыть окно можно только через вход
    <dialog
      ref={ref}
      className={s.dialog}
      aria-labelledby="change-password-title"
      onCancel={(e) => (done ? e.preventDefault() : onClose())}
    >
      <div className={s.dialogHead}>
        <h2 id="change-password-title" className="t-h2">
          {done ? 'Пароль изменён' : 'Смена пароля'}
        </h2>
        {!done && (
          <button type="button" className={s.dialogClose} aria-label="Закрыть" onClick={onClose}>
            <Icon name="close" size={20} />
          </button>
        )}
      </div>
      {done ? (
        <>
          <p className="t-13">Все прежние сессии завершены. Войдите с новым паролем.</p>
          <Button variant="primary" onClick={relogin}>
            Войти заново
          </Button>
        </>
      ) : (
        <form className={s.dialogForm} onSubmit={onSubmit} noValidate>
          <TextField
            label="Текущий пароль"
            type="password"
            autoComplete="current-password"
            value={form.current}
            error={errors.current}
            onChange={(e) => set('current', e.target.value)}
          />
          <TextField
            label="Новый пароль"
            type="password"
            autoComplete="new-password"
            placeholder="Не менее 8 символов"
            maxLength={128}
            value={form.next}
            error={errors.next}
            onChange={(e) => set('next', e.target.value)}
          />
          <TextField
            label="Повторите новый пароль"
            type="password"
            autoComplete="new-password"
            maxLength={128}
            value={form.repeat}
            error={errors.repeat}
            onChange={(e) => set('repeat', e.target.value)}
          />
          {error && (
            <p className="t-12 c-red" role="alert">
              {error}
            </p>
          )}
          <p className="t-12 c-muted">После смены пароля потребуется войти заново.</p>
          <div className={s.dialogActions}>
            <Button type="submit" variant="primary" disabled={pending}>
              {pending ? 'Сохраняем…' : 'Сменить пароль'}
            </Button>
            <Button onClick={onClose}>Отмена</Button>
          </div>
        </form>
      )}
    </dialog>
  )
}
