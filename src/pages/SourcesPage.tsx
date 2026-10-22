import { useEffect, useState, type FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import { useAsk, useInterpretation } from '../api/newsHooks'
import type { Answer, Source } from '../api/newsTypes'
import { Feedback } from '../components/Feedback'
import { Icon } from '../components/Icons'
import {
  Button,
  Divider,
  Legend,
  OriginTag,
  Panel,
  Skeleton,
  StateCard,
  Tag,
} from '../components/ui'
import { PageHead } from '../layout/AppLayout'
import { shortRole } from '../mocks/data'
import { analytics, suggestedQuestions } from '../mocks/news'
import { useWorkspace } from '../state/context'
import { EventGuard } from './EventGuard'
import s from './pages.module.css'

export default function SourcesPage() {
  const { eventId = '' } = useParams()
  return (
    <EventGuard eventId={eventId} crumb="Источники" basePath="/sources">
      {/* key — новый диалог для каждого события */}
      <Dialog key={eventId} eventId={eventId} />
    </EventGuard>
  )
}

function Dialog({ eventId }: { eventId: string }) {
  const { companyId, role, openEvent } = useWorkspace()
  const { data } = useInterpretation(eventId)
  const ask = useAsk(eventId, role)
  const [thread, setThread] = useState<Answer[]>([])
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null)
  const [draft, setDraft] = useState('')

  useEffect(() => openEvent(eventId), [eventId, openEvent])

  // переход по ссылке «Первоисточники →» ведёт сразу к панели источников
  useEffect(() => {
    if (data && window.location.hash === '#sources')
      document.getElementById('sources')?.scrollIntoView({ behavior: 'smooth' })
  }, [data])

  if (!data) return null
  const { event, sources } = data

  const send = (question: string) => {
    const q = question.trim()
    if (!q || ask.isPending) return
    setPendingQuestion(q)
    setDraft('')
    ask.mutate(q, {
      onSuccess: (answer) => setThread((t) => [...t, answer]),
      onSettled: () => setPendingQuestion(null),
    })
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    send(draft)
  }

  const asked = new Set(thread.map((a) => a.question))
  const suggestions = suggestedQuestions.filter((q) => !asked.has(q))

  return (
    <>
      <PageHead
        crumb="Источники"
        title="От сигнала — к решению"
        subtitle={`${event.title} · ${companyId} / ${shortRole(role)}`}
      />

      <Legend />

      <div className={`${s.split} ${s.split390}`}>
        <div className={s.col} style={{ gap: 20 }}>
          {thread.length === 0 && !pendingQuestion && (
            <Panel>
              <h2 className="t-h2">Задайте уточняющий вопрос</h2>
              <p className="t-13">
                AI ответит в контексте {companyId} и события «{event.title}», покажет источники и
                отделит позицию банка от своего вывода. Можно запросить данные в другом разрезе.
              </p>
            </Panel>
          )}

          {thread.map((a) => (
            <Exchange key={a.id} answer={a} roleLabel={`${role} · ${companyId}`} />
          ))}

          {pendingQuestion && (
            <>
              <Question text={pendingQuestion} roleLabel={`${role} · ${companyId}`} />
              <section className={s.block} aria-busy>
                <OriginTag origin="ai">AI · Готовим ответ</OriginTag>
                <p className="t-13 c-muted">
                  План → профиль {companyId} → источники → проверка ограничений…
                </p>
                <Skeleton lines={4} />
              </section>
            </>
          )}

          {ask.isError && (
            <StateCard
              kind="error"
              title="Ответ не сформирован"
              text="Источник недоступен или превышено время ожидания. Повторите вопрос."
            />
          )}

          {suggestions.length > 0 && (
            <div className={s.row} aria-label="Подсказки">
              {suggestions.map((q) => (
                <button
                  key={q}
                  type="button"
                  className={s.chip}
                  disabled={ask.isPending}
                  onClick={() => send(q)}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          <form className={s.composer} onSubmit={onSubmit}>
            <input
              aria-label="Уточняющий вопрос"
              placeholder="Уточните допущение или выберите источник…"
              value={draft}
              maxLength={500}
              onChange={(e) => setDraft(e.target.value)}
            />
            <button
              type="submit"
              className={s.send}
              aria-label="Отправить вопрос"
              disabled={!draft.trim() || ask.isPending}
            >
              <Icon name="arrowUp" size={16} strokeWidth={2} />
            </button>
          </form>
        </div>

        <div className={s.aside} id="sources">
          {sources
            .filter((src) => src.kind !== 'profile')
            .map((src) =>
              src.kind === 'bank' ? (
                <BankSource key={src.code} src={src} />
              ) : (
                <PrimarySource key={src.code} src={src} />
              ),
            )}
          {!event.bankRef && (
            <Panel>
              <h2 className="t-h2">Аналитика банка</h2>
              <Tag variant="red">Материал не найден</Tag>
              <p className="t-13">
                В каталоге нет обзора по этому событию. Позиция банка не установлена — AI её не
                заменяет.
              </p>
            </Panel>
          )}
        </div>
      </div>

      <Panel>
        <h2 className="t-h2">Каталог аналитики · доступность материалов</h2>
        <div>
          {analytics.map((m) => (
            <div key={m.code} className={s.catalogRow}>
              <span className={s.row}>
                {m.title}
                {m.code === event.bankRef && <Tag variant="green">▤ По событию</Tag>}
              </span>
              <Tag variant={m.available ? 'green' : 'neutral'}>
                {m.available ? 'Полный текст доступен' : 'Полный текст не загружен'}
              </Tag>
            </div>
          ))}
        </div>
      </Panel>
    </>
  )
}

function Question({ text, roleLabel }: { text: string; roleLabel: string }) {
  return (
    <section className={s.dark}>
      <p className={s.darkEyebrow}>{roleLabel.toUpperCase()}</p>
      <h2 className="t-h2" style={{ fontWeight: 600 }}>
        {text}
      </h2>
    </section>
  )
}

function Exchange({ answer: a, roleLabel }: { answer: Answer; roleLabel: string }) {
  return (
    <>
      <Question text={a.question} roleLabel={roleLabel} />
      <section className={s.block}>
        <OriginTag origin="ai">Вывод AI</OriginTag>
        <h3 className={s.answerTitle}>{a.headline}</h3>
        <p className="t-15">{a.lead}</p>
        {a.section && (
          <>
            <Divider />
            <h4 className="t-h2" style={{ fontWeight: 600, fontSize: 18 }}>
              {a.section.title}
            </h4>
            <ol className={`${s.numbered} ${s.numberedLg}`}>
              {a.section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          </>
        )}
        <Divider />
        <p className="t-15 t-semibold">{a.need}</p>
        <p className="t-12 c-muted">{a.limits}</p>
        <div className={s.row}>
          {a.refs.map((r) => (
            <OriginTag key={r.label} origin={r.origin}>
              {r.label}
            </OriginTag>
          ))}
        </div>
        <Feedback />
      </section>
    </>
  )
}

function PrimarySource({ src }: { src: Source }) {
  return (
    <Panel>
      <h2 className="t-h2">Первоисточник · {src.code}</h2>
      <OriginTag origin="fact">Первоисточник</OriginTag>
      <div className={s.doc}>
        <p className="t-11 c-muted">{src.kind === 'case' ? 'ТЗ КЕЙСА' : 'НОВОСТЬ'}</p>
        <p className={s.docTitle}>{src.title}</p>
        <p className="t-13">Дата сценария: {src.date}.</p>
      </div>
      <p className="t-12">{src.note}</p>
      {src.url && (
        <a className="t-13 t-semibold c-red" href={src.url} target="_blank" rel="noreferrer">
          Открыть первоисточник ↗
        </a>
      )}
    </Panel>
  )
}

function BankSource({ src }: { src: Source }) {
  const [requested, setRequested] = useState(false)
  return (
    <Panel>
      <h2 className="t-h2">{src.code} · Аналитика банка</h2>
      <Tag variant={src.available ? 'green' : 'red'}>
        {src.available ? '▤ Материал загружен' : 'Полный текст не загружен'}
      </Tag>
      <p className="t-15 t-semibold">{src.title}</p>
      <p className="t-13">{src.note}</p>
      {!src.available &&
        (requested ? (
          <p className="t-12 c-green" role="status">
            Запрос зафиксирован. Позиция банка появится в разборе после загрузки материала.
          </p>
        ) : (
          <Button onClick={() => setRequested(true)}>Запросить материал</Button>
        ))}
    </Panel>
  )
}
