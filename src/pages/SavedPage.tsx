import { useQueries } from '@tanstack/react-query'
import { articleApi, articleKeys } from '../api/articleHooks'
import { plural } from '../api/companyFormat'
import { useCompany } from '../api/companyHooks'
import { EventCard } from '../components/EventCard'
import { Button, StateCard } from '../components/ui'
import { PageHead } from '../layout/AppLayout'
import { useWorkspace } from '../state/context'
import s from './pages.module.css'

export default function SavedPage() {
  const { companyId, saved, savedTotal } = useWorkspace()
  const { data: company } = useCompany(companyId)
  // бэк не хранит сохранённое — отметки локальные, новости подтягиваем по id
  const articles = useQueries({
    queries: saved.map((id) => ({
      queryKey: articleKeys.one(id),
      queryFn: ({ signal }: { signal: AbortSignal }) => articleApi.get(id, signal),
      retry: false,
    })),
  })

  const pending = articles.some((q) => q.isPending)
  const list = articles.flatMap((q) => (q.data ? [q.data] : []))
  const missing = articles.filter((q) => q.isError).length
  // сохранённое по другим компаниям не раскрываем в текущем контексте — только счётчик
  const elsewhere = savedTotal - saved.length
  const name = company?.name?.trim() || companyId

  return (
    <>
      <PageHead
        crumb="Сохранённое"
        title="Сохранённые события"
        subtitle={`${name} · События, к которым вы хотите вернуться`}
      />

      {pending && (
        <StateCard
          kind="loading"
          title="Загружаем сохранённое"
          text="Получаем сохранённые публикации из источников."
        />
      )}

      {!pending && list.length === 0 && (
        <StateCard
          kind="empty"
          title="Пока ничего не сохранено"
          text={`Отмечайте события в сводке кнопкой «Сохранить» — они появятся здесь в контексте ${companyId}.`}
          action={<Button to="/digest">Открыть сводку</Button>}
        />
      )}

      {list.length > 0 && (
        <div className={s.col} style={{ gap: 0 }}>
          {list.map((a) => (
            <EventCard key={a.id} article={a} />
          ))}
        </div>
      )}

      {missing > 0 && (
        <p className="t-12 c-muted">
          {missing}{' '}
          {plural(
            missing,
            'публикация недоступна',
            'публикации недоступны',
            'публикаций недоступны',
          )}{' '}
          — источник мог удалить материал.
        </p>
      )}

      {elsewhere > 0 && (
        <p className="t-12 c-muted">
          Ещё {elsewhere}{' '}
          {plural(
            elsewhere,
            'сохранённое событие относится',
            'сохранённых события относятся',
            'сохранённых событий относятся',
          )}{' '}
          к другим компаниям — они видны после переключения компании.
        </p>
      )}
    </>
  )
}
