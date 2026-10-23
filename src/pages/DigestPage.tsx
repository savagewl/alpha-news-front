import { formatDecimal, place } from '../api/companyFormat'
import { useCompany } from '../api/companyHooks'
import type { Company } from '../api/companyTypes'
import { ArticleCard } from '../components/ArticleCard'
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
  const { digest, pull, onPull, articles, filters, set, reset, filtered, all, topics, visible } =
    useDigestFeed(companyId, role)
  const data = digest.data
  const [basisHead, basisRest] = splitBasis(data?.hero.basis ?? '')

  return (
    <>
      <PageHead
        crumb="Сводка"
        title={data?.title ?? 'Сводка дня'}
        subtitle={`${data?.date ?? '11 сентября 2026'} · ${companyId}`}
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

      {data && (
        <div className={h.layout}>
          <div className={h.feed}>
            {/* Заметная точка входа в сервис (критерий 09): главный вывод дня */}
            <section className={h.hero}>
              <div className={h.heroHead}>
                <span className={h.heroTag}>AI · Условный бизнес-эффект</span>
                <h2 className={h.heroTitle}>{data.hero.lines.join(' ')}</h2>
              </div>
              <p className={h.heroText}>{data.hero.text}</p>
              <div className={h.heroFoot}>
                <p className={h.heroBasis}>
                  {basisHead && <b>{basisHead}</b>} {basisRest}
                </p>
                <button
                  type="button"
                  className={h.heroLink}
                  onClick={() =>
                    document.getElementById('feed')?.scrollIntoView({ behavior: 'smooth' })
                  }
                >
                  К сводке
                  <Icon name="arrowUpRight" size={14} strokeWidth={2} />
                </button>
              </div>
            </section>

            <div id="feed" className={h.controls}>
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
                  {pull.isPending ? 'Ищем свежие публикации…' : 'Подгрузить новую новость'}
                </Button>
              </div>
              {pull.isSuccess && pull.data === null && (
                <p className="t-12 c-muted" role="status">
                  Новых публикаций в источниках пока нет — сводка актуальна.
                </p>
              )}
              {pull.isError && (
                <p className="t-12 c-red" role="alert">
                  Не удалось получить публикации. Попробуйте ещё раз.
                </p>
              )}
            </div>

            {/* Свежие публикации из RSS — сверху: они ещё не прошли отбор под компанию */}
            {articles.map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}

            {visible.length === 0 && (
              <StateCard
                kind="empty"
                title={filtered ? 'По фильтрам ничего не найдено' : 'Событий пока нет'}
                text={
                  filtered
                    ? 'Измените условия или сбросьте фильтры.'
                    : 'Для этой компании ещё не отобраны события. Свежие публикации из источников можно подгрузить кнопкой выше.'
                }
                action={filtered && <Button onClick={reset}>Сбросить фильтры</Button>}
              />
            )}

            {visible.map((e) => (
              <FeedCard key={e.id} event={e} rank={all.indexOf(e) + 1} />
            ))}

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
                <p>{data.unconfirmed.text}</p>
                <p className={h.note}>
                  Аналитика банка: доступны заголовки, полные тексты не предоставлены.
                </p>
              </div>
            </section>
          </aside>
        </div>
      )}
    </>
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

/** «Основание: …» → жирная подпись и текст основания */
function splitBasis(basis: string): [string, string] {
  const m = /^(Основание:)\s*(.*)$/s.exec(basis)
  return m ? [m[1], m[2]] : ['', basis]
}
