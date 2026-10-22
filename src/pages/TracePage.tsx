import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useInterpretation, useTrace } from '../api/newsHooks'
import { Button, Divider, Field, Panel, StateCard, Tag } from '../components/ui'
import { cx } from '../components/cx'
import { PageHead } from '../layout/AppLayout'
import { shortRole } from '../mocks/data'
import { useWorkspace } from '../state/context'
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
  const { companyId, role, openEvent } = useWorkspace()
  const { data: interp } = useInterpretation(eventId)
  const { data: trace, isPending, isError, refetch } = useTrace(eventId, role)

  useEffect(() => openEvent(eventId), [eventId, openEvent])

  const head = (
    <PageHead
      crumb="Agent Trace"
      title="Путь от данных к ограниченному выводу"
      subtitle={`Agent Trace · ${interp?.event.title ?? ''} / ${companyId} / ${shortRole(role)}`}
    />
  )

  if (isPending)
    return (
      <>
        {head}
        <StateCard
          kind="loading"
          title="Загружаем трассировку"
          text="Получаем шаги агента по событию."
        />
      </>
    )

  if (isError || !trace)
    return (
      <>
        {head}
        <StateCard
          kind="error"
          title="Трассировка недоступна"
          text="Журнал шагов по событию не получен."
          action={<Button onClick={() => refetch()}>Повторить загрузку</Button>}
        />
      </>
    )

  return (
    <>
      {head}

      <section className={s.lime}>
        <div className={`${s.col} ${s.grow}`} style={{ gap: 10 }}>
          <Tag>Трассировка запуска</Tag>
          <h2 className={`${s.limeTitle} ${s.limeTitleSm}`}>{trace.headline}</h2>
          <p className="t-15">{trace.summary}</p>
        </div>
        <div className={s.col} style={{ gap: 6, maxWidth: 200 }}>
          <span className={s.bigNumber}>{trace.totalSec}</span>
          <span className="t-11">Общее время выполнения</span>
        </div>
      </section>

      <nav className={s.stepper} aria-label="Шаги агента">
        {trace.steps.map((st) => (
          <a key={st.id} href={`#step-${st.id}`} className={s.stepLink}>
            <span className={cx(s.stepDot, st.status !== 'done' && s.stepDotWarn)}>
              {st.status === 'done' ? '✓' : '!'}
            </span>
            {st.short}
            {st.status === 'retry' && ' ↻'}
          </a>
        ))}
      </nav>

      <div className={s.split}>
        <ol className={s.col} style={{ margin: 0, padding: 0, listStyle: 'none' }}>
          {trace.steps.map((st) => (
            <li
              key={st.id}
              id={`step-${st.id}`}
              className={s.block}
              style={{ scrollMarginTop: 96 }}
            >
              <div className={`${s.row} ${s.between}`} style={{ alignItems: 'flex-start' }}>
                <h2 className={s.blockTitle}>{st.title}</h2>
                {st.status === 'done' ? (
                  <Tag variant="green">Завершён</Tag>
                ) : (
                  <Tag variant="red">
                    {st.status === 'retry' ? 'Повторный поиск · нет подтверждения' : 'Ограничение'}
                  </Tag>
                )}
              </div>
              <p className="t-11 c-muted">
                {st.at} · {st.ms} мс
              </p>
              <code className={`t-mono ${s.call}`}>{st.call}</code>
              <p className="t-15">{st.result}</p>
              <p className="t-11 c-muted">{st.note}</p>
            </li>
          ))}
        </ol>

        <div className={s.aside}>
          <Panel>
            <h2 className="t-h2">Единый контекст</h2>
            <Field
              label="Компания / роль"
              value={`${trace.context.company} / ${shortRole(role)}`}
            />
            <Field label="Событие" value={trace.context.event} />
            <Field label="Доступ" value={trace.context.access} />
            <Divider />
            <p className="t-12">
              company_id и role передаются каждому инструменту. Права проверяются до поиска
              фрагментов.
            </p>
          </Panel>
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
