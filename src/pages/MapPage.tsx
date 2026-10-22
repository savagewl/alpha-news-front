import { useNavigate } from 'react-router-dom'
import { BrandKey, Panel, Tag } from '../components/ui'
import { PageHead } from '../layout/AppLayout'
import { useWorkspace } from '../state/context'
import s from './pages.module.css'

interface Stop {
  title: string
  text: string
  path?: string
  /** Компания и роль, в контексте которых открывается экран */
  as?: [string, string]
}

const CFO: [string, string] = ['U001', 'Финансовый директор']
const TREASURY: [string, string] = ['U002', 'Руководитель казначейства']
const CEO: [string, string] = ['U003', 'Генеральный директор']

const mainPath: Stop[][] = [
  [
    {
      title: 'Вход → Компания',
      text: 'Главная Альфа-Бизнес: шапка и фирменный блок → выбор из 6 компаний и роли.',
      path: '/companies',
      as: CFO,
    },
    {
      title: 'Профиль → Сводка',
      text: 'U001: признаки, платёжные связи, полнота → CFO: ранжирование и бизнес-резюме дня.',
      path: '/profile',
      as: CFO,
    },
  ],
  [
    {
      title: 'Ставка / U001',
      text: 'CFO: обслуживание долга и инвестиционный бюджет.',
      path: '/events/u001-s1',
      as: CFO,
    },
    {
      title: 'Логистика / U002',
      text: 'Казначейство: дебиторка, авансы, платёжный разрыв.',
      path: '/events/u002-l1',
      as: TREASURY,
    },
    {
      title: 'Золото / U003',
      text: 'CEO: выручка, затраты, капитальные вложения.',
      path: '/events/u003-g1',
      as: CEO,
    },
  ],
  [
    {
      title: 'Вопрос → Источник',
      text: 'Уточняющий вопрос о CAPEX, первоисточник и каталог 9 материалов банка.',
      path: '/sources/u001-s1',
      as: CFO,
    },
    {
      title: 'Источник → Trace',
      text: '7 этапов: повторный поиск, нет подтверждения позиции банка, ограничение вывода.',
      path: '/trace/u001-s1',
      as: CFO,
    },
  ],
]

const branches: Stop[][] = [
  [
    {
      title: 'Как это работает',
      text: 'Архитектура, собственный планировщик, инструменты, модели, целевые метрики.',
      path: '/how',
    },
    {
      title: 'Безопасность и аудит',
      text: 'company / user / role, права до RAG, маскирование, read-only, журнал.',
      path: '/security',
    },
  ],
  [
    {
      title: 'Альтернативная сводка',
      text: 'U002 / казначейство — другой порядок событий под роль.',
      path: '/digest',
      as: TREASURY,
    },
    {
      title: 'Адаптации',
      text: 'Планшет и мобильный: сузьте окно браузера — навигация и плотность перестроятся.',
    },
    {
      title: 'UI-состояния',
      text: 'Загрузка / пусто / ошибка / мало данных / конфликт.',
      path: '/states',
    },
  ],
]

const timeline = [
  {
    at: '0:00–0:25 / Вход',
    red: true,
    text: 'Показать постоянную точку входа, выбрать U001 и роль CFO.',
  },
  {
    at: '0:25–1:10 / Ставка',
    text: 'Открыть резюме, объяснение релевантности и 6 вопросов. Спросить про инвестбюджет. Показать стр. 11 и отсутствие полного обзора.',
  },
  {
    at: '1:10–1:40 / Логистика',
    text: 'Переключиться на U002 / казначейство. Сопоставить иной приоритет: импорт Китай, лизинг, авансы и дебиторка. Подгрузить новую новость.',
  },
  {
    at: '1:40–2:05 / Золото',
    text: 'U003 / CEO: разделить выручку, затраты и CAPEX. Подчеркнуть неизвестное хеджирование.',
  },
  {
    at: '2:05–2:40 / Доверие',
    green: true,
    text: 'Показать адаптацию Trace, архитектуру и read-only аудит. Завершить мобильной адаптацией и состояниями неполноты.',
  },
]

export default function MapPage() {
  const navigate = useNavigate()
  const { setCompany, setRole } = useWorkspace()

  const go = ({ path, as }: Stop) => {
    if (!path) return
    if (as) {
      setCompany(as[0])
      setRole(as[1])
    }
    navigate(path)
  }

  const renderRows = (rows: Stop[][]) =>
    rows.map((row) => (
      <div key={row[0].title} className={row.length === 3 ? s.grid3 : s.grid2}>
        {row.map((stop) =>
          stop.path ? (
            <button
              key={stop.title}
              type="button"
              className={`${s.card} ${s.cardLink}`}
              style={{ border: 0, textAlign: 'left', cursor: 'pointer', font: 'inherit' }}
              onClick={() => go(stop)}
            >
              <span className={s.cardTitle}>{stop.title}</span>
              <span className="t-13">{stop.text}</span>
              {stop.as && (
                <Tag>
                  Откроется как {stop.as[0]} / {stop.as[1]}
                </Tag>
              )}
            </button>
          ) : (
            <div key={stop.title} className={s.card}>
              <span className={s.cardTitle}>{stop.title}</span>
              <span className="t-13">{stop.text}</span>
            </div>
          ),
        )}
      </div>
    ))

  return (
    <>
      <PageHead
        section="Новостная аналитика"
        crumb="Карта экранов"
        title="От входа в банк — до проверяемого решения"
        subtitle="Карта экранов · Демонстрационный маршрут для жюри · 2–3 минуты"
      />

      <section className={s.lime}>
        <div className={`${s.col} ${s.grow}`} style={{ gap: 10 }}>
          <Tag>ДЕМОНСТРАЦИОННЫЙ МАРШРУТ</Tag>
          <h2 className={`${s.limeTitle} ${s.limeTitleSm}`}>Основной сценарий за 3 минуты</h2>
          <p className="t-15">
            Вход → компания и роль → сводка → разбор события → вопрос и источники → Agent Trace.
          </p>
        </div>
        <BrandKey to="/" label="Начать с главной Альфа-Бизнеса" />
      </section>

      <div className={`${s.split} ${s.split330}`}>
        <div className={s.col} style={{ gap: 16 }}>
          <h2 className="t-h3">Основной путь</h2>
          {renderRows(mainPath)}
          <h2 className="t-h3" style={{ marginTop: 16 }}>
            Параллельные ветви
          </h2>
          {renderRows(branches)}
        </div>

        <div className={s.aside}>
          <Panel>
            <h2 className="t-h2">Демо за 2:40</h2>
            {timeline.map((t, i) => (
              <div key={t.at} className={s.col} style={{ gap: 10 }}>
                {i > 0 && <div style={{ height: 1, background: 'var(--c-border)' }} />}
                <Tag variant={t.red ? 'red' : t.green ? 'green' : 'neutral'}>{t.at}</Tag>
                <p className="t-13">{t.text}</p>
              </div>
            ))}
          </Panel>
          <Panel>
            <h2 className="t-h2">Тестовые учётные записи</h2>
            <p className="t-13">
              cfo@vector.ru · treasury@sever.ru · ceo@aurum.ru — пароль alfa2026. Каждая открывает
              сервис в контексте своей компании и роли.
            </p>
          </Panel>
        </div>
      </div>
    </>
  )
}
