import { Link } from 'react-router-dom'
import type { NewsEvent } from '../api/newsTypes'
import { useWorkspace } from '../state/context'
import s from '../pages/digest.module.css'
import { cx } from './cx'
import { HeartIcon, SparklesIcon } from './Icons'

/** Карточка события в сводке: метки ранга и релевантности, факт и статус вывода AI */
export function FeedCard({ event, rank }: { event: NewsEvent; rank: number }) {
  const { isSaved, toggleSaved } = useWorkspace()
  const saved = isSaved(event.id)
  const label = `${String(rank).padStart(2, '0')} / ${event.kind === 'risk' ? 'Риск' : 'Возможность'}`
  const to = `/events/${event.id}`

  return (
    <article id={`event-${event.id}`} className={s.card}>
      <div className={s.cardHead}>
        <div className={s.cardTop}>
          <div className={s.chips}>
            <span className={cx(s.chip, s.chipRank)}>{label}</span>
            <span className={s.chip}>{event.relevance}</span>
            <span className={s.chip}>{event.date}</span>
            <span className={s.chip}>{event.relevanceReason}</span>
          </div>
          <button
            type="button"
            className={s.save}
            aria-pressed={saved}
            onClick={() => toggleSaved(event.id)}
          >
            <HeartIcon filled={saved} />
            {saved ? 'Сохранено' : 'Сохранить'}
          </button>
        </div>
        <h3 className={s.cardTitle}>
          <Link to={to}>{event.title}</Link>
        </h3>
      </div>
      <p className={s.cardText}>{event.text}</p>
      <div className={s.origins}>
        <span className={s.origin}>
          <span>
            <b>Факт:</b> {event.sourceTitle}
          </span>
        </span>
        <span className={s.origin} title="Вывод AI">
          <SparklesIcon />
          Не прогноз
        </span>
      </div>
    </article>
  )
}
