import { Link } from 'react-router-dom'
import { useNewsSources } from '../api/articleHooks'
import { topicLabel, type Article } from '../api/articleTypes'
import { formatDate } from '../api/companyFormat'
import { useWorkspace } from '../state/context'
import s from '../pages/pages.module.css'
import { Icon } from './Icons'
import { cx } from './cx'
import { Tag } from './ui'

/** Карточка сохранённой новости: факт из источника и переход к разбору для компании */
export function EventCard({ article }: { article: Article }) {
  const { isSaved, toggleSaved } = useWorkspace()
  const { data: sources } = useNewsSources()
  const saved = isSaved(article.id)
  const source = sources?.find((x) => x.code === article.source_code)?.name ?? article.source_code
  const to = `/events/${article.id}`

  return (
    <article id={`event-${article.id}`} className={s.event}>
      <div className={`${s.row} ${s.between}`}>
        <span className={s.row} style={{ gap: 8 }}>
          {article.topics.map((t) => (
            <Tag key={t}>{topicLabel[t] ?? t}</Tag>
          ))}
        </span>
        <button
          type="button"
          className={cx(s.save, saved && s.saveActive)}
          aria-pressed={saved}
          onClick={() => toggleSaved(article.id)}
        >
          <Icon name="bookmark" size={14} />
          {saved ? 'Сохранено' : 'Сохранить'}
        </button>
      </div>
      <h3 className="t-h3">
        <Link to={to} className={s.eventTitle}>
          {article.title}
        </Link>
      </h3>
      {article.summary && <p className="t-15">{article.summary}</p>}
      <p className={s.eventMeta}>
        {source} · {formatDate(article.published_at ?? article.first_seen_at)}
      </p>
      <Link to={to} className="t-13 t-semibold c-red" style={{ alignSelf: 'flex-start' }}>
        Разобрать влияние →
      </Link>
    </article>
  )
}
