import { topicLabel, type ArticleTopic } from '../api/articleTypes'
import { formatDecimal, place, plural } from '../api/companyFormat'
import { useCompany } from '../api/companyHooks'
import type { CompanyNewsItem } from '../api/companyNewsTypes'
import type { Company } from '../api/companyTypes'
import { FeedCard } from '../components/FeedCard'
import { Icon } from '../components/Icons'
import { cx } from '../components/cx'
import { Button, Dropdown, MenuItem, StateCard, Tag } from '../components/ui'
import { PageHead } from '../layout/AppLayout'
import { roleFocus, shortRole } from '../mocks/data'
import { useWorkspace } from '../state/context'
import h from './digest.module.css'
import s from './pages.module.css'
import { useDigestFeed } from './useDigestFeed'

const topics = Object.keys(topicLabel) as ArticleTopic[]

const today = () => new Date().toLocaleDateString('ru-RU', { dateStyle: 'long' })

/** Признаки компании, по которым подбираются события: продукты банка и страна импорта */
const companySigns = (c: Company) =>
  [
    c.has_credit && 'Кредиты',
    c.has_leasing && 'Лизинг',
    c.has_factoring && 'Факторинг',
    c.fts_country_name && `Импорт ${c.fts_country_name}`,
  ]
    .filter(Boolean)
    .join(' · ')

export default function DigestPage() {
  const { companyId, role, saved } = useWorkspace()
  const { data: company } = useCompany(companyId)
  const { feed, first, all, visible, fresh, filters, set, reset, filtered, refresh } =
    useDigestFeed(companyId)
  // главный вывод дня — самая релевантная новость ленты
  const top = all[0]
  const notAssessed = all.filter((n) => n.assessment_status !== 'ready').length

  const showFresh = () => {
    refresh()
    document.getElementById('feed')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      <PageHead crumb="Сводка" title="Сводка дня" subtitle={`${today()} · ${companyId}`} />

      {!companyId && (
        <StateCard
          kind="empty"
          title="Компания не выбрана"
          text="Сводка строится по профилю компании. Добавьте компанию или выберите её в списке."
          action={<Button to="/companies">К компаниям</Button>}
        />
      )}

      {companyId && feed.isPending && (
        <StateCard
          kind="loading"
          title="Готовим контекст компании"
          text="Ожидаем профиль и разрешённые источники. Ранжирование ещё не сформировано."
          note="Ожидание данных · результатов пока нет"
        />
      )}

      {feed.isError && (
        <StateCard
          kind="error"
          title="Сводка недоступна"
          text="Не удалось получить новости для компании. Ответ по ним не сформирован."
          action={<Button onClick={() => feed.refetch()}>Повторить загрузку</Button>}
        />
      )}

      {first && (
        <div className={h.layout}>
          <div className={h.feed}>
            {/* Заметная точка входа в сервис (критерий 09): главный вывод дня */}
            {top && <Hero item={top} />}

            <div id="feed" className={h.controls}>
              <div className={s.row} style={{ gap: 8 }}>
                <Dropdown
                  label="Фильтр по теме"
                  trigger={
                    <span className={s.filterTrigger}>
                      Тема: {filters.topic ? topicLabel[filters.topic] : 'все'}{' '}
                      <Icon name="chevronDown" size={12} />
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
                          {topicLabel[t]}
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
                  pressed={!filters.relevantOnly}
                  onClick={() => set({ relevantOnly: !filters.relevantOnly })}
                >
                  {filters.relevantOnly ? '□' : '■'} Все новости
                </Button>
                {/* лента пока не отмечает новости с материалами банка — включим, когда бэк их отдаст */}
                <Button
                  disabled
                  title="Фильтр появится, когда лента начнёт отмечать материалы банка"
                >
                  □ Только аналитика банка
                </Button>
              </div>
              <div className={`${s.row} ${s.between}`}>
                <p className="t-12 c-muted">
                  По релевантности ↓ · {first.total}{' '}
                  {plural(first.total, 'новость', 'новости', 'новостей')} ·{' '}
                  {first.ranking_method === 'hybrid'
                    ? 'правила и смысловая близость к профилю'
                    : 'по правилам профиля'}
                </p>
                <Button onClick={refresh} disabled={feed.isFetching}>
                  {feed.isFetching && !feed.isFetchingNextPage
                    ? 'Обновляем сводку…'
                    : 'Обновить сводку'}
                </Button>
              </div>
              {first.personalization_status === 'preparing' && (
                <p className="t-12 c-muted" role="status">
                  Персонализация готовится — пока лента ранжирована по явным правилам профиля.
                </p>
              )}
              {fresh > 0 && (
                <Button variant="primary" onClick={showFresh}>
                  ↑ {fresh}{' '}
                  {plural(fresh, 'новая публикация', 'новые публикации', 'новых публикаций')} —
                  показать
                </Button>
              )}
            </div>

            {visible.length === 0 && (
              <StateCard
                kind="empty"
                title={filtered ? 'По фильтрам ничего не найдено' : 'Новостей пока нет'}
                text={
                  filtered
                    ? 'Измените условия или сбросьте фильтры.'
                    : filters.relevantOnly
                      ? 'Совпадений с профилем компании в источниках пока нет. Можно посмотреть все новости.'
                      : 'Источники ещё не прислали публикаций. Сводка обновится автоматически.'
                }
                action={
                  filtered ? (
                    <Button onClick={reset}>Сбросить фильтры</Button>
                  ) : (
                    filters.relevantOnly && (
                      <Button onClick={() => set({ relevantOnly: false })}>Все новости</Button>
                    )
                  )
                }
              />
            )}

            {visible.map((n) => (
              <FeedCard key={n.id} item={n} rank={all.indexOf(n) + 1} />
            ))}

            {feed.hasNextPage && (
              <Button onClick={() => feed.fetchNextPage()} disabled={feed.isFetchingNextPage}>
                {feed.isFetchingNextPage ? 'Загружаем…' : 'Показать ещё'}
              </Button>
            )}

            <div className={s.row}>
              <Button to="/saved">Показать сохранённое · {saved.length}</Button>
              {filtered && visible.length > 0 && <Button onClick={reset}>Сбросить фильтры</Button>}
            </div>
          </div>

          <aside className={h.aside}>
            <section className={h.panel}>
              <h2 className="t-h2">Почему именно вам</h2>
              <Tag variant="red">
                {companyId} / {shortRole(role)}
              </Tag>
              <div className={h.facts}>
                <Fact label="Компания" value={company?.name?.trim() || companyId} />
                <Fact
                  label="Выручка / регион"
                  value={
                    company &&
                    [formatDecimal(company.annual_revenue), place(company)]
                      .filter(Boolean)
                      .join(' / ')
                  }
                />
                <Fact label="Ключевые признаки" value={company && companySigns(company)} />
              </div>
              <Button to="/profile">Профиль и доказательства →</Button>
            </section>
            <section className={cx(h.panel, h.panelGreen)}>
              <h2 className="t-h2">Задачи роли</h2>
              <ol className={h.tasks}>
                {(roleFocus[role]?.tasks ?? []).map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ol>
            </section>
            <section className={h.panel}>
              <h2 className="t-h2">Что не подтверждено</h2>
              <div className={h.unconfirmed}>
                <p>
                  {notAssessed > 0
                    ? `Влияние ${notAssessed} из ${all.length} ${plural(all.length, 'новости', 'новостей', 'новостей')} на компанию ещё не оценено — риски и возможности по ним не показаны.`
                    : 'Влияние всех показанных новостей оценено.'}
                </p>
                {first.ranking_note && <p>{first.ranking_note}</p>}
                <p className={h.note}>
                  Позиция банка появляется в разборе только по подтверждённым материалам банка.
                </p>
              </div>
            </section>
          </aside>
        </div>
      )}
    </>
  )
}

function Hero({ item }: { item: CompanyNewsItem }) {
  return (
    <section className={h.hero}>
      <div className={h.heroHead}>
        <span className={h.heroTag}>AI · Условный бизнес-эффект</span>
        <h2 className={h.heroTitle}>{item.title}</h2>
      </div>
      <p className={h.heroText}>{item.brief_impact || item.summary}</p>
      <div className={h.heroFoot}>
        <p className={h.heroBasis}>
          <b>Основание:</b> {item.relevance_reasons.join('; ') || 'совпадение с профилем компании'}
        </p>
        <button
          type="button"
          className={h.heroLink}
          onClick={() => document.getElementById('feed')?.scrollIntoView({ behavior: 'smooth' })}
        >
          К сводке
          <Icon name="arrowUpRight" size={14} strokeWidth={2} />
        </button>
      </div>
    </section>
  )
}

function Fact({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className={h.fact}>
      <span className={h.factLabel}>{label}</span>
      <span className={h.factValue}>{value || '—'}</span>
    </div>
  )
}
