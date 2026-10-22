import { Link } from 'react-router-dom'
import type { NewsEvent } from '../api/newsTypes'
import { useWorkspace } from '../state/context'
import s from '../pages/pages.module.css'
import { Icon } from './Icons'
import { cx } from './cx'
import { Tag } from './ui'

/** Карточка события в сводке: метка ранга, факт, причина релевантности и происхождение */
export function EventCard({
  event,
  rank,
  isNew,
}: {
  event: NewsEvent
  rank: number
  isNew?: boolean
}) {
  const { isSaved, toggleSaved } = useWorkspace()
  const saved = isSaved(event.id)
  const label = `${String(rank).padStart(2, '0')} / ${event.kind === 'risk' ? 'Риск' : 'Возможность'}`
  const to = `/events/${event.id}`

  return (
    <article id={`event-${event.id}`} className={cx(s.event, isNew && s.eventNew)}>
      <div className={`${s.row} ${s.between}`}>
        <span className={s.row} style={{ gap: 8 }}>
          <Tag variant={event.kind === 'risk' ? 'red' : 'green'}>{label}</Tag>
          {isNew && <Tag variant="dark">Новое</Tag>}
        </span>
        <button
          type="button"
          className={cx(s.save, saved && s.saveActive)}
          aria-pressed={saved}
          onClick={() => toggleSaved(event.id)}
        >
          <Icon name="bookmark" size={14} />
          {saved ? 'Сохранено' : 'Сохранить'}
        </button>
      </div>
      <h3 className="t-h3">
        <Link to={to} className={s.eventTitle}>
          {event.title}
        </Link>
      </h3>
      <p className="t-15">{event.text}</p>
      <p className="t-12 c-green">
        Релевантность: {event.relevance} · {event.relevanceReason}
      </p>
      <p className={s.eventMeta}>
        {event.sourceCode} · {event.sourceTitle} · {event.date}
        {event.bankRef && `  ·  ▤ Есть аналитика банка`}
      </p>
      <Link to={to} className="t-13 t-semibold c-red" style={{ alignSelf: 'flex-start' }}>
        Разобрать влияние →
      </Link>
    </article>
  )
}
