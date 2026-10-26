import { useEffect, type CSSProperties, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useArticle, useNewsSources } from '../api/articleHooks'
import { useCompany } from '../api/companyHooks'
import { formatDate, formatRevenueShort } from '../api/companyFormat'
import { refLabel, verificationLabel } from '../api/companyNewsFormat'
import type { InsightDraft, InterpretationSource, Verification } from '../api/companyNewsTypes'
import { stageLabel } from '../api/interpretationStream'
import type { Origin } from '../api/newsTypes'
import type { Company } from '../api/companyTypes'
import { Feedback } from '../components/Feedback'
import { HeartIcon, Icon, LampIcon, SparklesIcon } from '../components/Icons'
import { RichText } from '../components/Typewriter'
import { Button, Panel, StateCard, Tag } from '../components/ui'
import { PageHead } from '../layout/AppLayout'
import { useWorkspace } from '../state/context'
import { useEventInterpretation } from './eventContext'
import { EventGuard } from './EventGuard'
import h from './digest.module.css'
import s from './pages.module.css'

export default function EventPage() {
  const { eventId = '' } = useParams()
  return (
    <EventGuard eventId={eventId} crumb="Интерпретация" allowDraft>
      <Interpretation eventId={eventId} />
    </EventGuard>
  )
}

function Interpretation({ eventId }: { eventId: string }) {
  const { companyId, openEvent, isSaved, toggleSaved } = useWorkspace()
  // итог или, пока его нет, черновик, который сейчас пишется
  const { result: data, draft, stage } = useEventInterpretation()
  const { data: article } = useArticle(eventId)
  const { data: newsSources } = useNewsSources()
  const { data: company } = useCompany(companyId)

  useEffect(() => openEvent(eventId), [eventId, openEvent])

  const insight: InsightDraft | null | undefined = data ? data.interpretation : draft?.draft
  if (!data && !insight) return null
  const saved = isSaved(eventId)
  const sourceName =
    article &&
    (newsSources?.find((x) => x.code === article.source_code)?.name ?? article.source_code)
  const date = article && formatDate(article.published_at ?? article.first_seen_at)
  const saveButton = (
    <button
      type="button"
      className={h.save}
      aria-pressed={saved}
      onClick={() => toggleSaved(eventId)}
    >
      <HeartIcon filled={saved} />
      {saved ? 'Сохранено' : 'Сохранить'}
    </button>
  )

  return (
    <>
      <PageHead
        crumb="Интерпретация"
        title={insight?.headline || article?.title || 'Разбор события'}
        subtitle={[companyId, date, sourceName].filter(Boolean).join(' · ')}
      >
        <div className={s.row}>
          {!!insight?.risks?.length && <Tag variant="red">Риск</Tag>}
          {!!insight?.opportunities?.length && <Tag variant="green">Возможность</Tag>}
          {data?.verification && (
            <Tag variant={data.verification.status === 'APPROVED' ? 'green' : 'neutral'}>
              {verificationLabel[data.verification.status]}
            </Tag>
          )}
          {data?.is_demo && <Tag>Демо-ответ</Tag>}
          {!data && <Tag variant="dark">Формируется · предварительный результат</Tag>}
        </div>
        {!insight?.ai_interpretation && saveButton}
      </PageHead>

      {!data && (
        <p className={`${h.stage} t-13`} role="status">
          <span className={h.stageDot} aria-hidden />
          {stage ? stageLabel[stage] : 'Проверяем черновик'}… Текст может измениться после проверки
          {draft && draft.revision_version > 0 && ` · доработка ${draft.revision_version}`}
        </p>
      )}

      {insight?.ai_interpretation && (
        <section className={h.eventHero}>
          <div className={h.heroHead}>
            <span className={h.heroTag}>AI · Главное для компании</span>
            <h2 className={h.heroTitle}>
              <RichText text={firstSentence(insight.ai_interpretation)} />
            </h2>
          </div>
          {saveButton}
        </section>
      )}

      <div className={s.split}>
        <div className={h.events}>
          {insight ? (
            <Blocks
              insight={insight}
              sources={data?.sources ?? []}
              verification={data?.verification ?? null}
              draft={!data}
            />
          ) : (
            data && (
              <StateCard
                kind="insufficient"
                title="Для полного разбора не хватает данных"
                text={
                  data.status === 'insufficient'
                    ? 'Подтверждённых доказательств недостаточно — непроверенный вывод не публикуется.'
                    : 'Черновик разбора не прошёл проверку верификатором и не публикуется.'
                }
                note={
                  [
                    ...(data.verification?.remarks ?? []),
                    ...(data.verification?.missing_evidence ?? []),
                  ].join(' · ') || undefined
                }
                action={
                  <div className={s.row}>
                    {article && (
                      <Button variant="primary" to={`/articles/${eventId}`}>
                        Открыть публикацию →
                      </Button>
                    )}
                    <Button to="/profile">Уточнить профиль</Button>
                  </div>
                }
              />
            )
          )}

          <Feedback key={eventId} question="Разбор полезен для вашего решения?" />
        </div>

        <div className={s.aside}>
          <Panel>
            <h2 className="t-h2">Контекст решения</h2>
            <Tag>{companyId}</Tag>
            <p className={h.contextText}>
              {[
                formatRevenueShort(company?.annual_revenue),
                company?.okved_name,
                company?.group_id,
                products(company),
              ]
                .filter(Boolean)
                .join(' · ') || `Разбор построен по профилю ${companyId}.`}
            </p>
            {data && (
              <p className="t-12 c-muted">
                Модель: {data.model}
                {data.generated_at && ` · ${formatDate(data.generated_at)}`}
              </p>
            )}
            <Link to="/profile" className={h.actionBtn}>
              Профиль компании
            </Link>
          </Panel>
          {(!!insight?.limitations?.length || !!data?.warnings?.length) && (
            <Panel>
              <h2 className="t-h2">Границы вывода</h2>
              {insight?.limitations?.map((l) => (
                <p key={l} className={h.contextText}>
                  {l}
                </p>
              ))}
              {data?.warnings?.map((w) => (
                <p key={w} className="t-12 c-muted">
                  {w}
                </p>
              ))}
              <span className={h.unconfirmedTag}>Не подтверждено ≠ факт</span>
            </Panel>
          )}
          <Panel>
            <h2 className="t-h2">Продолжить разбор</h2>
            <p className={h.contextText}>
              Сформулируйте вопрос с учётом своего бюджета и ограничений.
            </p>
            <div className={h.actions}>
              <Link to={`/sources/${eventId}`} className={`${h.actionBtn} ${h.actionPrimary}`}>
                Уточнить у AI
              </Link>
              <Link to={`/sources/${eventId}#sources`} className={h.actionBtn}>
                Первоисточники
              </Link>
              <Link to={`/trace/${eventId}`} className={h.actionBtn}>
                Agent Trace
              </Link>
            </div>
          </Panel>
        </div>
      </div>
    </>
  )
}

/** Разделы разбора: каждый помечен происхождением — факт, позиция банка или вывод AI */
function Blocks({
  insight,
  sources,
  verification,
  draft,
}: {
  insight: InsightDraft
  sources: InterpretationSource[]
  verification: Verification | null
  /** Черновик ещё пишется и проверяется — источники появятся в итоговом результате */
  draft: boolean
}) {
  const newsRefs = sources.map((x) => x.title).join('; ')
  const aiBasis = draft
    ? 'Вывод модели · черновик, проверяется'
    : `Вывод модели · ${verification ? verificationLabel[verification.status].toLowerCase() : 'не проверен'}`

  const blocks: {
    question: string
    origin: Origin
    label: string
    body: ReactNode
    basis: string
  }[] = [
    {
      question: 'Что произошло',
      origin: 'fact',
      label: 'Факт из первоисточника',
      body: <List items={insight.facts} pending={draft} />,
      basis: newsRefs ? `Основание: ${newsRefs}` : 'Основание: публикация источника',
    },
    {
      question: 'Позиция банка',
      origin: 'bank',
      label: 'Аналитика банка',
      body: (
        <Text
          text={
            insight.bank_position ||
            (draft
              ? ''
              : 'Подтверждённых материалов банка по событию нет — позиция банка не сформирована, AI её не заменяет.')
          }
        />
      ),
      basis: 'Основание: каталог аналитики банка',
    },
    {
      question: 'Что это значит для компании',
      origin: 'ai',
      label: 'Вывод AI',
      body: <Text text={insight.ai_interpretation} />,
      basis: aiBasis,
    },
  ]
  if (insight.risks?.length || insight.opportunities?.length)
    blocks.push({
      question: 'Риски и возможности',
      origin: 'ai',
      label: 'Вывод AI',
      body: (
        <>
          {!!insight.risks?.length && (
            <>
              <p className="t-semibold">△ Риски</p>
              <List items={insight.risks} pending={draft} />
            </>
          )}
          {!!insight.opportunities?.length && (
            <>
              <p className="t-semibold">↗ Возможности</p>
              <List items={insight.opportunities} pending={draft} />
            </>
          )}
        </>
      ),
      basis: aiBasis,
    })
  if (insight.suggested_actions?.length)
    blocks.push({
      question: 'Что можно сделать',
      origin: 'ai',
      label: 'Вывод AI · не рекомендация',
      body: <List items={insight.suggested_actions} pending={draft} />,
      basis: aiBasis,
    })

  const claims = insight.claims?.filter((c) => c.text) ?? []

  return (
    <>
      {blocks.map((b, i) => (
        <section
          key={b.question}
          className={`${h.card} appear`}
          style={{ '--i': i } as CSSProperties}
        >
          <h2 className={h.eventTitle}>
            <span className={h.eventNum}>{String(i + 1).padStart(2, '0')}</span> {b.question}
          </h2>
          <div className={h.cardBody}>
            <div className={h.cardText}>{b.body}</div>
            <div className={h.meta}>
              <span className={h.metaItem}>
                {b.origin === 'fact' ? (
                  <LampIcon />
                ) : b.origin === 'bank' ? (
                  <Icon name="bank" size={20} />
                ) : (
                  <SparklesIcon />
                )}
                <span>
                  <b>{b.label}.</b> {b.basis}
                </span>
              </span>
            </div>
          </div>
        </section>
      ))}

      {claims.length > 0 && (
        <section className={h.card}>
          <h2 className={h.eventTitle}>Утверждения и доказательства</h2>
          <ol className={s.numbered}>
            {claims.map((c, i) => (
              <li key={c.id ?? i} className={s.col} style={{ gap: 6 }}>
                <span className={s.row}>
                  <b>{c.kind === 'fact' ? 'Факт' : c.kind === 'bank_position' ? 'Банк' : 'AI'}:</b>
                  <span className="t-15">
                    <RichText text={c.text!} />
                  </span>
                </span>
                {!!c.evidence_refs?.length && (
                  <span className={s.basis}>
                    Основание: {c.evidence_refs.map((r) => refLabel(r, sources)).join('; ')}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </section>
      )}
    </>
  )
}

/** Продукты банка из профиля — для краткой сводки в «Контексте решения» */
const products = (c: Company | undefined) =>
  c &&
  [
    c.has_credit && 'Кредиты',
    c.has_leasing && 'лизинг',
    c.has_guarantees && 'гарантии',
    c.has_factoring && 'факторинг',
    c.has_rko && 'РКО',
    c.has_deposit && 'депозит',
    c.has_payroll && 'зарплатный проект',
  ]
    .filter(Boolean)
    .join(', ')

/** Главное для компании — первое предложение вывода, полный текст ниже в разделе 03 */
const firstSentence = (text: string) => /^.+?[.!?](?=\s|$)/s.exec(text)?.[0] ?? text

/** Пустое поле черновика ещё пишется — не путаем его с отсутствием данных */
const pendingText = <p>Формируется…</p>

function Text({ text }: { text: string }) {
  if (!text) return pendingText
  return (
    <p>
      <RichText text={text} />
    </p>
  )
}

function List({ items = [], pending = false }: { items?: string[]; pending?: boolean }) {
  if (!items.length) return pending ? pendingText : <p>Нет данных</p>
  return (
    <ul className={s.numbered}>
      {/* ключ по позиции: фрагмент дописывает пункт, а не создаёт его заново */}
      {items.map((x, i) => (
        <li key={i}>
          <RichText text={x} />
        </li>
      ))}
    </ul>
  )
}
