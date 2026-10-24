import { useEffect, type CSSProperties } from 'react'
import { useParams } from 'react-router-dom'
import { formatDate } from '../api/companyFormat'
import {
  refLabel,
  stepShort,
  stepState,
  stepTitle,
  verificationLabel,
} from '../api/companyNewsFormat'
import { Button, Divider, Field, Panel, StateCard, Tag } from '../components/ui'
import { cx } from '../components/cx'
import { PageHead } from '../layout/AppLayout'
import { useWorkspace } from '../state/context'
import { useEventInterpretation } from './eventContext'
import { EventGuard } from './EventGuard'
import s from './pages.module.css'

export default function TracePage() {
  const { eventId = '' } = useParams()
  return (
    <EventGuard eventId={eventId} crumb="Agent Trace" basePath="/trace">
      <TraceView eventId={eventId} />
    </EventGuard>
  )
}

function TraceView({ eventId }: { eventId: string }) {
  const { companyId, openEvent } = useWorkspace()
  const { result: data } = useEventInterpretation()

  useEffect(() => openEvent(eventId), [eventId, openEvent])

  if (!data) return null
  const headline = data.interpretation?.headline ?? ''
  const steps = data.steps ?? []
  const tokens = steps.reduce(
    (sum, st) => sum + (st.tokens_prompt ?? 0) + (st.tokens_completion ?? 0),
    0,
  )
  const verification = data.verification
  const notes = [...(verification?.remarks ?? []), ...(verification?.missing_evidence ?? [])]

  const head = (
    <PageHead
      crumb="Agent Trace"
      title="Путь от данных к ограниченному выводу"
      subtitle={`Agent Trace · ${headline} / ${companyId}`}
    />
  )

  if (steps.length === 0)
    return (
      <>
        {head}
        <StateCard
          kind="empty"
          title="Шагов агента нет"
          text="Разбор взят из кеша без журнала шагов или ещё не запускался."
          action={<Button to={`/events/${eventId}`}>К разбору события</Button>}
        />
      </>
    )

  return (
    <>
      {head}

      <section className={s.lime}>
        <div className={`${s.col} ${s.grow}`} style={{ gap: 10 }}>
          <Tag>Трассировка запуска</Tag>
          <h2 className={`${s.limeTitle} ${s.limeTitleSm}`}>
            {verification ? verificationLabel[verification.status] : 'Проверка не проводилась'}
          </h2>
          <p className="t-15">
            {steps.length} шагов · модель {data.model}
            {data.reused ? ' · результат из кеша' : ''}
            {data.generated_at && ` · ${formatDate(data.generated_at)}`}
          </p>
        </div>
        <div className={s.col} style={{ gap: 6, maxWidth: 200 }}>
          <span className={s.bigNumber}>{tokens.toLocaleString('ru-RU')}</span>
          <span className="t-11">Токенов за запуск</span>
        </div>
      </section>

      <nav className={s.stepper} aria-label="Шаги агента">
        {steps.map((st, i) => {
          const state = stepState(st.status)
          return (
            <a key={i} href={`#step-${i}`} className={s.stepLink}>
              <span className={cx(s.stepDot, state !== 'done' && s.stepDotWarn)}>
                {state === 'done' ? '✓' : '!'}
              </span>
              {stepShort(st.step)}
              {state === 'retry' && ' ↻'}
            </a>
          )
        })}
      </nav>

      <div className={s.split}>
        <ol className={s.col} style={{ margin: 0, padding: 0, listStyle: 'none' }}>
          {steps.map((st, i) => {
            const state = stepState(st.status)
            return (
              <li
                key={i}
                id={`step-${i}`}
                className={cx(s.block, 'appear')}
                style={{ scrollMarginTop: 96, '--i': i } as CSSProperties}
              >
                <div className={`${s.row} ${s.between}`} style={{ alignItems: 'flex-start' }}>
                  <h2 className={s.blockTitle}>{stepTitle(st.step)}</h2>
                  {state === 'done' ? (
                    <Tag variant="green">Завершён</Tag>
                  ) : (
                    <Tag variant="red">
                      {state === 'retry' ? 'Вернули на доработку' : 'Ограничение'}
                    </Tag>
                  )}
                </div>
                <p className="t-11 c-muted">
                  {(st.tokens_prompt ?? 0).toLocaleString('ru-RU')} →{' '}
                  {(st.tokens_completion ?? 0).toLocaleString('ru-RU')} токенов
                </p>
                <code className={`t-mono ${s.call}`}>
                  {st.step} · {st.status}
                </code>
                {st.detail && <p className="t-15">{st.detail}</p>}
              </li>
            )
          })}
        </ol>

        <div className={s.aside}>
          <Panel>
            <h2 className="t-h2">Единый контекст</h2>
            <Field label="Компания" value={companyId} />
            <Field label="Событие" value={headline || eventId} />
            <Field label="Доступ" value="Только участники компании" />
            <Divider />
            <p className="t-12">
              company_id передаётся каждому шагу. Права проверяются до поиска фрагментов.
            </p>
          </Panel>
          {(notes.length > 0 || !!data.sources?.length) && (
            <Panel>
              <h2 className="t-h2">Доказательства</h2>
              {data.sources?.map((src) => (
                <p key={src.evidence_ref} className="t-13">
                  {refLabel(src.evidence_ref, data.sources)}
                  {src.page_number != null && ` · стр. ${src.page_number}`}
                </p>
              ))}
              {notes.map((n) => (
                <p key={n} className="t-12 c-muted">
                  {n}
                </p>
              ))}
            </Panel>
          )}
          <Panel green>
            <h2 className="t-h2">Связанные экраны</h2>
            <Button to={`/events/${eventId}`}>Разбор события →</Button>
            <Button to={`/sources/${eventId}`}>Первоисточники →</Button>
            <Button to="/how">Как это работает →</Button>
          </Panel>
        </div>
      </div>
    </>
  )
}
