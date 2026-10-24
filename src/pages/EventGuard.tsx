import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { interpretationError, useCompanyNewsHead, useInterpretation } from '../api/companyNewsHooks'
import { Button, StateCard } from '../components/ui'
import { PageHead } from '../layout/AppLayout'
import { useWorkspace } from '../state/context'
import s from './pages.module.css'

/**
 * Общая обвязка экранов одной новости (разбор, источники, Agent Trace):
 * без id ведёт к последней открытой или главной новости сводки, ждёт AI-интерпретацию
 * в контексте выбранной компании и показывает загрузку и ошибку.
 */
export function EventGuard({
  eventId,
  crumb,
  basePath,
  children,
}: {
  eventId: string
  crumb: string
  /** Путь экрана без id — для перехода к новости по умолчанию */
  basePath?: string
  children: ReactNode
}) {
  const { companyId, lastEventId } = useWorkspace()
  const head = useCompanyNewsHead(companyId, { relevant_only: true })
  const { data, isPending, isError, error, refetch } = useInterpretation(
    companyId,
    eventId || undefined,
  )

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
    return <Loading crumb={crumb} />
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

  if (isPending || data?.status === 'generating') return <Loading crumb={crumb} />

  if (isError || !data)
    return (
      <>
        <PageHead crumb={crumb} title="Событие недоступно" subtitle="Не удалось получить разбор" />
        <StateCard
          kind="error"
          title="Разбор не сформирован"
          text={interpretationError(error)}
          action={
            <div className={s.row}>
              <Button onClick={() => refetch()}>Повторить</Button>
              <Button to="/digest">К сводке</Button>
            </div>
          }
        />
      </>
    )

  return children
}

function Loading({ crumb }: { crumb: string }) {
  return (
    <>
      <PageHead
        crumb={crumb}
        title="Загружаем событие"
        subtitle="Собираем факты, профиль и аналитику банка"
      />
      <StateCard
        kind="loading"
        title="Готовим разбор"
        text="Агент проверяет профиль, источники и аналитику банка. Ответ ещё не сформирован."
        note="Первый разбор новости занимает до минуты, повторный открывается сразу"
      />
    </>
  )
}
