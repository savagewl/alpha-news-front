import { Link } from 'react-router-dom'
import { useNewsSources } from '../api/articleHooks'
import { topicLabel, type Article } from '../api/articleTypes'
import { formatDate } from '../api/companyFormat'
import s from '../pages/digest.module.css'
import { cx } from './cx'
import { Icon } from './Icons'

/** Свежая публикация из RSS в ленте сводки: без ранга и релевантности — их даёт только отбор */
export function ArticleCard({ article }: { article: Article }) {
  const { data: sources } = useNewsSources()
  const source = sources?.find((x) => x.code === article.source_code)?.name ?? article.source_code
  const date = article.published_at ?? article.first_seen_at

  return (
    <article id={`article-${article.id}`} className={cx(s.card, s.cardNew)}>
      <div className={s.cardHead}>
        <div className={s.chips}>
          <span className={cx(s.chip, s.chipNew)}>Новое</span>
          <span className={s.chip}>{source}</span>
          <span className={s.chip}>{formatDate(date)}</span>
          {article.topics.map((t) => (
            <span key={t} className={s.chip}>
              {topicLabel[t]}
            </span>
          ))}
          <span className={s.chip}>Без оценки релевантности</span>
        </div>
        <h3 className={s.cardTitle}>
          <Link to={`/articles/${article.id}`}>{article.title}</Link>
        </h3>
      </div>
      {article.summary && <p className={s.cardText}>{article.summary}</p>}
      <div className={s.origins}>
        <span className={s.origin}>
          <span>
            <b>Факт:</b> {source}
          </span>
        </span>
        <a className={s.origin} href={article.original_url} target="_blank" rel="noreferrer">
          Первоисточник
          <Icon name="arrowUpRight" size={14} strokeWidth={2} />
        </a>
      </div>
    </article>
  )
}
