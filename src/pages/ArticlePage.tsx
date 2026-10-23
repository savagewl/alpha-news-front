import { useParams } from 'react-router-dom'
import { useArticle, useNewsSources } from '../api/articleHooks'
import { topicLabel } from '../api/articleTypes'
import { ApiError } from '../api/client'
import { formatDate } from '../api/companyFormat'
import { Icon } from '../components/Icons'
import { Button, Field, Panel, StateCard, Tag } from '../components/ui'
import { PageHead } from '../layout/AppLayout'
import s from './pages.module.css'

/** Публикация из общего корпуса новостей: факт из первоисточника, без выводов */
export default function ArticlePage() {
  const { articleId = '' } = useParams()
  const article = useArticle(articleId)
  const { data: sources } = useNewsSources()

  if (article.isPending)
    return (
      <>
        <PageHead crumb="Публикация" title="Загрузка…" subtitle="" />
        <StateCard
          kind="loading"
          title="Загружаем публикацию"
          text="Получаем текст и метаданные из источника."
        />
      </>
    )

  if (article.isError) {
    const missing = article.error instanceof ApiError && article.error.status === 404
    return (
      <>
        <PageHead crumb="Публикация" title="Публикация недоступна" subtitle="" />
        <StateCard
          kind={missing ? 'empty' : 'error'}
          title={missing ? 'Публикация не найдена' : 'Не удалось загрузить публикацию'}
          text={
            missing
              ? 'Возможно, источник удалил материал или ссылка устарела.'
              : 'Сервис новостей временно недоступен. Повторите попытку позже.'
          }
          action={
            missing ? (
              <Button to="/digest">К сводке</Button>
            ) : (
              <Button onClick={() => article.refetch()}>Повторить загрузку</Button>
            )
          }
        />
      </>
    )
  }

  const a = article.data
  const source = sources?.find((x) => x.code === a.source_code)
  const sourceName = source?.name ?? a.source_code
  const published = a.published_at ? formatDate(a.published_at) : null

  return (
    <>
      <PageHead
        crumb="Публикация"
        title={a.title}
        subtitle={[sourceName, published].filter(Boolean).join(' · ')}
      >
        <div className={s.row}>
          <Tag>■ Факт из первоисточника</Tag>
          {a.topics.map((t) => (
            <Tag key={t}>{topicLabel[t]}</Tag>
          ))}
        </div>
      </PageHead>

      <div className={s.split}>
        <Panel>
          {a.summary && <p className="t-15 t-semibold">{a.summary}</p>}
          {a.content_text ? (
            a.content_text.split(/\n{2,}/).map((p, i) => (
              <p key={i} className="t-15">
                {p}
              </p>
            ))
          ) : (
            <p className="t-13 c-muted">
              Источник не передаёт полный текст — прочитайте материал на сайте издания.
            </p>
          )}
          <a className={s.externalLink} href={a.original_url} target="_blank" rel="noreferrer">
            Открыть первоисточник
            <Icon name="arrowUpRight" size={14} strokeWidth={2} />
          </a>
        </Panel>

        <div className={s.aside}>
          <Panel>
            <h2 className="t-h2">О публикации</h2>
            <Field
              label="Источник"
              value={
                source ? (
                  <a href={source.site_url} target="_blank" rel="noreferrer">
                    {source.name}
                  </a>
                ) : (
                  sourceName
                )
              }
            />
            {published && <Field label="Опубликовано" value={published} />}
            <Field label="Найдено сервисом" value={formatDate(a.first_seen_at)} />
            {a.authors.length > 0 && <Field label="Авторы" value={a.authors.join(', ')} />}
            {a.source_categories.length > 0 && (
              <Field label="Рубрики источника" value={a.source_categories.join(' · ')} />
            )}
          </Panel>
          <Panel>
            <h2 className="t-h2">Что не сделано</h2>
            <p className="t-13">
              Публикация ещё не прошла отбор под компанию: релевантность, влияние и позиция банка по
              ней не оценивались.
            </p>
          </Panel>
        </div>
      </div>
    </>
  )
}
