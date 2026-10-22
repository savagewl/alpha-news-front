import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Divider, Panel, StateCard, Tag } from '../components/ui'
import { cx } from '../components/cx'
import { PageHead } from '../layout/AppLayout'
import { companies, roles } from '../mocks/data'
import { useWorkspace } from '../state/context'
import s from './pages.module.css'

const ftsLine = (flag: boolean | null, countries: string[]) =>
  flag === null
    ? 'ФТС: нет данных'
    : countries.length
      ? `Импорт: ${countries.join(', ')}`
      : 'ФТС: нет'

export default function CompaniesPage() {
  const navigate = useNavigate()
  const { companyId, role, setCompany, setRole } = useWorkspace()
  const [query, setQuery] = useState('')

  const q = query.trim().toLowerCase()
  const visible = companies.filter(
    (c) => !q || c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q),
  )

  return (
    <>
      <PageHead
        crumb="Компании"
        title="Сначала — контекст бизнеса"
        subtitle="Компания и роль определяют, какие события попадут в сводку."
      />

      <div className={`${s.split} ${s.split330}`}>
        <div className={s.col}>
          <input
            className={s.search}
            type="search"
            aria-label="Поиск компании"
            placeholder="⌕ Поиск по названию или SYNTHETIC_U"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {visible.length === 0 && (
            <StateCard
              kind="empty"
              title="Компания не найдена"
              text={`По запросу «${query}» нет совпадений. Ищите по названию или идентификатору вида U001.`}
              action={<Button onClick={() => setQuery('')}>Сбросить поиск</Button>}
            />
          )}
          {visible.map((c) => {
            const selected = c.id === companyId
            return (
              <button
                key={c.id}
                type="button"
                className={cx(s.company, selected && s.companySelected)}
                aria-pressed={selected}
                onClick={() => setCompany(c.id)}
              >
                <span className={s.companyTop}>
                  <Tag variant={selected ? 'red' : 'neutral'}>{c.id}</Tag>
                  <Tag>{selected ? '✓ Выбрана' : 'Выбрать →'}</Tag>
                </span>
                <span className="t-h3">{c.name}</span>
                <span className="t-15">
                  {c.industry} · {c.okved} · {c.revenue}
                </span>
                <span className="t-12 c-muted">
                  {c.city}
                  {c.region !== c.city && ` / ${c.region}`} · {c.group}
                </span>
                <span className="t-12">{c.products.join(' / ')}</span>
                <span className="t-12 c-muted">{ftsLine(c.fts.flag, c.fts.countries)}</span>
              </button>
            )
          })}
        </div>

        <div className={s.aside}>
          <Panel>
            <h2 className="t-h2">Ваша роль</h2>
            <p className="t-13">
              Роль меняет порядок событий и вопросы к бизнесу, но не расширяет права доступа.
            </p>
            <Tag variant="red">{role}</Tag>
            <Divider />
            <div role="radiogroup" aria-label="Роль">
              {roles.map((r) => (
                <button
                  key={r}
                  type="button"
                  role="radio"
                  aria-checked={r === role}
                  className={cx(s.roleOption, r === role && s.roleOptionActive)}
                  onClick={() => setRole(r)}
                >
                  {r === role ? `✓ ${r}` : r}
                </button>
              ))}
            </div>
            <Button variant="primary" onClick={() => navigate('/digest')}>
              Открыть сводку →
            </Button>
          </Panel>
        </div>
      </div>
    </>
  )
}
