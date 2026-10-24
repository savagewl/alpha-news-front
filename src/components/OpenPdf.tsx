import { useState } from 'react'
import { openDocument } from '../api/companyNewsHooks'
import s from '../pages/digest.module.css'
import { Icon } from './Icons'

/** PDF открывается только с токеном — скачиваем и показываем во вкладке */
export function OpenPdf({
  documentId,
  page,
  label,
}: {
  documentId: string
  page?: number
  /** Своя подпись вместо «Открыть PDF · стр. N» */
  label?: string
}) {
  const [state, setState] = useState<'idle' | 'loading' | 'error'>('idle')
  const open = () => {
    setState('loading')
    openDocument(documentId, page).then(
      () => setState('idle'),
      () => setState('error'),
    )
  }
  return (
    <button type="button" className={s.origin} onClick={open} disabled={state === 'loading'}>
      {state === 'loading'
        ? 'Открываем PDF…'
        : state === 'error'
          ? 'Не открылось — ещё раз'
          : (label ?? (page ? `Открыть PDF · стр. ${page}` : 'Открыть PDF'))}
      <Icon name="arrowUpRight" size={14} strokeWidth={2} />
    </button>
  )
}
