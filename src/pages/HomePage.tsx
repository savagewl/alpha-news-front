import { useDigest } from '../api/newsHooks'
import { BrandKey, Button, Divider, Field, Panel, Tag } from '../components/ui'
import { PageHead } from '../layout/AppLayout'
import { findCompany, shortRole } from '../mocks/data'
import { useWorkspace } from '../state/context'
import s from './pages.module.css'

// Банковская часть главной — статичная обвязка: сервис не трогает счета и платежи
const accounts = [
  { label: 'Основной · рублёвый', value: '128 650 000 ₽' },
  { label: 'Операционный · рублёвый', value: '80 000 000 ₽' },
  { label: 'Резервный · рублёвый', value: '40 000 000 ₽' },
]

const operations = [
  { name: 'Поступление · F104', amount: '+18 400 000 ₽ · Исполнено' },
  { name: 'Оплата материалов · F208', amount: '−6 250 000 ₽ · Исполнено' },
  { name: 'Лизинговый платёж · F302', amount: '−2 800 000 ₽ · Исполнено' },
  { name: 'Фонд оплаты труда', amount: '−12 600 000 ₽ · На согласовании' },
]

const tasks = [
  { label: 'Сегодня', value: 'Согласовать 18 платежей' },
  { label: '14 сентября', value: 'Проверить остатки под налоги' },
  { label: 'Кредитный портфель', value: 'Обновить сценарий бюджета' },
]

export default function HomePage() {
  const { companyId, role } = useWorkspace()
  const company = findCompany(companyId)
  const digest = useDigest(companyId, role)
  const top = digest.data?.events[0]

  return (
    <>
      <PageHead
        section={null}
        crumb="Главная"
        title="Ваш бизнес. Всё под контролем."
        subtitle={`${company.name} · ${company.id}`}
      />

      <div className={s.grid2}>
        <Panel>
          <h2 className="t-h2">Общий баланс</h2>
          <p className={s.amount}>248 650 000 ₽</p>
          <p className="t-12 c-muted">3 расчётных счёта</p>
          <div className={s.row}>
            <Button variant="primary" disabled title="Недоступно в прототипе">
              Создать платёж
            </Button>
            <Button disabled title="Недоступно в прототипе">
              Реквизиты
            </Button>
          </div>
        </Panel>
        <Panel>
          <h2 className="t-h2">Ликвидность</h2>
          <Field label="Свободно для размещения" value="120 000 000 ₽" />
          <Field label="Платежи на согласование" value="18 поручений · 42,6 млн ₽" />
        </Panel>
      </div>

      <Panel>
        <h2 className="t-h2">Счета компании</h2>
        <div className={s.grid3}>
          {accounts.map((a) => (
            <Field key={a.label} label={a.label} value={a.value} />
          ))}
        </div>
      </Panel>

      {/* Заметная и постоянно доступная точка входа в сервис (критерий 09) */}
      <section className={s.lime}>
        <div className={`${s.col} ${s.grow}`} style={{ gap: 12 }}>
          <p className={s.eyebrow}>АЛЬФА БУДУЩЕЕ / FINANCIAL INTELLIGENCE</p>
          <h2 className={s.limeTitle}>
            Не просто новости.
            <br />
            Контекст для ваших решений.
          </h2>
          <p className="t-15">
            {top
              ? `${top.title}: ${lowerFirst(top.text)}`
              : 'Готовим сводку под вашу компанию и роль…'}
          </p>
          <div className={s.row} style={{ gap: 16 }}>
            <Button variant="primary" to="/digest">
              Новостная аналитика →
            </Button>
            {digest.data && (
              <Tag>
                {digest.data.events.length} приоритетов для {shortRole(role)}
              </Tag>
            )}
          </div>
        </div>
        <BrandKey to={top ? `/events/${top.id}` : '/digest'} label="Открыть главное событие дня" />
      </section>

      <div className={s.split}>
        <Panel>
          <h2 className="t-h2">Последние операции</h2>
          <div className={s.tableWrap}>
            <table className={`${s.table} ${s.tableLg}`}>
              <thead>
                <tr>
                  <th>Операция / обезличенный контрагент</th>
                  <th>Сумма · статус</th>
                </tr>
              </thead>
              <tbody>
                {operations.map((o) => (
                  <tr key={o.name}>
                    <td>{o.name}</td>
                    <td className="t-semibold">{o.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
        <Panel>
          <h2 className="t-h2">Ближайшие задачи</h2>
          {tasks.map((t, i) => (
            <div key={t.label} className={s.col}>
              {i > 0 && <Divider />}
              <Field label={t.label} value={t.value} />
            </div>
          ))}
        </Panel>
      </div>
    </>
  )
}

const lowerFirst = (t: string) => t.charAt(0).toLowerCase() + t.slice(1)
