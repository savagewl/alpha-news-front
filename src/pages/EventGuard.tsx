import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useDigest, useInterpretation } from '../api/newsHooks'
import { Button, StateCard } from '../components/ui'
import { PageHead } from '../layout/AppLayout'
import { findCompany } from '../mocks/data'
import { useWorkspace } from '../state/context'
import s from './pages.module.css'

/**
 * Общая обвязка экранов одного события (разбор, источники, Agent Trace):
 * без id ведёт к последнему открытому или главному событию сводки, показывает загрузку и ошибку
 * и не даёт смешать контексты — событие другой компании не раскрывается.
 */
export function EventGuard({
  eventId,
  crumb,
  basePath,
  children,
}: {
  eventId: string
  crumb: string
  /** Путь экрана без id — для перехода к событию по умолчанию */
  basePath?: string
  children: ReactNode
}) {
  const { companyId, role, lastEventId, setCompany } = useWorkspace()
  const digest = useDigest(companyId, role)
  const { data, isPending, isError, refetch } = useInterpretation(eventId || undefined)

  if (!eventId) {
    const fallback = lastEventId ?? digest.data?.events[0]?.id
    if (fallback && basePath) return <Navigate to={`${basePath}/${fallback}`} replace />
    if (digest.isError || (digest.data && !fallback))
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

  if (isPending) return <Loading crumb={crumb} />

  if (isError || !data)
    return (
      <>
        <PageHead crumb={crumb} title="Событие недоступно" subtitle="Не удалось получить данные" />
        <StateCard
          kind="error"
          title="Событие не найдено"
          text="Возможно, ссылка устарела или событие удалено из сводки. Ответ по нему не сформирован."
          action={
            <div className={s.row}>
              <Button onClick={() => refetch()}>Повторить загрузку</Button>
              <Button to="/digest">К сводке</Button>
            </div>
          }
        />
      </>
    )

  if (data.event.companyId !== companyId) {
    const company = findCompany(data.event.companyId)
    return (
      <>
        <PageHead
          crumb={crumb}
          title="Событие другой компании"
          subtitle={`${data.event.title} · ${company.id}`}
        />
        <StateCard
          kind="insufficient"
          tag="Другая компания"
          title={`Разбор относится к ${company.shortName}`}
          text={`Сейчас выбрана компания ${companyId}. Чтобы не смешивать контексты, данные события показываются только в контексте ${company.id}.`}
          action={
            <div className={s.row}>
              <Button variant="primary" onClick={() => setCompany(company.id)}>
                Переключиться на {company.id}
              </Button>
              <Button to="/digest">К своей сводке</Button>
            </div>
          }
        />
      </>
    )
  }

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
        note="Ожидание данных · результатов пока нет"
      />
    </>
  )
}
