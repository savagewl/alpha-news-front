import { Link } from 'react-router-dom'
import { plural } from '../api/companyFormat'
import { useCompanyNewsHead } from '../api/companyNewsHooks'
import promo from '../assets/promo-14.png'
import { cx } from '../components/cx'
import { AlfaLogo } from '../components/Icons'
import { PageHead } from '../layout/AppLayout'
import { useWorkspace } from '../state/context'
import s from './home.module.css'

// Банковская часть главной — статичная обвязка: сервис не трогает счета и платежи
const operations = [
  { name: 'Поступление · F104', amount: '+18 400 000 ₽', done: true },
  { name: 'Оплата материалов', amount: '−6 250 000 ₽', done: true },
  { name: 'Лизинговый платёж', amount: '−2 800 000 ₽', done: false },
  { name: 'Фонд оплаты труда', amount: '−12 600 000 ₽', done: false },
  { name: 'Фонд оплаты труда', amount: '−12 600 000 ₽', done: false },
  { name: 'Фонд оплаты труда', amount: '−12 600 000 ₽', done: false },
]

const prototypeOnly = 'Недоступно в прототипе'

export default function HomePage() {
  const { companyId } = useWorkspace()
  const head = useCompanyNewsHead(companyId, { relevant_only: true })
  const count = head.data?.total ?? 0

  return (
    <>
      <PageHead crumb="Главная" title="Ваш бизнес. Всё под контролем." subtitle={null} />

      <div className={s.cards}>
        <section className={cx(s.panel, s.balance)}>
          <h2 className={s.panelTitle}>Общий баланс</h2>
          <p className={s.amount}>248 650 000 ₽</p>
          <div className={s.actions}>
            <button type="button" className={cx(s.action, s.actionPrimary)} title={prototypeOnly}>
              Создать платёж
            </button>
            <button type="button" className={s.action} title={prototypeOnly}>
              Реквизиты
            </button>
          </div>
        </section>

        <section className={cx(s.panel, s.liquidity)}>
          <h2 className={s.panelTitle}>Ликвидность</h2>
          <Sum label="Свободно для размещения" value="120 000 000 ₽" />
          <Sum label="Платежи на согласование" value="18 поручений · 42,6 млн ₽" />
        </section>

        <section className={cx(s.panel, s.accounts)}>
          <h2 className={s.panelTitle}>Счета компании</h2>
          <div className={s.mainAccount}>
            <span className={s.card} aria-hidden>
              <AlfaLogo width={18} color="#fff" />
            </span>
            <Sum label="Основной" value="128 650 000 ₽" large />
          </div>
          <div className={s.subAccounts}>
            <Sum label="Операционный" value="80 000 000 ₽" />
            <Sum label="Резервный" value="40 000 000 ₽" />
          </div>
        </section>
      </div>

      <div className={s.bottom}>
        <section className={cx(s.panel, s.operations)}>
          <h2 className="t-h2">Последние операции</h2>
          <ul className={s.opList}>
            {operations.map((o, i) => (
              <li key={i} className={s.op}>
                <span>{o.name}</span>
                <span className={s.opAmount}>{o.amount}</span>
                <span className={s.opStatusCell}>
                  <span className={cx(s.opStatus, o.done && s.opStatusDone)}>
                    {o.done ? 'Исполнено' : 'На согласовании'}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Заметная и постоянно доступная точка входа в сервис (критерий 09) */}
        <section className={s.promo}>
          <img className={s.promoArt} src={promo} alt="" />
          <div className={s.promoBody}>
            <div className={s.promoHead}>
              {count > 0 && (
                <span className={s.promoTag}>
                  {count} {plural(count, 'приоритет', 'приоритета', 'приоритетов')} для {companyId}
                </span>
              )}
              <h2 className={s.promoTitle}>
                Ваш бюджет still alive?
                <br />У вас есть план?
              </h2>
              <p className={s.promoText}>
                14% меняют правила. Высокая ставка не просит внимания — она требует решений.
              </p>
            </div>
            <Link to="/digest" className={s.promoLink}>
              Новостная аналитика
            </Link>
          </div>
        </section>
      </div>
    </>
  )
}

function Sum({ label, value, large }: { label: string; value: string; large?: boolean }) {
  return (
    <div className={s.sum}>
      <span className={s.sumLabel}>{label}</span>
      <span className={cx(s.sumValue, large && s.sumValueLarge)}>{value}</span>
    </div>
  )
}
