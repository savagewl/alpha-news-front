import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { companyTitle, formatDecimal } from '../api/companyFormat'
import { flatPages, loaderProps, useCompaniesInfinite } from '../api/companyHooks'
import { Icon } from '../components/Icons'
import { InfiniteLoader, Skeleton } from '../components/ui'
import { cx } from '../components/cx'
import s from './AppLayout.module.css'

const CLOSE_MS = 180
/** Сколько компаний подгружается за раз */
const PAGE = 30

const revenue = (value: string | null) => {
  const formatted = formatDecimal(value)
  return formatted && `${formatted} ₽`
}

/** Выбор компании попапом: карточки колонками, прокручивается только список внутри */
export function CompanyPickerDialog({
  currentId,
  onSelect,
  onClose,
}: {
  currentId: string
  onSelect: (id: string) => void
  onClose: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const navigate = useNavigate()
  const [closing, setClosing] = useState(false)
  const list = useCompaniesInfinite({ limit: PAGE })
  const data = flatPages(list.data)
  const items = data?.items ?? []

  useEffect(() => {
    ref.current?.showModal()
    const html = document.documentElement
    const prev = [html.style.overflow, document.body.style.overflow]
    html.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    return () => {
      html.style.overflow = prev[0]
      document.body.style.overflow = prev[1]
    }
  }, [])

  const close = (after?: () => void) => {
    setClosing(true)
    window.setTimeout(() => {
      onClose()
      after?.()
    }, CLOSE_MS)
  }

  return (
    <dialog
      ref={ref}
      className={cx(s.picker, closing && s.pickerClosing)}
      aria-labelledby="company-picker-title"
      onCancel={(e) => {
        e.preventDefault()
        close()
      }}
      onClick={(e) => e.target === ref.current && close()}
    >
      <div className={s.pickerHead}>
        <h2 id="company-picker-title" className="t-h2">
          Выберите компанию
        </h2>
        <button
          type="button"
          className={s.dialogClose}
          aria-label="Закрыть"
          onClick={() => close()}
        >
          <Icon name="close" size={20} />
        </button>
      </div>
      <div className={s.pickerBody}>
        {list.isLoading && <Skeleton lines={4} />}
        {list.isError && !data && (
          <p className={s.menuNote}>Не удалось загрузить компании. Закройте окно и повторите.</p>
        )}
        {data && items.length === 0 && <p className={s.menuNote}>У вас пока нет компаний.</p>}
        {items.length > 0 && (
          <div className={s.pickerGrid}>
            {items.map((c) => (
              <button
                key={c.id}
                type="button"
                className={cx(s.pickerCard, c.id === currentId && s.pickerCardActive)}
                aria-pressed={c.id === currentId}
                onClick={() => close(() => onSelect(c.id))}
              >
                <span className={s.pickerTitle}>
                  {c.id === currentId && <span aria-hidden="true">✓</span>}
                  {companyTitle(c)}
                </span>
                <span className={s.pickerHint}>
                  {[c.id, c.okved_name, revenue(c.annual_revenue)].filter(Boolean).join(' · ')}
                </span>
              </button>
            ))}
          </div>
        )}
        <InfiniteLoader {...loaderProps(list)} />
        {data && data.total > 0 && (
          <p className={s.pickerCount}>
            Показано {items.length} из {data.total.toLocaleString('ru-RU')}
          </p>
        )}
      </div>
      <button
        type="button"
        className={s.pickerAll}
        onClick={() => close(() => navigate('/companies'))}
      >
        Все компании и загрузка CSV →
      </button>
    </dialog>
  )
}
