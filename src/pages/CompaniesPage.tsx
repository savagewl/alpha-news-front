import { useEffect, useState, type CSSProperties, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiError } from '../api/client'
import { companyTitle, formatRevenueShort, place, plural } from '../api/companyFormat'
import {
  flatPages,
  loaderProps,
  useCompaniesInfinite,
  useCompany,
  useCreateCompany,
  useImportCsv,
} from '../api/companyHooks'
import type {
  Company,
  CompanyListItem,
  CsvDelimiter,
  CsvEncoding,
  ImportKind,
  ImportResult,
} from '../api/companyTypes'
import { Icon } from '../components/Icons'
import {
  Button,
  InfiniteLoader,
  Panel,
  Skeleton,
  StateCard,
  Tag,
  TextField,
} from '../components/ui'
import { cx } from '../components/cx'
import { PageHead } from '../layout/AppLayout'
import { useWorkspace } from '../state/context'
import a from './auth.module.css'
import s from './pages.module.css'

const today = () => new Date().toLocaleDateString('ru-RU', { dateStyle: 'long' })

/** Сколько компаний подгружается за раз */
const PAGE = 5

/** Значение, которое меняется не чаще раза в delay мс — чтобы не слать запрос на каждую букву */
function useDebounced<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

export default function CompaniesPage() {
  const navigate = useNavigate()
  const { companyId, setCompany } = useWorkspace()
  const [query, setQuery] = useState('')
  const q = useDebounced(query.trim()).slice(0, 200)
  const list = useCompaniesInfinite({ q: q || undefined, limit: PAGE })
  const { isLoading, isError, error, refetch, isFetching } = list
  // новый запрос поиска — новый ключ, список начинается с первой порции
  const data = flatPages(list.data)

  const search = (value: string) => setQuery(value)

  return (
    <>
      <PageHead
        crumb="Компании"
        title="Сначала — контекст бизнеса"
        subtitle={`${today()} · ${companyId}`}
      />

      <div className={`${s.split} ${s.split330}`}>
        <div className={s.col}>
          <label className={s.search}>
            <Icon name="search" size={22} color="var(--c-muted)" />
            <input
              type="search"
              aria-label="Поиск компании"
              placeholder="Поиск по названию, ID, ОКВЭД или городу"
              value={query}
              onChange={(e) => search(e.target.value)}
            />
          </label>
          {isLoading && <Skeleton lines={4} />}
          {isError && (
            <StateCard
              kind="error"
              title="Не удалось загрузить компании"
              text={error.message}
              action={<Button onClick={() => refetch()}>Повторить</Button>}
            />
          )}
          {data &&
            data.total === 0 &&
            (q ? (
              <StateCard
                kind="empty"
                title="Компания не найдена"
                text={`По запросу «${q}» нет совпадений среди ваших компаний.`}
                action={<Button onClick={() => search('')}>Сбросить поиск</Button>}
              />
            ) : (
              <StateCard
                kind="insufficient"
                tag="Нет компаний"
                title="У вас пока нет компаний"
                text="Создайте компанию или загрузите CSV юридических лиц справа. Ещё вас может добавить участник компании — для этого передайте ему свой ID из меню профиля."
              />
            ))}
          {data?.items.map((c, i) => (
            <CompanyCard
              key={c.id}
              item={c}
              index={i % PAGE}
              selected={c.id === companyId}
              onSelect={() => setCompany(c.id)}
            />
          ))}
          <InfiniteLoader {...loaderProps(list)} />
          {data && data.total > 0 && (
            <span className="t-12 c-muted" style={{ opacity: isFetching ? 0.6 : 1 }}>
              Показано {data.items.length} из {data.total.toLocaleString('ru-RU')}
            </span>
          )}
        </div>

        <div className={s.aside}>
          <Panel>
            <h2 className="t-h2">Сводка компании</h2>
            <p className="t-13">События отбираются и ранжируются по профилю выбранной компании.</p>
            {companyId && <Tag variant="red">{companyId}</Tag>}
            <Button variant="primary" disabled={!companyId} onClick={() => navigate('/digest')}>
              Открыть сводку →
            </Button>
          </Panel>
          <CsvImportPanel />
          <CreateCompanyPanel onCreated={setCompany} />
        </div>
      </div>
    </>
  )
}

/** Продукты банка компании — метки под описанием */
const products = (c: Company) =>
  [
    c.has_credit && 'Кредиты',
    c.has_rko && 'РКО',
    c.has_guarantees && 'гарантии',
    c.has_leasing && 'лизинг',
    c.has_factoring && 'факторинг',
    c.has_deposit && 'депозит',
    c.has_payroll && 'ЗП-проект',
  ].filter(Boolean) as string[]

/** Профиль подгружается отдельным запросом (общий кеш с переключателем компании) */
function CompanyCard({
  item: c,
  index,
  selected,
  onSelect,
}: {
  item: CompanyListItem
  index: number
  selected: boolean
  onSelect: () => void
}) {
  const { data: full } = useCompany(c.id)
  const where = place(c)
  const line = [c.okved_name, c.okved_code, formatRevenueShort(c.annual_revenue)].filter(Boolean)
  const tags = full ? products(full) : []
  return (
    <button
      type="button"
      className={cx(s.company, 'appear', selected && s.companySelected)}
      style={{ '--i': index } as CSSProperties}
      aria-pressed={selected}
      onClick={onSelect}
    >
      <span className={s.companyHead}>
        <span className={s.companyChips}>
          <span className={s.chip}>{c.id}</span>
          {where && <span className={s.chip}>{where}</span>}
          {c.is_placeholder && <span className={s.chip}>Заглушка · CSV не загружен</span>}
        </span>
        <span className={s.picked} data-selected={selected}>
          <span className={s.pickedBox}>
            {selected && (
              <svg width="9" height="7" viewBox="0 0 9 7" fill="none" aria-hidden>
                <path
                  d="M1 3.5 3.3 5.8 8 1"
                  stroke="#fff"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            )}
          </span>
          {selected ? 'Выбрано' : 'Выбрать'}
        </span>
      </span>
      <span className={s.companyTitle}>{companyTitle(c)}</span>
      <span className={s.companyBody}>
        <span className={s.companyLine}>
          {line.length ? line.join(' · ') : 'Атрибуты не загружены'}
        </span>
        {full?.fts_country_name && (
          <span className={s.companySub}>
            <b>Импорт:</b> {full.fts_country_name}
          </span>
        )}
        {tags.length > 0 && (
          <span className={s.companyChips}>
            {tags.map((t) => (
              <span key={t} className={s.chip}>
                {t}
              </span>
            ))}
          </span>
        )}
      </span>
    </button>
  )
}

const importKinds: { kind: ImportKind; label: string; hint: string }[] = [
  {
    kind: 'companies',
    label: 'Юрлица',
    hint: 'Все колонки df_Uid_data_hack.csv. Обновление по SYNTHETIC_U, новые компании станут вашими.',
  },
  {
    kind: 'persons',
    label: 'Физлица',
    hint: 'Колонки SYNTHETIC_F, SYNTHETIC_U, CITY_NAME, RC_NAME. Компании из файла должны быть вашими.',
  },
  {
    kind: 'payments',
    label: 'Платежи',
    hint: 'Колонки PAYER, BENEFICIARY, PAY_AMT, PAY_CNT. В каждой строке одна из сторон — ваша компания.',
  },
]

const encodings: { value: CsvEncoding; label: string }[] = [
  { value: 'utf-8-sig', label: 'UTF-8' },
  { value: 'cp1251', label: 'Windows-1251' },
]

const delimiters: { value: CsvDelimiter; label: string }[] = [
  { value: null, label: 'Авто' },
  { value: ',', label: ',' },
  { value: ';', label: ';' },
  { value: '\t', label: 'Tab' },
]

const importErrors: Record<number, string> = {
  401: 'Сессия истекла, войдите заново',
  403: 'В файле есть компании, к которым у вас нет доступа',
  413: 'Файл слишком большой',
  503: 'Сервис импорта временно недоступен, попробуйте позже',
}

function CsvImportPanel() {
  const [kind, setKind] = useState<ImportKind>('companies')
  const [encoding, setEncoding] = useState<CsvEncoding>('utf-8-sig')
  const [delimiter, setDelimiter] = useState<CsvDelimiter>(null)
  const [file, setFile] = useState<File | null>(null)
  const [inputKey, setInputKey] = useState(0)
  const [result, setResult] = useState<ImportResult | null>(null)
  const upload = useImportCsv()

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!file) return
    setResult(null)
    upload.mutate(
      { kind, file, encoding, delimiter },
      {
        onSuccess: (r) => {
          setResult(r)
          setFile(null)
          setInputKey((k) => k + 1)
        },
      },
    )
  }

  const err = upload.error
  const errText = err && ((err instanceof ApiError && importErrors[err.status]) || err.message)

  return (
    <Panel>
      <h2 className="t-h2">Загрузка CSV</h2>
      <form className={s.col} style={{ gap: 12 }} onSubmit={onSubmit}>
        <div className={s.row} role="radiogroup" aria-label="Что загружаем">
          {importKinds.map((k) => (
            <Button key={k.kind} pressed={kind === k.kind} onClick={() => setKind(k.kind)}>
              {k.label}
            </Button>
          ))}
        </div>
        <p className="t-12 c-muted">{importKinds.find((k) => k.kind === kind)?.hint}</p>
        <input
          key={inputKey}
          type="file"
          accept=".csv,text/csv"
          aria-label="CSV-файл"
          className="t-13"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <p className="t-12 c-muted">Кодировка</p>
        <div className={s.row}>
          {encodings.map((o) => (
            <Button
              key={o.value}
              pressed={encoding === o.value}
              onClick={() => setEncoding(o.value)}
            >
              {o.label}
            </Button>
          ))}
        </div>
        <p className="t-12 c-muted">Разделитель</p>
        <div className={s.row}>
          {delimiters.map((o) => (
            <Button
              key={o.label}
              pressed={delimiter === o.value}
              onClick={() => setDelimiter(o.value)}
            >
              {o.label}
            </Button>
          ))}
        </div>
        {errText && (
          <p className={a.alert} role="alert">
            {errText}
          </p>
        )}
        <Button variant="primary" type="submit" disabled={!file || upload.isPending}>
          {upload.isPending ? 'Загружаем…' : 'Загрузить →'}
        </Button>
      </form>
      {result && <ImportSummary result={result} />}
      <p className="t-12 c-muted">
        Порядок: сначала юрлица, затем физлица и платежи. Повторная загрузка того же файла не
        дублирует данные.
      </p>
    </Panel>
  )
}

function ImportSummary({ result }: { result: ImportResult }) {
  const { counts } = result
  const lines = [
    ['Компании', counts.companies],
    ['Заглушки контрагентов', counts.placeholder_companies],
    ['Физлица', counts.persons],
    ['Связи', counts.links],
    ['Платёжные строки', counts.payments],
  ].filter(([, n]) => n) as [string, number][]
  return (
    <div className={s.col} style={{ gap: 8 }} role="status">
      <Tag variant="green">
        {result.reused ? 'Файл уже загружался — данные не продублированы' : 'Загружено'}
      </Tag>
      <p className="t-13">
        {result.filename} · {result.row_count}{' '}
        {plural(result.row_count, 'строка', 'строки', 'строк')}
      </p>
      {lines.map(([label, n]) => (
        <p key={label} className="t-12">
          {label}: {n}
        </p>
      ))}
    </div>
  )
}

function CreateCompanyPanel({ onCreated }: { onCreated: (id: string) => void }) {
  const [name, setName] = useState('')
  const [id, setId] = useState('')
  const create = useCreateCompany()

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    create.mutate(
      { name: name.trim(), id: id.trim() || null },
      {
        onSuccess: (c) => {
          setName('')
          setId('')
          onCreated(c.id)
        },
      },
    )
  }

  const err = create.error
  const errText =
    err &&
    (err instanceof ApiError && err.status === 409
      ? 'Компания с таким ID уже существует'
      : err.message)

  return (
    <Panel>
      <h2 className="t-h2">Создать компанию</h2>
      <form className={s.col} style={{ gap: 12 }} onSubmit={onSubmit}>
        <TextField
          label="Название"
          placeholder="ООО «Вектор»"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <TextField
          label="ID (SYNTHETIC_U), необязательно"
          placeholder="Например, 001 — чтобы потом загрузить CSV"
          value={id}
          onChange={(e) => setId(e.target.value)}
        />
        {errText && (
          <p className={a.alert} role="alert">
            {errText}
          </p>
        )}
        <Button variant="primary" type="submit" disabled={!name.trim() || create.isPending}>
          {create.isPending ? 'Создаём…' : 'Создать →'}
        </Button>
      </form>
    </Panel>
  )
}
