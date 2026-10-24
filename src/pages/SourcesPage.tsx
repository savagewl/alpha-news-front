import { useEffect, useState, type FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../auth/context'
import { ApiError } from '../api/client'
import { formatDate } from '../api/companyFormat'
import { originLabel, originOf, refKind } from '../api/companyNewsFormat'
import {
  interpretationError,
  threadStorage,
  useAnalyticsDocuments,
  useAsk,
  useChatHistory,
  useInterpretation,
} from '../api/companyNewsHooks'
import type {
  AnalyticsDocument,
  ChatMessage,
  DocumentStatus,
  InterpretationSource,
} from '../api/companyNewsTypes'
import { Feedback } from '../components/Feedback'
import { Icon } from '../components/Icons'
import { OpenPdf } from '../components/OpenPdf'
import { Legend, OriginTag, Panel, Skeleton, StateCard, Tag } from '../components/ui'
import { PageHead } from '../layout/AppLayout'
import { useWorkspace } from '../state/context'
import { EventGuard } from './EventGuard'
import s from './pages.module.css'

const suggestedQuestions = [
  'Что это значит для нашего инвестиционного бюджета?',
  'Покажи только риски на горизонте квартала',
  'Какие контрагенты затронуты?',
  'Чем позиция банка отличается от вывода AI?',
]

export default function SourcesPage() {
  const { eventId = '' } = useParams()
  return (
    <EventGuard eventId={eventId} crumb="Источники" basePath="/sources">
      {/* key — свой диалог для каждого события */}
      <Dialog key={eventId} eventId={eventId} />
    </EventGuard>
  )
}

function Dialog({ eventId }: { eventId: string }) {
  const { companyId, openEvent } = useWorkspace()
  const { user } = useAuth()
  const userId = user?.id ?? 'guest'
  const { data } = useInterpretation(companyId, eventId)
  const [threadId, setThreadId] = useState(() => threadStorage.get(userId, companyId, eventId))
  const history = useChatHistory(companyId, eventId, threadId)
  const saveThread = (id: string | null) => {
    threadStorage.set(userId, companyId, eventId, id)
    setThreadId(id)
  }
  const ask = useAsk(companyId, eventId, threadId, saveThread)
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null)
  const [draft, setDraft] = useState('')

  useEffect(() => openEvent(eventId), [eventId, openEvent])

  // сохранённый тред удалён на бэке — начинаем диалог заново
  useEffect(() => {
    if (history.error instanceof ApiError && history.error.status === 404) saveThread(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history.error])

  // переход по ссылке «Первоисточники →» ведёт сразу к панели источников
  useEffect(() => {
    if (data && window.location.hash === '#sources')
      document.getElementById('sources')?.scrollIntoView({ behavior: 'smooth' })
  }, [data])

  if (!data) return null
  const title = data.interpretation?.headline ?? 'событие'
  const sources = data.sources ?? []
  const bankSources = sources.filter((x) => refKind(x.evidence_ref) === 'bank')
  const primary = sources.filter((x) => refKind(x.evidence_ref) !== 'bank')
  // вопросы принимаются только по подтверждённой интерпретации
  const canAsk = data.status === 'ready' && !!data.interpretation

  const messages = history.data?.messages ?? []
  const questions = messages.filter((m) => m.role === 'user')
  const answerTo = (q: ChatMessage) =>
    messages.find((m) => m.role === 'assistant' && m.reply_to_id === q.id)
  const awaiting = messages.some((m) => m.status === 'generating')

  const send = (question: string) => {
    const q = question.trim()
    if (!q || ask.isPending || !canAsk) return
    setPendingQuestion(q)
    setDraft('')
    ask.mutate(q, { onSettled: () => setPendingQuestion(null) })
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    send(draft)
  }

  // 502/504 бэк сохраняет в истории как неудачный ответ — отдельная карточка не нужна
  const askError =
    ask.isError && !(ask.error instanceof ApiError && [502, 504].includes(ask.error.status))
      ? ask.error instanceof ApiError && ask.error.status === 409
        ? 'Разбор события ещё не подтверждён — вопросы по нему пока недоступны.'
        : interpretationError(ask.error)
      : null

  const asked = new Set(questions.map((q) => q.content))
  const suggestions = suggestedQuestions.filter((q) => !asked.has(q))
  const roleLabel = `Вопрос · ${companyId}`
  const busy = ask.isPending || awaiting

  return (
    <>
      <PageHead
        crumb="Источники"
        title="От сигнала — к решению"
        subtitle={`${title} · ${companyId}`}
      />

      <Legend />

      <div className={`${s.split} ${s.split390}`}>
        <div className={s.col} style={{ gap: 20 }}>
          {questions.length === 0 && !pendingQuestion && (
            <Panel>
              <h2 className="t-h2">Задайте уточняющий вопрос</h2>
              <p className="t-13">
                {canAsk
                  ? `AI ответит в контексте ${companyId} и события «${title}», покажет источники и отделит позицию банка от своего вывода. Диалог виден только вам.`
                  : 'Разбор события не прошёл проверку — вопросы принимаются только по подтверждённому разбору.'}
              </p>
            </Panel>
          )}

          {history.isPending && threadId && <Skeleton lines={4} />}

          {questions.map((q) => (
            <Exchange
              key={q.id}
              question={q}
              answer={answerTo(q)}
              roleLabel={roleLabel}
              companyId={companyId}
            />
          ))}

          {pendingQuestion && (
            <>
              <Question text={pendingQuestion} roleLabel={roleLabel} />
              <Thinking companyId={companyId} />
            </>
          )}

          {askError && <StateCard kind="error" title="Вопрос не отправлен" text={askError} />}

          {canAsk && suggestions.length > 0 && (
            <div className={s.row} aria-label="Подсказки">
              {suggestions.map((q) => (
                <button
                  key={q}
                  type="button"
                  className={s.chip}
                  disabled={busy}
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
              placeholder={
                canAsk ? 'Уточните допущение или выберите источник…' : 'Вопросы недоступны'
              }
              value={draft}
              maxLength={500}
              disabled={!canAsk}
              onChange={(e) => setDraft(e.target.value)}
            />
            <button
              type="submit"
              className={s.send}
              aria-label="Отправить вопрос"
              disabled={!draft.trim() || busy || !canAsk}
            >
              <Icon name="arrowUp" size={16} strokeWidth={2} />
            </button>
          </form>
        </div>

        <div className={s.aside} id="sources">
          {primary.map((src) => (
            <PrimarySource key={src.evidence_ref} src={src} />
          ))}
          {bankSources.map((src) => (
            <BankSource key={src.evidence_ref} src={src} />
          ))}
          {bankSources.length === 0 && (
            <Panel>
              <h2 className="t-h2">Аналитика банка</h2>
              <Tag variant="red">Материал не найден</Tag>
              <p className="t-13">
                В каталоге нет подтверждённого обзора по этому событию. Позиция банка не установлена
                — AI её не заменяет.
              </p>
            </Panel>
          )}
        </div>
      </div>

      <Catalog sources={sources} />
    </>
  )
}

function Question({ text, roleLabel }: { text: string; roleLabel: string }) {
  return (
    <section className={`${s.dark} appear`}>
      <p className={s.darkEyebrow}>{roleLabel.toUpperCase()}</p>
      <h2 className="t-h2" style={{ fontWeight: 600 }}>
        {text}
      </h2>
    </section>
  )
}

function Thinking({ companyId }: { companyId: string }) {
  return (
    <section className={`${s.block} appear`} aria-busy>
      <OriginTag origin="ai">AI · Готовим ответ</OriginTag>
      <p className="t-13 c-muted">План → профиль {companyId} → источники → проверка ограничений…</p>
      <Skeleton lines={4} />
    </section>
  )
}

function Exchange({
  question,
  answer: a,
  roleLabel,
  companyId,
}: {
  question: ChatMessage
  answer: ChatMessage | undefined
  roleLabel: string
  companyId: string
}) {
  const origin = originOf[a?.answer_kind ?? 'ai_inference']
  return (
    <>
      <Question text={question.content} roleLabel={roleLabel} />
      {!a || a.status === 'generating' ? (
        <Thinking companyId={companyId} />
      ) : a.status === 'failed' ? (
        <StateCard
          kind="error"
          title="Ответ не сформирован"
          text="Модель не смогла подтвердить ответ источниками — непроверенный ответ не показан. Переформулируйте вопрос."
          note={a.warnings?.join(' · ') || undefined}
        />
      ) : (
        <section className={`${s.block} appear`}>
          <OriginTag origin={origin}>{originLabel[origin]}</OriginTag>
          <p className="t-15" style={{ whiteSpace: 'pre-line' }}>
            {a.content}
          </p>
          {!!a.warnings?.length && <p className="t-12 c-muted">{a.warnings.join(' · ')}</p>}
          {!!a.sources?.length && (
            <div className={s.row}>
              {a.sources.map((src) => {
                const o = src.kind === 'bank' ? 'bank' : 'fact'
                const label = `${src.title}${src.page_number != null ? ` · стр. ${src.page_number}` : ''}`
                return src.source_url ? (
                  <a key={src.evidence_ref} href={src.source_url} target="_blank" rel="noreferrer">
                    <OriginTag origin={o}>{label}</OriginTag>
                  </a>
                ) : (
                  <OriginTag key={src.evidence_ref} origin={o}>
                    {label}
                  </OriginTag>
                )
              })}
            </div>
          )}
          <Feedback />
        </section>
      )}
    </>
  )
}

function PrimarySource({ src }: { src: InterpretationSource }) {
  return (
    <Panel>
      <h2 className="t-h2">Первоисточник</h2>
      <OriginTag origin="fact">Первоисточник</OriginTag>
      <div className={s.doc}>
        <p className="t-11 c-muted">НОВОСТЬ</p>
        <p className={s.docTitle}>{src.title}</p>
        {src.published_at && <p className="t-13">Опубликовано: {formatDate(src.published_at)}.</p>}
      </div>
      <a className="t-13 t-semibold c-red" href={src.source_url} target="_blank" rel="noreferrer">
        Открыть первоисточник ↗
      </a>
    </Panel>
  )
}

function BankSource({ src }: { src: InterpretationSource }) {
  // «analytics:<id>#<фрагмент>» — id документа нужен, чтобы открыть PDF
  const documentId = /^analytics:([^#]+)/.exec(src.evidence_ref)?.[1]
  return (
    <Panel>
      <h2 className="t-h2">Аналитика банка</h2>
      <Tag variant="green">▤ Материал загружен</Tag>
      <p className="t-15 t-semibold">{src.title}</p>
      {src.page_number != null && <p className="t-13">Страница {src.page_number}</p>}
      {src.published_at && <p className="t-12 c-muted">{formatDate(src.published_at)}</p>}
      {documentId && <OpenPdf documentId={documentId} page={src.page_number ?? undefined} />}
    </Panel>
  )
}

const documentStatus: Record<
  DocumentStatus,
  { label: string; variant: 'green' | 'red' | 'neutral' }
> = {
  ready: { label: 'Готов к поиску', variant: 'green' },
  parsed: { label: 'Текст извлечён', variant: 'green' },
  queued: { label: 'В очереди', variant: 'neutral' },
  extracting: { label: 'Извлекаем текст', variant: 'neutral' },
  indexing: { label: 'Индексируем', variant: 'neutral' },
  failed: { label: 'Ошибка обработки', variant: 'red' },
}

/** Каталог аналитики банка — общий корпус PDF, из которого берётся позиция банка */
function Catalog({ sources }: { sources: InterpretationSource[] }) {
  const docs = useAnalyticsDocuments()
  const usedHere = (d: AnalyticsDocument) => sources.some((x) => x.source_url.includes(d.id))

  return (
    <Panel>
      <h2 className="t-h2">Каталог аналитики · доступность материалов</h2>
      {docs.isPending && <Skeleton lines={3} />}
      {docs.isError && <p className="t-13 c-muted">Каталог аналитики сейчас недоступен.</p>}
      {docs.data?.length === 0 && <p className="t-13 c-muted">Материалы банка ещё не загружены.</p>}
      <div>
        {docs.data?.map((d) => {
          const st = documentStatus[d.status]
          return (
            <div key={d.id} className={s.catalogRow}>
              <span className={s.row}>
                {d.title} · {d.publisher}
                {d.published_at && ` · ${new Date(d.published_at).toLocaleDateString('ru-RU')}`}
                {usedHere(d) && <Tag variant="green">▤ По событию</Tag>}
              </span>
              <Tag variant={st.variant}>{st.label}</Tag>
            </div>
          )
        })}
      </div>
    </Panel>
  )
}
