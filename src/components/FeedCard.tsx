import { Link } from 'react-router-dom'
import { useNewsSources } from '../api/articleHooks'
import { topicLabel } from '../api/articleTypes'
import { formatDate } from '../api/companyFormat'
import type { CompanyNewsItem } from '../api/companyNewsTypes'
import { useWorkspace } from '../state/context'
import s from '../pages/digest.module.css'
import { cx } from './cx'
import { HeartIcon, SparklesIcon } from './Icons'

/** Балл релевантности 0…1 → словесная метка из макета */
const relevanceLevel = (score: number) =>
  score >= 0.7 ? 'Высокая' : score >= 0.4 ? 'Средняя' : 'Низкая'

/** Риск или возможность — только из подтверждённой оценки влияния */
const newsKind = (item: Pick<CompanyNewsItem, 'risks' | 'opportunities'>) =>
  item.risks?.length ? 'Риск' : item.opportunities?.length ? 'Возможность' : null

/** Карточка новости в сводке: ранг, релевантность и её причина, факт и статус оценки AI */
export function FeedCard({ item, rank }: { item: CompanyNewsItem; rank: number }) {
  const { isSaved, toggleSaved } = useWorkspace()
  const { data: sources } = useNewsSources()
  const saved = isSaved(item.id)
  const kind = newsKind(item)
  const label = String(rank).padStart(2, '0') + (kind ? ` / ${kind}` : '')
  const source = sources?.find((x) => x.code === item.source_code)?.name ?? item.source_code
  const assessed = item.assessment_status === 'ready'
  const to = `/events/${item.id}`

  return (
    <article id={`event-${item.id}`} className={s.card}>
      <div className={s.cardHead}>
        <div className={s.cardTop}>
          <div className={s.chips}>
            <span className={cx(s.chip, s.chipRank)}>{label}</span>
            <span className={s.chip}>{relevanceLevel(item.relevance_score)}</span>
            <span className={s.chip}>{formatDate(item.published_at ?? item.first_seen_at)}</span>
            {item.topics.map((t) => (
              <span key={t} className={s.chip}>
                {topicLabel[t] ?? t}
              </span>
            ))}
            {item.relevance_reasons[0] && (
              <span className={s.chip}>{item.relevance_reasons[0]}</span>
            )}
          </div>
          <button
            type="button"
            className={s.save}
            aria-pressed={saved}
            onClick={() => toggleSaved(item.id)}
          >
            <HeartIcon filled={saved} />
            {saved ? 'Сохранено' : 'Сохранить'}
          </button>
        </div>
        <h3 className={s.cardTitle}>
          <Link to={to}>{item.title}</Link>
        </h3>
      </div>
      <p className={s.cardText}>{item.brief_impact || item.summary}</p>
      <div className={s.origins}>
        <span className={s.origin}>
          <span>
            <b>Факт:</b> {source}
          </span>
        </span>
        <span className={s.origin} title="Вывод AI">
          <SparklesIcon />
          {assessed ? 'Влияние оценено AI · не прогноз' : 'Влияние ещё не оценено'}
        </span>
      </div>
    </article>
  )
}
