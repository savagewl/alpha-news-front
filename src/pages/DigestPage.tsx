import { useState } from 'react'
import { useDigest, usePullNews } from '../api/newsHooks'
import type { Topic } from '../api/newsTypes'
import { EventCard } from '../components/EventCard'
import { Icon } from '../components/Icons'
import {
  BrandKey,
  Button,
  Dropdown,
  Field,
  Legend,
  MenuItem,
  Panel,
  StateCard,
  Tag,
} from '../components/ui'
import { PageHead } from '../layout/AppLayout'
import { findCompany, roleFocus, shortRole } from '../mocks/data'
import { useWorkspace } from '../state/context'
import s from './pages.module.css'

interface Filters {
  topic: Topic | null
  risks: boolean
  opportunities: boolean
  bankOnly: boolean
}

const noFilters: Filters = { topic: null, risks: false, opportunities: false, bankOnly: false }

export default function DigestPage() {
  const { companyId, role, saved } = useWorkspace()
  const company = findCompany(companyId)
  const digest = useDigest(companyId, role)
  const pull = usePullNews(companyId)
  const [filters, setFilters] = useState<Filters>(noFilters)
  const [freshIds, setFreshIds] = useState<string[]>([])

  const set = (patch: Partial<Filters>) => setFilters((f) => ({ ...f, ...patch }))
  const filtered = !!(filters.topic || filters.risks || filters.opportunities || filters.bankOnly)

  const all = digest.data?.events ?? []
  const topics = [...new Set(all.map((e) => e.topic))]
  const visible = all.filter(
    (e) =>
      (!filters.topic || e.topic === filters.topic) &&
      // «Риски» и «Возможности» вместе — то же, что без фильтра по типу
      (filters.risks === filters.opportunities ||
        (filters.risks ? e.kind === 'risk' : e.kind === 'opportunity')) &&
      (!filters.bankOnly || !!e.bankRef),
  )

  const onPull = () =>
    pull.mutate(undefined, {
      onSuccess: (event) => event && setFreshIds((ids) => [...ids, event.id]),
    })

  const roleTag = `${company.id} / ${shortRole(role)}`

  return (
    <>
      <PageHead
        crumb="Сводка"
        title={digest.data?.title ?? 'Сводка дня'}
        subtitle={`${digest.data?.date ?? '11 сентября 2026'} · ${company.id} · ${role}`}
      />

      {digest.isPending && (
        <StateCard
          kind="loading"
          title="Готовим контекст компании"
          text="Ожидаем профиль и разрешённые источники. Ранжирование ещё не сформировано."
          note="Ожидание данных · результатов пока нет"
        />
      )}

      {digest.isError && (
        <StateCard
          kind="error"
          title="Сводка недоступна"
          text="Не удалось получить события для компании. Ответ по ним не сформирован."
          action={<Button onClick={() => digest.refetch()}>Повторить загрузку</Button>}
        />
      )}

      {digest.data && (
        <>
          <section className={s.lime}>
            <div className={`${s.col} ${s.grow}`} style={{ gap: 12 }}>
              <Tag>✦ Вывод AI</Tag>
              <h2 className={s.limeTitle}>
                {digest.data.hero.lines.map((l, i) => (
                  <span key={l}>
                    {i > 0 && <br />}
                    {l}
                  </span>
                ))}
              </h2>
              <p className="t-15">{digest.data.hero.text}</p>
              <p className="t-12">{digest.data.hero.basis}</p>
            </div>
            {all[0] && <BrandKey to={`/events/${all[0].id}`} label="Разобрать главное событие" />}
          </section>

          <Legend />

          <div className={s.split}>
            <div className={s.col} style={{ gap: 8 }}>
              <div className={s.row} style={{ gap: 8 }}>
                <Dropdown
                  label="Фильтр по теме"
                  trigger={
                    <span className={s.filterTrigger}>
                      Тема: {filters.topic ?? 'все'} <Icon name="chevronDown" size={12} />
                    </span>
                  }
                >
                  {(close) => (
                    <>
                      <MenuItem
                        active={!filters.topic}
                        onSelect={() => {
                          set({ topic: null })
                          close()
                        }}
                      >
                        Все темы
                      </MenuItem>
                      {topics.map((t) => (
                        <MenuItem
                          key={t}
                          active={filters.topic === t}
                          onSelect={() => {
                            set({ topic: t })
                            close()
                          }}
                        >
                          {t}
                        </MenuItem>
                      ))}
                    </>
                  )}
                </Dropdown>
                <Button pressed={filters.risks} onClick={() => set({ risks: !filters.risks })}>
                  △ Риски
                </Button>
                <Button
                  pressed={filters.opportunities}
                  onClick={() => set({ opportunities: !filters.opportunities })}
                >
                  ↗ Возможности
                </Button>
                <Button
                  pressed={filters.bankOnly}
                  onClick={() => set({ bankOnly: !filters.bankOnly })}
                >
                  {filters.bankOnly ? '■' : '□'} Только аналитика банка
                </Button>
              </div>
              <div className={`${s.row} ${s.between}`}>
                <p className="t-12 c-muted">
                  По релевантности ↓ · с учётом роли «{shortRole(role)}»
                </p>
                <Button onClick={onPull} disabled={pull.isPending}>
                  {pull.isPending ? 'Ищем новые события…' : 'Подгрузить новую новость'}
                </Button>
              </div>
              {pull.isSuccess && pull.data === null && (
                <p className="t-12 c-muted" role="status">
                  Новых событий для {company.shortName} пока нет — сводка актуальна.
                </p>
              )}
              {/* Новость встаёт на место по релевантности, а не наверх — поэтому сообщаем, куда */}
              {pull.data && all.some((e) => e.id === pull.data?.id) && (
                <p className="t-13" role="status">
                  Добавлено: «{pull.data.title}» →{' '}
                  {all.findIndex((e) => e.id === pull.data?.id) + 1}
                  -е место по релевантности.{' '}
                  <button
                    type="button"
                    className={s.linkButton}
                    onClick={() =>
                      document
                        .getElementById(`event-${pull.data?.id}`)
                        ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                    }
                  >
                    Показать →
                  </button>
                </p>
              )}

              {visible.length === 0 && (
                <StateCard
                  kind="empty"
                  title="По фильтрам ничего не найдено"
                  text="Измените условия или сбросьте фильтры."
                  action={<Button onClick={() => setFilters(noFilters)}>Сбросить фильтры</Button>}
                />
              )}

              {visible.map((e) => (
                <EventCard
                  key={e.id}
                  event={e}
                  rank={all.indexOf(e) + 1}
                  isNew={freshIds.includes(e.id)}
                />
              ))}

              <div className={s.row} style={{ marginTop: 12 }}>
                <Button to="/saved">Показать сохранённое · {saved.length}</Button>
                {filtered && visible.length > 0 && (
                  <Button onClick={() => setFilters(noFilters)}>Сбросить фильтры</Button>
                )}
              </div>
            </div>

            <div className={s.aside}>
              <Panel>
                <h2 className="t-h2">Почему именно вам</h2>
                <Tag variant="red">{roleTag}</Tag>
                <Field label="Компания" value={company.shortName} />
                <Field label="Выручка / регион" value={`${company.revenue} / ${company.city}`} />
                <Field
                  label="Ключевые признаки"
                  value={[
                    ...company.products.slice(0, 2),
                    company.fts.countries.length && `Импорт ${company.fts.countries.join(' / ')}`,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                />
                <Button to="/profile">Профиль и доказательства →</Button>
              </Panel>
              <Panel green>
                <h2 className="t-h2">Задачи роли</h2>
                <ol className={s.numbered}>
                  {(roleFocus[role]?.tasks ?? []).map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ol>
              </Panel>
              <Panel>
                <h2 className="t-h2">Что не подтверждено</h2>
                <p className="t-13">{digest.data.unconfirmed.text}</p>
              </Panel>
            </div>
          </div>
        </>
      )}
    </>
  )
}
