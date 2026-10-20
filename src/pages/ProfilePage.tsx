import { Button, Divider, Field, Panel, Tag } from '../components/ui'
import { PageHead } from '../layout/AppLayout'
import s from './pages.module.css'

const kpis = [
  { label: 'Выручка', value: '42,8 млрд ₽' },
  { label: 'Основной ОКВЭД', value: '28.29' },
  { label: 'Группа', value: 'G01' },
  { label: 'Доля рынка', value: 'Нет данных' },
]

const selectionFactors = [
  '① Кредиты → ставка и рефинансирование',
  '② ОКВЭД 28.29 → медь, оборудование',
  '③ Китай / Турция → логистика и таможня',
  '④ CFO → ликвидность и капвложения',
]

const links = [
  { who: 'F104 · Москва', direction: 'Входящие → U001', amount: '184 млн ₽', count: '24' },
  { who: 'F208 · Екатеринбург', direction: 'Исходящие из U001', amount: '126 млн ₽', count: '36' },
  { who: 'F302 · Пермь', direction: 'Исходящие из U001', amount: '62 млн ₽', count: '12' },
]

export default function ProfilePage() {
  return (
    <>
      <PageHead
        crumb="Профиль компании"
        title="ООО «Вектор Машиностроение»"
        subtitle="ID U001 · Срез 11 сентября 2026"
      />

      <div className={`${s.row} ${s.cols4}`} style={{ gap: 16 }}>
        {kpis.map((k) => (
          <Panel key={k.label}>
            <Field label={k.label} value={k.value} />
          </Panel>
        ))}
      </div>

      <div className={s.row} style={{ gap: 24 }}>
        <div className={`${s.col} ${s.grow}`} style={{ gap: 20 }}>
          <Panel>
            <h2 className="t-h2">Производство и масштаб</h2>
            <Field
              label="Отрасль и основная деятельность"
              value="Производство прочих машин и оборудования общего назначения"
            />
            <div className={`${s.row} ${s.cols2}`} style={{ gap: 24 }}>
              <Field label="Масштаб / стадия" value="Крупный бизнес / зрелая компания" />
              <Field label="Возраст / численность" value="Более 10 лет / 1 001–5 000 человек" />
            </div>
            <Field label="Регион / группа" value="Екатеринбург, Свердловская область / G01" />
            <p className="t-13">
              Положение на рынке: промышленный производитель. Рыночная доля и место в отраслевом
              рейтинге не предоставлены.
            </p>
          </Panel>
          <Panel>
            <h2 className="t-h2">Банковский и внешнеторговый контекст</h2>
            <Field label="Продукты" value="Кредиты · РКО · Гарантии · Лизинг · Зарплатный проект" />
            <Field label="Внешняя торговля" value="Есть в базе ФТС · Импорт из Китая и Турции" />
            <Field
              label="Виды деятельности"
              value="Производство оборудования, сервис и поставка комплектующих"
            />
            <div className={s.row} style={{ gap: 10 }}>
              <Tag>Тип организации: ООО</Tag>
              <Tag>Частная собственность</Tag>
            </div>
            <p className="t-12 c-muted">
              Стадия развития бизнеса: нет данных. Признак ключевого собственника — не оценка
              негативного риска; значение не предоставлено.
            </p>
          </Panel>
        </div>

        <div className={`${s.col} ${s.side330}`} style={{ gap: 20 }}>
          <Panel green>
            <h2 className="t-h2">Что влияет на отбор</h2>
            {selectionFactors.map((f) => (
              <p key={f} className="t-13">
                {f}
              </p>
            ))}
            <p className="t-12 c-muted">Это правила ранжирования, не измеренная модель.</p>
          </Panel>
          <Panel>
            <h2 className="t-h2">Полнота профиля</h2>
            <p className={s.bigStatus}>Есть пробелы</p>
            <p className="t-13">
              Доступны отрасль, выручка, география, продукты и страны. Нет условий кредитов, графика
              CAPEX, контрактов и доли рынка.
            </p>
            <Button>Уточнить профиль</Button>
            <Divider />
            <p className="t-12">Источник: набор данных кейса, стр. 15–16.</p>
          </Panel>
        </div>
      </div>

      <Panel>
        <h2 className="t-h2">Связи и ключевые контрагенты</h2>
        <p className="t-12 c-muted">
          Платежи за август 2026 · Контрагенты обезличены. Не банковская выписка.
        </p>
        <div className={`${s.row} ${s.cols4} t-12`}>
          <span>Контрагент / регион</span>
          <span>Направление</span>
          <span>Объём</span>
          <span>Количество</span>
        </div>
        {links.map((l) => (
          <div key={l.who} className={s.tableRow}>
            <Divider />
            <div className={`${s.row} ${s.cols4} t-13`}>
              <span>{l.who}</span>
              <span>{l.direction}</span>
              <span>{l.amount}</span>
              <span>{l.count}</span>
            </div>
          </div>
        ))}
        <p className="t-11 c-muted">
          Учтены контрагент, город и регион, плательщик, получатель, объём и количество платежей.
          Наличие связи не доказывает риск.
        </p>
      </Panel>
    </>
  )
}
