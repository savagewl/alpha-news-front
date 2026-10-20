import { useState } from 'react'
import { Button, Divider, Panel, Tag } from '../components/ui'
import { PageHead } from '../layout/AppLayout'
import { companies, roles } from '../mocks/data'
import s from './pages.module.css'

export default function CompaniesPage() {
  const [query, setQuery] = useState('')
  const [companyId, setCompanyId] = useState('U001')
  const [role, setRole] = useState('Финансовый директор')

  const q = query.trim().toLowerCase()
  const visible = companies.filter(
    (c) => !q || c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q),
  )

  return (
    <>
      <PageHead
        crumb="Компании"
        title="Сначала — контекст бизнеса"
        subtitle="6 компаний · обезличенный набор данных кейса. Это не клиентские данные банка."
      />

      <div className={s.row} style={{ gap: 24 }}>
        <div className={`${s.col} ${s.grow}`} style={{ gap: 16 }}>
          <input
            className={s.search}
            placeholder="⌕ Поиск по названию или ID компании"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {visible.map((c) => {
            const selected = c.id === companyId
            return (
              <article key={c.id} className={`${s.company} ${selected ? s.companySelected : ''}`}>
                <div className={s.companyTop}>
                  <Tag variant={selected ? 'red' : 'neutral'}>ID {c.id}</Tag>
                  {selected ? (
                    <Tag>✓ Выбрана</Tag>
                  ) : (
                    <button type="button" className={s.pick} onClick={() => setCompanyId(c.id)}>
                      <Tag>Выбрать →</Tag>
                    </button>
                  )}
                </div>
                <h2 className="t-h3">{c.name}</h2>
                <p className="t-15">{c.industry}</p>
                <p className="t-12 c-muted">{c.region}</p>
                <p className="t-12">{c.products}</p>
                <p className="t-12 c-muted">{c.fts}</p>
              </article>
            )
          })}
        </div>

        <div className={`${s.col} ${s.side330}`} style={{ gap: 16 }}>
          <Panel>
            <h2 className="t-h2">Ваша роль</h2>
            <p className="t-13">
              Роль меняет порядок событий и вопросы к бизнесу, но не расширяет права доступа.
            </p>
            <Tag variant="red">{role} ⌃</Tag>
            <Divider />
            {roles.map((r) => (
              <button
                key={r}
                type="button"
                className={`${s.roleOption} ${r === role ? s.roleOptionActive : ''}`}
                onClick={() => setRole(r)}
              >
                {r === role ? `✓ ${r}` : r}
              </button>
            ))}
            <Button variant="primary" to="/digest">
              Открыть сводку →
            </Button>
          </Panel>
          <Panel>
            <h2 className="t-h2">Без подмены контекста</h2>
            <p className="t-13">U001 / CFO — ставка и капвложения</p>
            <p className="t-13">U002 / Казначейство — платежи и логистика</p>
            <p className="t-13">U003 / CEO — золото и стратегия</p>
            <p className="t-12 c-muted">
              Доступ к компании проверяется до отбора данных. Показан раскрытый список ролей.
            </p>
          </Panel>
        </div>
      </div>
    </>
  )
}
