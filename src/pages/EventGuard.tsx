import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useCompanyNewsHead } from '../api/companyNewsHooks'
import { streamErrorText, useInterpretationLive } from '../api/interpretationStream'
import { Button, StateCard } from '../components/ui'
import { PageHead } from '../layout/AppLayout'
import { useWorkspace } from '../state/context'
import { EventInterpretationContext } from './eventContext'
import s from './pages.module.css'
import { EventSkeleton } from './Skeletons'

/**
 * Общая обвязка экранов одной новости (разбор, источники, Agent Trace):
 * без id ведёт к последней открытой или главной новости сводки, получает AI-интерпретацию
 * потоком в контексте выбранной компании и показывает этапы, ошибку и обрыв.
 */
export function EventGuard({
  eventId,
  crumb,
  basePath,
  allowDraft,
  children,
}: {
  eventId: string
  crumb: string
  /** Путь экрана без id — для перехода к новости по умолчанию */
  basePath?: string
  /** Экран умеет показывать непроверенный черновик, пока идёт проверка */
  allowDraft?: boolean
  children: ReactNode
}) {
  const { companyId, lastEventId } = useWorkspace()
  const head = useCompanyNewsHead(companyId, { relevant_only: true })
  const live = useInterpretationLive(companyId, eventId)

  if (!eventId) {
    const fallback = lastEventId ?? head.data?.items[0]?.id
    if (fallback && basePath) return <Navigate to={`${basePath}/${fallback}`} replace />
    if (!companyId || head.isError || (head.data && !fallback))
      return (
        <>
          <PageHead
            crumb={crumb}
            title="Нет выбранного события"
            subtitle="Откройте событие в сводке"
          />
          <StateCard
            kind="empty"
            title="Событие не выбрано"
            text="Экран показывает данные по конкретному событию. Выберите его в сводке."
            action={<Button to="/digest">К сводке</Button>}
          />
        </>
      )
    return <EventSkeleton crumb={crumb} />
  }

  if (!companyId)
    return (
      <>
        <PageHead crumb={crumb} title="Компания не выбрана" subtitle="" />
        <StateCard
          kind="empty"
          title="Разбор строится для компании"
          text="Выберите компанию — AI оценит влияние события на её профиль."
          action={<Button to="/companies">К компаниям</Button>}
        />
      </>
    )

  if (!live.result && (live.error || live.interrupted))
    return (
      <>
        <PageHead crumb={crumb} title="Событие недоступно" subtitle="Не удалось получить разбор" />
        <StateCard
          kind="error"
          title={live.interrupted ? 'Разбор прервался' : 'Разбор не сформирован'}
          text={
            live.interrupted
              ? 'Соединение оборвалось до готового результата. Черновик не показываем — он не прошёл проверку.'
              : streamErrorText(live.error!)
          }
          action={
            <div className={s.row}>
              {(live.interrupted || live.error?.retryable !== false) && (
                <Button variant="primary" onClick={live.retry}>
                  Повторить
                </Button>
              )}
              <Button to="/digest">К сводке</Button>
            </div>
          }
        />
      </>
    )

  if (!live.result && !(allowDraft && live.draft))
    return <EventSkeleton crumb={crumb} stage={live.stage} />

  return (
    <EventInterpretationContext.Provider value={live}>
      {children}
    </EventInterpretationContext.Provider>
  )
}
