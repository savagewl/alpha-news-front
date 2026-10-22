import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useInterpretation } from '../api/newsHooks'
import { Feedback } from '../components/Feedback'
import { Button, Legend, OriginTag, Panel, StateCard, Tag } from '../components/ui'
import { PageHead } from '../layout/AppLayout'
import { findCompany } from '../mocks/data'
import { useWorkspace } from '../state/context'
import { EventGuard } from './EventGuard'
import s from './pages.module.css'

export default function EventPage() {
  const { eventId = '' } = useParams()
  return (
    <EventGuard eventId={eventId} crumb="Интерпретация">
      <Interpretation eventId={eventId} />
    </EventGuard>
  )
}

function Interpretation({ eventId }: { eventId: string }) {
  const { role, openEvent, isSaved, toggleSaved } = useWorkspace()
  const { data } = useInterpretation(eventId)

  useEffect(() => openEvent(eventId), [eventId, openEvent])

  if (!data) return null
  const { event } = data
  const company = findCompany(event.companyId)
  const saved = isSaved(event.id)

  return (
    <>
      <PageHead
        crumb="Интерпретация"
        title={data.title}
        subtitle={`${company.id} · ${event.date} · ${event.sourceTitle}`}
      >
        <div className={s.row}>
          <Tag variant={event.kind === 'risk' ? 'red' : 'green'}>
            {event.kind === 'risk' ? 'Риск' : 'Возможность'}
          </Tag>
          <Tag>{event.relevance} релевантность</Tag>
        </div>
        <Button pressed={saved} onClick={() => toggleSaved(event.id)}>
          {saved ? '★ Сохранено' : '☆ Сохранить'}
        </Button>
      </PageHead>

      <section className={s.lime} style={{ padding: '24px 20px' }}>
        <div className={s.col} style={{ gap: 8 }}>
          <p className={s.eyebrow}>✦ ГЛАВНОЕ ДЛЯ РОЛИ</p>
          <h2 className={`${s.limeTitle} ${s.limeTitleSm}`}>{data.main}</h2>
        </div>
      </section>

      <Legend />

      <div className={s.split}>
        <div className={s.col}>
          {data.blocks.map((b, i) => (
            <section key={b.question} className={s.block}>
              <h2 className={s.blockTitle}>
                {String(i + 1).padStart(2, '0')} {b.question}
              </h2>
              <OriginTag origin={b.origin}>{b.label}</OriginTag>
              <p className="t-15">{b.text}</p>
              {b.strong && <p className="t-15 t-semibold">{b.strong}</p>}
              <p className={s.basis}>{b.basis}</p>
            </section>
          ))}

          {!data.detailed && (
            <StateCard
              kind="insufficient"
              title="Для полного разбора не хватает данных"
              text="Последствия, действия и позиция банка по этому событию ещё не сформированы: в профиле нет данных, от которых зависит вывод. Задайте уточняющий вопрос или дополните профиль."
              action={
                <div className={s.row}>
                  <Button variant="primary" to={`/sources/${event.id}`}>
                    Уточнить у AI →
                  </Button>
                  <Button to="/profile">Уточнить профиль</Button>
                </div>
              }
            />
          )}

          <Feedback key={event.id} question="Разбор полезен для вашего решения?" />
        </div>

        <div className={s.aside}>
          <Panel>
            <h2 className="t-h2">Контекст решения</h2>
            <Tag>
              {company.id} / {role}
            </Tag>
            <p className="t-13">{data.context}</p>
            <Button to="/profile">Профиль компании →</Button>
          </Panel>
          <Panel>
            <h2 className="t-h2">Границы вывода</h2>
            <p className="t-13">{data.limits}</p>
          </Panel>
          <Panel green>
            <h2 className="t-h2">Продолжить разбор</h2>
            <p className="t-13">Сформулируйте вопрос с учётом своего бюджета и ограничений.</p>
            <Button variant="primary" to={`/sources/${event.id}`}>
              Уточнить у AI →
            </Button>
            <Button to={`/sources/${event.id}#sources`}>Первоисточники →</Button>
            <Button to={`/trace/${event.id}`}>Agent Trace →</Button>
          </Panel>
        </div>
      </div>
    </>
  )
}
