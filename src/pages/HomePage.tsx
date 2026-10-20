import { BrandKey, Button, Divider, Field, Panel, Tag } from '../components/ui'
import { PageHead } from '../layout/AppLayout'
import s from './pages.module.css'

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
  return (
    <>
      <PageHead
        crumb="Главная"
        title="Ваш бизнес. Всё под контролем."
        subtitle="ООО «Вектор Машиностроение» · U001 · Синтетические данные"
      />

      <div className={`${s.row} ${s.cols2}`} style={{ gap: 20 }}>
        <Panel>
          <h2 className="t-h2">Общий баланс</h2>
          <p className={s.amount}>248 650 000 ₽</p>
          <p className="t-12 c-muted">Баланс · 3 расчётных счёта</p>
          <div className={s.row} style={{ gap: 10 }}>
            <Button variant="primary">Создать платёж</Button>
            <Button>Реквизиты</Button>
          </div>
        </Panel>
        <Panel>
          <h2 className="t-h2">Ликвидность</h2>
          <Field label="Свободно для размещения" value="120 000 000 ₽" />
          <Field label="Платежи на согласование" value="18 поручений · 42,6 млн ₽" />
          <p className="t-12 c-muted">Платёжные действия показаны как статичные элементы</p>
        </Panel>
      </div>

      <Panel>
        <h2 className="t-h2">Счета компании</h2>
        <div className={`${s.row} ${s.cols3}`} style={{ gap: 24 }}>
          {accounts.map((a) => (
            <Field key={a.label} label={a.label} value={a.value} />
          ))}
        </div>
        <p className="t-11 c-muted">
          Названия счетов условные. Реальные банковские реквизиты не отображаются.
        </p>
      </Panel>

      <div className={s.lime} style={{ gap: 32, padding: 32 }}>
        <div className={`${s.col} ${s.grow}`} style={{ gap: 12 }}>
          <p className={s.eyebrow}>АЛЬФА БУДУЩЕЕ / FINANCIAL INTELLIGENCE</p>
          <h2 className={s.limeTitle} style={{ fontSize: 34, lineHeight: '39px' }}>
            Не просто новости.
            <br />
            Контекст для ваших решений.
          </h2>
          <p className="t-15">
            Ставка 14%: проверьте инвестиционный бюджет и сценарий рефинансирования.
          </p>
          <div className={s.row} style={{ gap: 16 }}>
            <Button variant="primary" to="/digest">
              Новостная аналитика →
            </Button>
            <Tag>6 приоритетов для CFO</Tag>
          </div>
        </div>
        <BrandKey to="/digest" />
      </div>

      <div className={s.row} style={{ gap: 20 }}>
        <Panel className={s.grow}>
          <h2 className="t-h2">Последние операции</h2>
          <div className={`${s.row} ${s.cols2} t-12 c-muted`}>
            <span>Операция / обезличенный контрагент</span>
            <span>Сумма · статус</span>
          </div>
          {operations.map((o) => (
            <div key={o.name} className={s.tableRow}>
              <Divider />
              <div className={`${s.row} ${s.cols2} t-15`}>
                <span>{o.name}</span>
                <span className="t-semibold">{o.amount}</span>
              </div>
            </div>
          ))}
        </Panel>
        <Panel className={s.side300}>
          <h2 className="t-h2">Ближайшие задачи</h2>
          {tasks.map((t, i) => (
            <div key={t.label} className={s.col} style={{ gap: 16 }}>
              {i > 0 && <Divider />}
              <Field label={t.label} value={t.value} />
            </div>
          ))}
          <Button>Перейти к платежам →</Button>
        </Panel>
      </div>
    </>
  )
}
