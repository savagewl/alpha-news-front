import { useEffect, useId, useRef, useState, type InputHTMLAttributes, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { Origin } from '../api/newsTypes'
import { cx } from './cx'
import { ArrowUpRightIcon, Icon, type IconName } from './Icons'
import s from './ui.module.css'

export function Panel({
  green,
  className,
  children,
}: {
  green?: boolean
  className?: string
  children: ReactNode
}) {
  return (
    <section className={cx(s.panel, 'appear', green && s.panelGreen, className)}>
      {children}
    </section>
  )
}

export type TagVariant = 'neutral' | 'red' | 'green' | 'dark'

export function Tag({
  variant = 'neutral',
  className,
  children,
}: {
  variant?: TagVariant
  className?: string
  children: ReactNode
}) {
  return <span className={cx(s.tag, s[`tag_${variant}`], className)}>{children}</span>
}

interface ButtonProps {
  variant?: 'primary' | 'secondary'
  to?: string
  type?: 'button' | 'submit'
  disabled?: boolean
  /** Нажатое состояние фильтра-переключателя */
  pressed?: boolean
  className?: string
  title?: string
  onClick?: () => void
  children: ReactNode
}

export function Button({
  variant = 'secondary',
  to,
  type = 'button',
  disabled,
  pressed,
  className,
  title,
  onClick,
  children,
}: ButtonProps) {
  const classes = cx(s.button, s[`button_${variant}`], pressed && s.buttonPressed, className)
  if (to)
    return (
      <Link to={to} className={classes} onClick={onClick}>
        {children}
      </Link>
    )
  return (
    <button
      type={type}
      className={classes}
      disabled={disabled}
      aria-pressed={pressed}
      title={title}
      onClick={onClick}
    >
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

export function BrandKey({
  to,
  label = 'Открыть новостную аналитику',
}: {
  to: string
  label?: string
}) {
  return (
    <Link to={to} className={s.brandKey} aria-label={label} title={label}>
      <ArrowUpRightIcon />
    </Link>
  )
}

const originTag: Record<Origin, { variant: TagVariant; mark: string }> = {
  fact: { variant: 'neutral', mark: '■' },
  bank: { variant: 'green', mark: '▤' },
  ai: { variant: 'red', mark: '✦' },
}

/** Метка происхождения утверждения: факт / аналитика банка / вывод AI */
export function OriginTag({ origin, children }: { origin: Origin; children: ReactNode }) {
  const { variant, mark } = originTag[origin]
  return (
    <Tag variant={variant}>
      {mark} {children}
    </Tag>
  )
}

/** Легенда разметки — показываем над любым экраном, где смешаны факты и выводы */
export function Legend() {
  return (
    <div className={s.legend} aria-label="Обозначения">
      <span className={s.legendFact}>■ Факт</span>
      <Tag variant="green">▤ Аналитика банка</Tag>
      <Tag variant="red">✦ Вывод AI</Tag>
    </div>
  )
}

/** Выпадающее меню: закрывается по клику вне, Escape и выбору пункта */
export function Dropdown({
  trigger,
  label,
  align = 'left',
  className,
  children,
}: {
  trigger: ReactNode
  label: string
  align?: 'left' | 'right'
  className?: string
  children: (close: () => void) => ReactNode
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={ref} className={cx(s.dropdown, className)}>
      <button
        type="button"
        className={s.dropdownTrigger}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((o) => !o)}
      >
        {trigger}
      </button>
      {open && (
        <div className={cx(s.menu, align === 'right' && s.menuRight)} role="menu">
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  )
}

export function MenuItem({
  active,
  hint,
  onSelect,
  children,
}: {
  active?: boolean
  hint?: ReactNode
  onSelect: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      role="menuitemradio"
      aria-checked={!!active}
      className={cx(s.menuItem, active && s.menuItemActive)}
      onClick={onSelect}
    >
      <span>
        {active ? '✓ ' : ''}
        {children}
      </span>
      {hint && <span className={s.menuHint}>{hint}</span>}
    </button>
  )
}

export function Skeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className={s.skeleton} aria-hidden>
      <span className={s.skeletonBar} style={{ width: '45%', height: 24 }} />
      {Array.from({ length: lines - 1 }, (_, i) => (
        <span key={i} className={s.skeletonBar} style={{ width: i % 2 ? '55%' : '100%' }} />
      ))}
      <span className={s.skeletonBlock} />
    </div>
  )
}

export type StateKind = 'loading' | 'empty' | 'error' | 'insufficient'

const stateMeta: Record<StateKind, { icon?: IconName; tag: string }> = {
  loading: { tag: 'Загрузка / скелетон' },
  empty: { icon: 'filter', tag: 'Пустой результат' },
  error: { icon: 'fileX', tag: 'Ошибка источника' },
  insufficient: { icon: 'database', tag: 'Недостаточно данных' },
}

/** Полоса скелетона — заготовка под строку текста, пока ждём ответ */
export function SkeletonBar({
  width = '100%',
  height = 14,
  dark,
}: {
  width?: number | string
  height?: number
  dark?: boolean
}) {
  return (
    <span
      className={cx(s.skeletonBar, dark && s.skeletonDark)}
      style={{ width, height }}
      aria-hidden
    />
  )
}

const lineWidths = ['100%', '92%', '64%', '84%', '48%']

/** Карточка-скелет: повторяет форму будущей карточки, чтобы контент не прыгал при появлении */
export function SkeletonCard({
  lines = 3,
  dark,
  chips,
  className,
}: {
  lines?: number
  dark?: boolean
  /** Ряд коротких меток над заголовком, как у карточек ленты */
  chips?: number
  className?: string
}) {
  return (
    <div className={cx(s.skCard, dark && s.skCardDark, className)} aria-hidden>
      {!!chips && (
        <span className={s.skChips}>
          {Array.from({ length: chips }, (_, i) => (
            <SkeletonBar key={i} width={i ? 72 : 52} height={22} dark={dark} />
          ))}
        </span>
      )}
      <SkeletonBar width="46%" height={22} dark={dark} />
      {Array.from({ length: lines }, (_, i) => (
        <SkeletonBar key={i} width={lineWidths[i % lineWidths.length]} dark={dark} />
      ))}
    </div>
  )
}

/**
 * UI-состояние из макета: причина + следующий шаг. Не смешивается с успешной выдачей,
 * поэтому всегда отдельная карточка, а не текст внутри результата.
 */
export function StateCard({
  kind,
  title,
  text,
  action,
  note,
  tag: tagOverride,
}: {
  kind: StateKind
  /** Своя метка вместо стандартной для этого состояния */
  tag?: string
  title: string
  text: ReactNode
  action?: ReactNode
  note?: ReactNode
}) {
  const { icon } = stateMeta[kind]
  const tag = tagOverride ?? stateMeta[kind].tag
  return (
    <section
      className={cx(s.state, 'appear')}
      role={kind === 'error' ? 'alert' : 'status'}
      aria-busy={kind === 'loading'}
    >
      <div className={s.stateTop}>
        {icon ? <Icon name={icon} size={24} color="var(--c-red)" /> : <Tag>{tag}</Tag>}
        {icon && <Tag>{tag}</Tag>}
      </div>
      <h2 className={s.stateTitle}>{title}</h2>
      <p className={kind === 'loading' ? 't-15 c-muted' : 't-15'}>{text}</p>
      {kind === 'loading' && <Skeleton />}
      {action}
      {note && (
        <>
          <Divider />
          <p className="t-12 c-muted">{note}</p>
        </>
      )}
    </section>
  )
}

/**
 * Бесконечная прокрутка: ставится в конец списка и, как только он подходит к экрану,
 * догружает следующую порцию. После ошибки ждёт «Повторить», с auto=false — кнопку.
 */
export function InfiniteLoader({
  hasMore,
  loading,
  error,
  auto = true,
  onLoad,
}: {
  hasMore: boolean
  loading: boolean
  error?: boolean
  /** false — не грузить самому, показать «Показать ещё» */
  auto?: boolean
  onLoad: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const load = useRef(onLoad)
  useEffect(() => {
    load.current = onLoad
  })

  // наблюдатель пересоздаётся после каждой порции: если низ списка всё ещё в экране,
  // первый же вызов догрузит следующую
  useEffect(() => {
    const el = ref.current
    if (!el || !hasMore || loading || error || !auto) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) load.current()
      },
      { rootMargin: '0px 0px 400px 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [hasMore, loading, error, auto])

  if (!hasMore) return null
  return (
    <div ref={ref} className={s.loader} aria-busy={loading}>
      {loading ? (
        <Skeleton lines={2} />
      ) : error ? (
        <>
          <span className="t-13 c-muted">Не удалось загрузить продолжение.</span>
          <Button onClick={onLoad}>Повторить</Button>
        </>
      ) : (
        !auto && <Button onClick={onLoad}>Показать ещё</Button>
      )}
    </div>
  )
}
