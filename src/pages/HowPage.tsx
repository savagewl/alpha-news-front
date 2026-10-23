import { useNewsSources } from '../api/articleHooks'
import type { NewsFeed } from '../api/articleTypes'
import { formatDate } from '../api/companyFormat'
import { Field, Panel, Skeleton, Tag } from '../components/ui'
import { PageHead } from '../layout/AppLayout'
import s from './pages.module.css'

const dataContour = [
  {
    title: 'Профиль компании',
    text: 'ОКВЭД, выручка, продукты, ФТС, группа, связи и платежи. Company / user / role — обязательный scope.',
  },
  {
    title: 'Новости и сигналы',
    text: 'Разрешённые источники, дата публикации, отрасль, тип события.',
  },
  {
    title: 'Аналитика банка',
    text: 'Каталог, полнотекстовые документы при наличии, метаданные и права. Заголовок не равен позиции банка.',
  },
]

const tools = [
  {
    name: 'profile.get',
    text: 'Поиск признаков и связей в рамках company_id. Возвращает значения + происхождение.',
  },
  {
    name: 'news.search',
    text: 'Отбор событий по времени, отрасли, экспозициям. Возвращает первоисточник.',
  },
  {
    name: 'rag.search',
    text: 'Проверка прав → поиск фрагментов → цитирование. Без текста — только метаданные.',
  },
]

const pipeline = [
  {
    title: '↓ Ранжирование',
    text: 'Роль × компания × событие. Объяснение релевантности через использованные признаки. Неизвестные значения не домысливаются.',
  },
  {
    title: '↓ Интерпретация',
    text: '6 обязательных вопросов. Факт / аналитика банка / AI-гипотеза размечены текстом и символами.',
  },
  {
    title: '↓ Самопроверка',
    text: 'Источники, непротиворечивость, права, даты, ограничения. Отсечение неподтверждённых цитат и действий.',
  },
]

const models = [
  'Gemma 4 26B A4B',
  'GLM-5.3-Flash',
  'Qwen3.6 35B A3B',
  'DeepSeek-V4.1-Flash',
  'Qwen3-VL-30B-A3B-Instruct',
  'Kimi-K2.6',
]

const quality = [
  { label: 'Точность отбора', value: 'Целевая · ≥85%' },
  { label: 'Релевантность', value: 'Целевая · ≥4/5' },
  { label: 'Подтверждённые факты', value: 'Целевая · 100%' },
  { label: 'Удовлетворённость', value: 'По отзывам «Полезно / Не учтён контекст»' },
]

export default function HowPage() {
  return (
    <>
      <PageHead
        crumb="Как это работает"
        title="Собственная оркестрация. Проверяемый результат."
        subtitle="Архитектура решения: данные, агент, проверка вывода"
      >
        <div className={s.row}>
          <Tag variant="red">КОНЦЕПЦИЯ</Tag>
          <Tag>Read-only AI</Tag>
          <Tag>Права до RAG</Tag>
          <Tag variant="green">Доказательства у каждого вывода</Tag>
        </div>
      </PageHead>

      <Panel>
        <h2 className="t-h2">Контур данных → единый контекст</h2>
        <div className={s.grid3}>
          {dataContour.map((c) => (
            <div key={c.title} className={s.card}>
              <h3 className={s.cardTitle}>{c.title}</h3>
              <p className="t-13">{c.text}</p>
            </div>
          ))}
        </div>
        <div className={s.grid2}>
          <div className={s.card}>
            <h3 className={s.cardTitle}>↓ Нормализация и контроль качества</h3>
            <p className="t-13">
              Схемы полей, дедупликация, даты, обезличивание, provenance. Неполные и конфликтующие
              данные сохраняют статус.
            </p>
          </div>
          <div className={s.card}>
            <h3 className={s.cardTitle}>↓ Единый контекст компании</h3>
            <p className="t-13">
              Проверенный scope, признаки, пробелы, задача роли, история обратной связи. Только
              разрешённые данные.
            </p>
          </div>
        </div>
      </Panel>

      <NewsSources />

      <section className={s.dark} style={{ gap: 20 }}>
        <p className={s.darkEyebrow}>СОБСТВЕННАЯ ОРКЕСТРАЦИЯ / НЕ ВНЕШНЯЯ АГЕНТНАЯ СИСТЕМА</p>
        <h2 className={s.limeTitle} style={{ fontSize: 27, lineHeight: '31px' }}>
          План → инструмент → проверка → адаптация плана
        </h2>
        <p className="t-15">
          Планировщик выбирает инструменты по задаче, хранит общий контекст и ограничивает вывод при
          нехватке доказательств. Вызовы фиксируются в Agent Trace.
        </p>
        <div className={s.grid3}>
          {tools.map((t) => (
            <div key={t.name} className={s.card}>
              <h3 className={s.cardTitle}>{t.name}</h3>
              <p className="t-13">{t.text}</p>
            </div>
          ))}
        </div>
      </section>

      <div className={s.grid3}>
        {pipeline.map((p) => (
          <div key={p.title} className={s.card}>
            <h3 className={s.cardTitle}>{p.title}</h3>
            <p className="t-13">{p.text}</p>
          </div>
        ))}
      </div>

      <p className={s.callout}>
        ↻ Не хватает доказательств → повторный поиск → проверка → либо подтверждение, либо
        ограниченный вывод. Пример: полного обзора нет → позиция банка требует подтверждения.
      </p>

      <div className={s.grid2}>
        <Panel>
          <h2 className="t-h2">Доказательства и обратная связь</h2>
          <p className="t-15">
            Карточка события → 6 блоков → вопрос → инспектор источников → Agent Trace. Оценка
            полезности и пропущенного контекста возвращается в правила ранжирования после контроля
            качества.
          </p>
        </Panel>
        <Panel>
          <h2 className="t-h2">Масштабирование</h2>
          <p className="t-15">
            Новые отрасли — через схемы признаков и отраслевые правила. Новые источники — через
            разрешённые адаптеры, качество и права. Изоляция компаний, версионирование промптов и
            тестовые сценарии.
          </p>
        </Panel>
      </div>

      <Panel>
        <h2 className="t-h2">Модельный контур</h2>
        <p className="t-13">
          Только разрешённые модели из ТЗ (приложение 3). Распределение задач по моделям уточняется
          тестированием.
        </p>
        <div className={s.row}>
          {models.map((m) => (
            <Tag key={m}>{m}</Tag>
          ))}
        </div>
      </Panel>

      <Panel>
        <h2 className="t-h2">Как оценивать качество</h2>
        <div className={s.grid4}>
          {quality.map((q) => (
            <Field key={q.label} label={q.label} value={q.value} />
          ))}
        </div>
      </Panel>
    </>
  )
}

const feedStatus = (feeds: NewsFeed[]) =>
  !feeds.some((f) => f.enabled)
    ? ({ variant: 'neutral', label: 'Отключён' } as const)
    : feeds.some((f) => f.needs_attention)
      ? ({ variant: 'red', label: 'Требует внимания' } as const)
      : ({ variant: 'green', label: 'Работает' } as const)

const latest = (dates: (string | null)[]) =>
  dates
    .filter((d): d is string => !!d)
    .sort()
    .at(-1) ?? null

/** Разрешённые RSS-источники и состояние их опроса — живые данные бэкенда */
function NewsSources() {
  const { data, isPending, isError, refetch } = useNewsSources()
  return (
    <Panel>
      <h2 className="t-h2">Источники новостей</h2>
      <p className="t-13">
        Сервис сам опрашивает RSS-ленты разрешённых изданий и складывает публикации в общий корпус.
        Отбор под компанию идёт уже по нему.
      </p>
      {isPending && <Skeleton lines={3} />}
      {isError && (
        <p className="t-13 c-red" role="alert">
          Не удалось получить состояние источников.{' '}
          <button type="button" className={s.linkButton} onClick={() => refetch()}>
            Повторить
          </button>
        </p>
      )}
      {data && (
        <div className={s.grid3}>
          {data.map((src) => {
            const status = feedStatus(src.feeds)
            const checked = latest(src.feeds.map((f) => f.last_checked_at))
            const fresh = latest(src.feeds.map((f) => f.last_new_at))
            const interval = Math.min(...src.feeds.map((f) => f.poll_interval_seconds))
            const error = src.feeds.find((f) => f.last_error)?.last_error
            return (
              <div key={src.code} className={s.card}>
                <div className={`${s.row} ${s.between}`}>
                  <a className={s.cardTitle} href={src.site_url} target="_blank" rel="noreferrer">
                    {src.name}
                  </a>
                  <Tag variant={status.variant}>{status.label}</Tag>
                </div>
                <Field label="Последний опрос" value={checked ? formatDate(checked) : '—'} />
                <Field label="Последняя новая публикация" value={fresh ? formatDate(fresh) : '—'} />
                {Number.isFinite(interval) && (
                  <p className="t-12 c-muted">
                    Опрос каждые {Math.max(1, Math.round(interval / 60))} мин
                  </p>
                )}
                {error && <p className="t-12 c-red">{error}</p>}
              </div>
            )
          })}
        </div>
      )}
    </Panel>
  )
}
