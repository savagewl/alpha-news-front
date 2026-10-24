import { useEffect, useState, type CSSProperties, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiError } from '../api/client'
import { companyTitle, formatDecimal, place, plural } from '../api/companyFormat'
import { useCompaniesInfinite, useCreateCompany, useImportCsv } from '../api/companyHooks'
import type { CsvDelimiter, CsvEncoding, ImportKind, ImportResult } from '../api/companyTypes'
import { Button, Panel, Skeleton, StateCard, Tag, TextField } from '../components/ui'
import { cx } from '../components/cx'
import { PageHead } from '../layout/AppLayout'
import { useWorkspace } from '../state/context'
import a from './auth.module.css'
import s from './pages.module.css'

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
  const first = list.data?.pages[0]
  const data = first && { total: first.total, items: list.data!.pages.flatMap((p) => p.items) }

  const search = (value: string) => setQuery(value)

  return (
    <>
      <PageHead
        crumb="Компании"
        title="Сначала — контекст бизнеса"
        subtitle="Профиль компании определяет, какие события попадут в сводку."
      />

      <div className={`${s.split} ${s.split330}`}>
        <div className={s.col}>
          <input
            className={s.search}
            type="search"
            aria-label="Поиск компании"
            placeholder="⌕ Поиск по названию, ID, ОКВЭД или городу"
            value={query}
            onChange={(e) => search(e.target.value)}
          />
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
          {data?.items.map((c, i) => {
            const selected = c.id === companyId
            const revenue = formatDecimal(c.annual_revenue)
            const where = place(c)
            return (
              <button
                key={c.id}
                type="button"
                className={cx(s.company, 'appear', selected && s.companySelected)}
                style={{ '--i': i % PAGE } as CSSProperties}
                aria-pressed={selected}
                onClick={() => setCompany(c.id)}
              >
                <span className={s.companyTop}>
                  <span className={s.row}>
                    <Tag variant={selected ? 'red' : 'neutral'}>{c.id}</Tag>
                    {c.is_placeholder && <Tag>Заглушка · CSV не загружен</Tag>}
                  </span>
                  <Tag>{selected ? '✓ Выбрана' : 'Выбрать →'}</Tag>
                </span>
                <span className="t-h3">{companyTitle(c)}</span>
                <span className="t-15">
                  {[
                    c.okved_name,
                    c.okved_code && `ОКВЭД ${c.okved_code}`,
                    revenue && `Выручка ${revenue}`,
                  ]
                    .filter(Boolean)
                    .join(' · ') || <span className="c-muted">Атрибуты не загружены</span>}
                </span>
                {(where || c.group_id) && (
                  <span className="t-12 c-muted">
                    {[where, c.group_id && `Группа ${c.group_id}`].filter(Boolean).join(' · ')}
                  </span>
                )}
              </button>
            )
          })}
          {data && data.total > 0 && (
            <div className={`${s.row} ${s.between}`} style={{ opacity: isFetching ? 0.6 : 1 }}>
              <span className="t-12 c-muted">
                Показано {data.items.length} из {data.total}
              </span>
              {list.hasNextPage && (
                <Button onClick={() => list.fetchNextPage()} disabled={list.isFetchingNextPage}>
                  {list.isFetchingNextPage
                    ? 'Загружаем…'
                    : `Показать ещё · ${Math.min(PAGE, data.total - data.items.length)}`}
                </Button>
              )}
            </div>
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
