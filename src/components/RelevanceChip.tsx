import { useEffect, useId, useRef, useState } from 'react'
import { plural } from '../api/companyFormat'
import s from '../pages/digest.module.css'
import { cx } from './cx'

/**
 * Причины релевантности: бэк присылает несколько («Совпадение подкласса ОКВЭД…», «Региональная
 * связь…», «Семантическое сходство…»). В тег выносим первую, по клику раскрываем все с баллом.
 */
export function RelevanceChip({ reasons, score }: { reasons: string[]; score: number }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)
  const id = useId()

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

  if (reasons.length === 0) return null
  const more = reasons.length - 1

  return (
    <span ref={ref} className={s.reasonWrap}>
      <button
        type="button"
        className={cx(s.chip, s.chipButton, open && s.chipOpen)}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
      >
        {reasons[0]}
        {more > 0 && <span className={s.chipMore}>+{more}</span>}
      </button>
      {open && (
        <div id={id} className={s.reasonPopover} role="dialog" aria-label="Почему новость в сводке">
          <p className={s.reasonHead}>
            Релевантность: {score.toFixed(2)} · {reasons.length}{' '}
            {plural(reasons.length, 'причина', 'причины', 'причин')}
          </p>
          <ul className={s.reasonList}>
            {reasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
      )}
    </span>
  )
}
