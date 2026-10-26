import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { companyTitle, formatDecimal } from '../api/companyFormat'
import type { CompanyListItem } from '../api/companyTypes'
import { Icon } from '../components/Icons'
import { cx } from '../components/cx'
import s from './AppLayout.module.css'

const CLOSE_MS = 180

const revenue = (value: string | null) => {
  const formatted = formatDecimal(value)
  return formatted && `${formatted} ₽`
}

/** Выбор компании попапом: карточки колонками, прокручивается только список внутри */
export function CompanyPickerDialog({
  items,
  currentId,
  onSelect,
  onClose,
}: {
  items: CompanyListItem[]
  currentId: string
  onSelect: (id: string) => void
  onClose: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const navigate = useNavigate()
  const [closing, setClosing] = useState(false)

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
        {items.length === 0 ? (
          <p className={s.menuNote}>У вас пока нет компаний.</p>
        ) : (
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
