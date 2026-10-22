import { useDigest } from '../api/newsHooks'
import { EventCard } from '../components/EventCard'
import { Button, StateCard } from '../components/ui'
import { PageHead } from '../layout/AppLayout'
import { plural } from '../mocks/api'
import { findCompany } from '../mocks/data'
import { useWorkspace } from '../state/context'
import s from './pages.module.css'

export default function SavedPage() {
  const { companyId, role, saved } = useWorkspace()
  const company = findCompany(companyId)
  const digest = useDigest(companyId, role)

  const events = digest.data?.events ?? []
  const list = events.filter((e) => saved.includes(e.id))
  // сохранённое по другим компаниям не раскрываем в текущем контексте — только счётчик
  const elsewhere = saved.length - list.length

  return (
    <>
      <PageHead
        crumb="Сохранённое"
        title="Сохранённые события"
        subtitle={`${company.name} · ${company.id} · События, к которым вы хотите вернуться`}
      />

      {digest.isPending && (
        <StateCard
          kind="loading"
          title="Загружаем сохранённое"
          text="Сверяем отметки со сводкой компании."
        />
      )}

      {digest.data && list.length === 0 && (
        <StateCard
          kind="empty"
          title="Пока ничего не сохранено"
          text={`Отмечайте события в сводке кнопкой «Сохранить» — они появятся здесь в контексте ${company.id}.`}
          action={<Button to="/digest">Открыть сводку</Button>}
        />
      )}

      {list.length > 0 && (
        <div className={s.col} style={{ gap: 0 }}>
          {list.map((e) => (
            <EventCard key={e.id} event={e} rank={events.indexOf(e) + 1} />
          ))}
        </div>
      )}

      {digest.data && elsewhere > 0 && (
        <p className="t-12 c-muted">
          Ещё{' '}
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
