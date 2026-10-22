import { useState } from 'react'
import { Button, Field, Panel, Tag } from '../components/ui'
import { PageHead } from '../layout/AppLayout'
import { findCompany } from '../mocks/data'
import { useWorkspace } from '../state/context'
import a from './auth.module.css'
import s from './pages.module.css'

/** Пустое поле набора показываем как «Нет данных», а не прячем: пробелы влияют на вывод */
const orMissing = (v: string | null | undefined) =>
  v ? v : <span className="c-muted">Нет данных</span>

export default function ProfilePage() {
  const { companyId, notes, setNote } = useWorkspace()
  const c = findCompany(companyId)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')

  const kpis = [
    { label: 'Выручка', value: c.revenue },
    { label: 'Основной ОКВЭД', value: c.okved },
    { label: 'Группа', value: c.group },
    { label: 'Доля рынка', value: c.marketShare },
  ]
  const fts =
    c.fts.flag === null
      ? null
      : c.fts.flag
        ? `FTS_FLAG: да · Импорт из ${c.fts.countries.join(' и ')}`
        : 'FTS_FLAG: нет'
  const note = notes[c.id]

  const startEdit = () => {
    setDraft(note ?? '')
    setEditing(true)
  }

  return (
    <>
      <PageHead
        crumb="Профиль компании"
        title={c.name}
        subtitle={`${c.id} · Срез 11 сентября 2026`}
      />

      <div className={s.grid4}>
        {kpis.map((k) => (
          <Panel key={k.label}>
            <Field label={k.label} value={orMissing(k.value)} />
          </Panel>
        ))}
      </div>

      <div className={`${s.split} ${s.split330}`}>
        <div className={s.col} style={{ gap: 20 }}>
          <Panel>
            <h2 className="t-h2">Производство и масштаб</h2>
            <Field label="Отрасль и основная деятельность" value={c.okvedName} />
            <div className={s.grid2}>
              <Field label="Масштаб / стадия" value={c.scale} />
              <Field
                label="Возраст / численность"
                value={
                  <>
                    {orMissing(c.age)} / {orMissing(c.workers)}
                  </>
                }
              />
            </div>
            <Field label="Регион / группа" value={`${c.city}, ${c.region} / ${c.group}`} />
            <p className="t-13">Положение на рынке: {c.marketPosition}</p>
          </Panel>
          <Panel>
            <h2 className="t-h2">Банковский и внешнеторговый контекст</h2>
            <Field label="Продукты" value={c.products.join(' · ')} />
            <Field label="Внешняя торговля" value={orMissing(fts)} />
            <Field label="Виды деятельности" value={orMissing(c.activities)} />
            <div className={s.row}>
              <Tag>ORG_TYPE: {c.orgType}</Tag>
              <Tag>{c.okfs ?? 'OKFS_NAME: нет данных'}</Tag>
            </div>
          </Panel>
        </div>

        <div className={s.aside}>
          <Panel green>
            <h2 className="t-h2">Что влияет на отбор</h2>
            <ol className={s.numbered}>
              {c.selection.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ol>
          </Panel>
          <Panel>
            <h2 className="t-h2">Полнота профиля</h2>
            <p className={s.bigStatus}>{c.completeness.status}</p>
            <p className="t-13">{c.completeness.text}</p>
            {editing ? (
              <form
                className={s.col}
                style={{ gap: 10 }}
                onSubmit={(e) => {
                  e.preventDefault()
                  setNote(c.id, draft)
                  setEditing(false)
                }}
              >
                <label className="t-12 c-muted" htmlFor="profile-note">
                  Чего не хватает: условия кредитов, график CAPEX, ключевые контракты
                </label>
                <textarea
                  id="profile-note"
                  className={a.textarea}
                  rows={4}
                  value={draft}
                  placeholder="Например: кредит 2 млрд ₽ с плавающей ставкой до 2028 года"
                  onChange={(e) => setDraft(e.target.value)}
                />
                <div className={s.row}>
                  <Button variant="primary" type="submit">
                    Сохранить
                  </Button>
                  <Button onClick={() => setEditing(false)}>Отмена</Button>
                </div>
              </form>
            ) : (
              <Button onClick={startEdit}>
                {note ? 'Изменить дополнение' : 'Уточнить профиль'}
              </Button>
            )}
            {note && !editing && (
              <div className={s.col} style={{ gap: 8 }}>
                <Tag variant="red">Дополнено пользователем · не проверено</Tag>
                <p className="t-13">{note}</p>
              </div>
            )}
          </Panel>
        </div>
      </div>

      <Panel>
        <h2 className="t-h2">Связи и ключевые контрагенты</h2>
        <p className="t-12 c-muted">Платежи за август 2026 · контрагенты обезличены</p>
        {c.links.length ? (
          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th>Контрагент / регион</th>
                  <th>Направление</th>
                  <th>Объём</th>
                  <th>Количество</th>
                </tr>
              </thead>
              <tbody>
                {c.links.map((l) => (
                  <tr key={l.who}>
                    <td>{l.who}</td>
                    <td>{l.direction}</td>
                    <td>{l.amount}</td>
                    <td>{l.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="t-15">Платёжные связи компании не заполнены.</p>
        )}
      </Panel>
    </>
  )
}
