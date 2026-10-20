import { useId, type InputHTMLAttributes, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRightIcon } from './Icons'
import s from './ui.module.css'

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(' ')

export function Panel({
  green,
  className,
  children,
}: {
  green?: boolean
  className?: string
  children: ReactNode
}) {
  return <section className={cx(s.panel, green && s.panelGreen, className)}>{children}</section>
}

export type TagVariant = 'neutral' | 'red' | 'green'

export function Tag({
  variant = 'neutral',
  children,
}: {
  variant?: TagVariant
  children: ReactNode
}) {
  return <span className={cx(s.tag, s[`tag_${variant}`])}>{children}</span>
}

interface ButtonProps {
  variant?: 'primary' | 'secondary'
  to?: string
  type?: 'button' | 'submit'
  disabled?: boolean
  onClick?: () => void
  children: ReactNode
}

export function Button({
  variant = 'secondary',
  to,
  type = 'button',
  disabled,
  onClick,
  children,
}: ButtonProps) {
  const className = cx(s.button, s[`button_${variant}`])
  if (to)
    return (
      <Link to={to} className={className}>
        {children}
      </Link>
    )
  return (
    <button type={type} className={className} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  )
}

export function Field({ label, value }: { label: ReactNode; value: ReactNode }) {
  return (
    <div className={s.field}>
      <span className={s.fieldLabel}>{label}</span>
      <span className={s.fieldValue}>{value}</span>
    </div>
  )
}

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: ReactNode
  error?: string
}

/** Поле ввода в стиле «Признака»: подпись 12 px сверху, значение 15 px */
export function TextField({ label, error, ...input }: TextFieldProps) {
  const id = useId()
  return (
    <div className={s.field}>
      <label htmlFor={id} className={s.fieldLabel}>
        {label}
      </label>
      <input
        id={id}
        className={cx(s.input, error && s.inputError)}
        aria-invalid={!!error}
        {...input}
      />
      {error && <span className={s.fieldError}>{error}</span>}
    </div>
  )
}

export const Divider = () => <div className={s.divider} />

export function BrandKey({ to }: { to: string }) {
  return (
    <Link to={to} className={s.brandKey} aria-label="Открыть новостную аналитику">
      <ArrowUpRightIcon />
    </Link>
  )
}
