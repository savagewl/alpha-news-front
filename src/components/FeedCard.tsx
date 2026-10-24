import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { useNewsSources } from '../api/articleHooks'
import { topicLabel } from '../api/articleTypes'
import { bankPosition, bankSources, type CardAssessment } from '../api/assessments'
import { formatDate } from '../api/companyFormat'
import { documentIdOf, stripCitations } from '../api/companyNewsFormat'
import type { CompanyNewsItem, InterpretationSource } from '../api/companyNewsTypes'
import { useWorkspace } from '../state/context'
import s from '../pages/digest.module.css'
import { cx } from './cx'
import { HeartIcon, SparklesIcon } from './Icons'
import { OpenPdf } from './OpenPdf'
import { RichText } from './Typewriter'
import { OriginTag, SkeletonBar } from './ui'

/** Балл релевантности 0…1 → словесная метка из макета */
const relevanceLevel = (score: number) =>
  score >= 0.7 ? 'Высокая' : score >= 0.4 ? 'Средняя' : 'Низкая'

/** Риск и/или возможность — только из оценки влияния; бывают одновременно */
const newsKind = (item: Pick<CompanyNewsItem, 'risks' | 'opportunities'>) =>
  [item.risks?.length && 'Риск', item.opportunities?.length && 'Возможность']
    .filter(Boolean)
    .join(' · ') || null

/** Подпись статуса оценки в строке происхождения */
function assessmentLabel(ready: boolean, a: CardAssessment | undefined) {
  if (ready) return 'Влияние оценено AI · не прогноз'
  switch (a?.status) {
    case 'queued':
      return 'В очереди на оценку'
    case 'generating':
      return 'AI оценивает влияние…'
    case 'needs_revision':
      return 'Оценка не прошла проверку'
    case 'insufficient':
      return 'Недостаточно данных'
    case 'failed':
    case 'interrupted':
      return 'Оценка не получена'
    default:
      return 'Влияние ещё не оценено'
  }
}

/** Один PDF на страницу — источники банка часто ссылаются на соседние фрагменты */
function pdfLinks(sources: InterpretationSource[]) {
  const seen = new Set<string>()
  return sources.flatMap((src) => {
    const id = documentIdOf(src)
    const key = `${id}#${src.page_number ?? ''}`
    if (!id || seen.has(key)) return []
    seen.add(key)
    return [{ key, id, page: src.page_number ?? undefined, title: src.title }]
  })
}

/**
 * Карточка новости в сводке: ранг, релевантность и её причина, факт и AI-оценка влияния,
 * которая догружается потоком — с очередью, скелетоном расчёта и итоговыми состояниями.
 */
export function FeedCard({
  item,
  rank,
  assessment: a,
  cardRef,
  onRetry,
}: {
  item: CompanyNewsItem
  rank: number
  assessment?: CardAssessment
  /** Наблюдение за попаданием в экран — видимые карточки без оценки уходят в поток */
  cardRef?: (el: HTMLElement | null) => void
  onRetry?: () => void
}) {
  // задержка появления — по номеру внутри догруженной порции
  const order = { '--i': (rank - 1) % 20 } as CSSProperties
  const { isSaved, toggleSaved } = useWorkspace()
  const { data: sources } = useNewsSources()
  const saved = isSaved(item.id)
  const kind = newsKind(item)
  const label = String(rank).padStart(2, '0') + (kind ? ` / ${kind}` : '')
  const source = sources?.find((x) => x.code === item.source_code)?.name ?? item.source_code
  const ready = item.assessment_status === 'ready'
  const busy = a?.status === 'queued' || a?.status === 'generating'
  const demo = a?.status === 'ready' && a.is_demo
  const bank = bankPosition(item)
  const pdfs = pdfLinks(bankSources(item)).slice(0, 3)
  const to = `/events/${item.id}`

  return (
    <article
      ref={cardRef}
      id={`event-${item.id}`}
      className={cx(s.card, 'appear')}
      style={order}
      aria-busy={busy}
    >
      <div className={s.cardHead}>
        <div className={s.cardTop}>
          <div className={s.chips}>
            <span className={cx(s.chip, s.chipRank)}>{label}</span>
            {demo && <span className={cx(s.chip, s.chipNew)}>Демо-оценка</span>}
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

      <p className={s.cardText}>
        {item.brief_impact ? <RichText text={stripCitations(item.brief_impact)} /> : item.summary}
      </p>

      {a?.status === 'generating' && (
        <div className={s.assessing} aria-hidden>
          <SkeletonBar width="88%" />
          <SkeletonBar width="64%" />
          <SkeletonBar width="40%" />
        </div>
      )}

      {/* [] у оценённой новости — пункты не выделены, это тоже результат: говорим об этом явно */}
      {ready &&
        (item.risks?.length || item.opportunities?.length ? (
          <div className={cx(s.impact, 'appear')}>
            <ImpactList title="△ Риски" items={item.risks ?? []} />
            <ImpactList title="↗ Возможности" items={item.opportunities ?? []} />
          </div>
        ) : (
          <p className={cx(s.impactNone, 'appear')}>Рисков и возможностей не выявлено</p>
        ))}

      {bank && (
        <div className={cx(s.bank, 'appear')}>
          <OriginTag origin="bank">Аналитика банка</OriginTag>
          <p className={s.cardText}>
            <RichText text={stripCitations(bank)} />
          </p>
          {pdfs.length > 0 && (
            <div className={s.origins}>
              {pdfs.map((p) => (
                <OpenPdf
                  key={p.key}
                  documentId={p.id}
                  page={p.page}
                  label={p.page ? `${p.title} · стр. ${p.page}` : p.title}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {a?.status === 'needs_revision' && (
        <p className={s.note}>Оценка не прошла проверку — непроверенный вывод не показан.</p>
      )}
      {a?.status === 'insufficient' && (
        <p className={s.note}>Недостаточно данных, чтобы оценить влияние на компанию.</p>
      )}
      {(a?.status === 'failed' || a?.status === 'interrupted') && (
        <p className="t-13 c-red" role="alert">
          {a.status === 'interrupted'
            ? 'Оценка прервана: соединение оборвалось.'
            : `Не удалось оценить${a.detail ? `: ${a.detail}` : '.'}`}{' '}
          {(a.status === 'interrupted' || a.retryable) && onRetry && (
            <button type="button" className={s.inlineLink} onClick={onRetry}>
              Повторить
            </button>
          )}
        </p>
      )}

      <div className={s.origins}>
        <span className={s.origin}>
          <span>
            <b>Факт:</b> {source}
          </span>
        </span>
        <span className={cx(s.origin, busy && s.pulse)} title="Вывод AI">
          <SparklesIcon />
          {assessmentLabel(ready, a)}
        </span>
      </div>
    </article>
  )
}

function ImpactList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className={s.impactCol}>
      <p className="t-12 t-semibold">{title}</p>
      {items.length ? (
        <ul className={s.impactList}>
          {items.map((x) => (
            <li key={x}>
              <RichText text={x} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="t-12 c-muted">Не выявлено</p>
      )}
    </div>
  )
}
