import { useState, type FormEvent, type ReactNode } from 'react'
import { ApiError } from '../api/client'
import {
  companyTitle,
  formatDate,
  formatDecimal,
  formatRevenueShort,
  place,
} from '../api/companyFormat'
import {
  flatPages,
  loaderProps,
  useAddCompanyUser,
  useCompany,
  useCompanyPayments,
  useCompanyPersons,
  useCompanyUsers,
  usePaymentImports,
} from '../api/companyHooks'
import type { Company, PaymentDirection } from '../api/companyTypes'
import { useAuth } from '../auth/context'
import {
  Button,
  Field,
  InfiniteLoader,
  Panel,
  Skeleton,
  StateCard,
  Tag,
  TextField,
} from '../components/ui'
import { PageHead } from '../layout/AppLayout'
import { useWorkspace } from '../state/context'
import a from './auth.module.css'
import s from './pages.module.css'

const PAGE = 20

const today = () => new Date().toLocaleDateString('ru-RU', { dateStyle: 'long' })

/** Значения через « / »: пустые части отбрасываем, а если нет ни одной — «Нет данных» */
const joined = (parts: (string | null)[], sep: string) => parts.filter(Boolean).join(sep) || null

/** Пустое поле набора показываем как «Нет данных», а не прячем: пробелы влияют на вывод */
const orMissing = (v: ReactNode) =>
  v === null || v === undefined || v === '' ? <span className="c-muted">Нет данных</span> : v

const yesNo = (v: boolean | null) => (v === null ? null : v ? 'да' : 'нет')

const products: [keyof Company, string][] = [
  ['has_credit', 'Кредиты'],
  ['has_rko', 'РКО'],
  ['has_guarantees', 'Гарантии'],
  ['has_leasing', 'Лизинг'],
  ['has_factoring', 'Факторинг'],
  ['has_deposit', 'Депозит'],
  ['has_payroll', 'Зарплатный проект'],
]

/** Поля карточки, по которым считаем полноту профиля */
const profileFields: (keyof Company)[] = [
  'okved_code',
  'okved_name',
  'annual_revenue',
  'group_id',
  'city',
  'region',
  'org_type',
  'ownership_form',
  'age_category',
  'development_stage',
  'employees_fns_category',
  'employees_spark_category',
  'client_type',
  'has_fts_data',
  ...products.map(([k]) => k),
]

export default function ProfilePage() {
  const { companyId } = useWorkspace()
  const { data: c, isLoading, isError, error, refetch } = useCompany(companyId)

  if (!companyId)
    return (
      <>
        <PageHead crumb="Профиль компании" title="Компания не выбрана" subtitle="" />
        <StateCard
          kind="insufficient"
          tag="Нет компании"
          title="Сначала выберите компанию"
          text="Создайте компанию или загрузите CSV на странице «Компании»."
          action={<Button to="/companies">К компаниям →</Button>}
        />
      </>
    )
  if (isLoading)
    return (
      <>
        <PageHead crumb="Профиль компании" title="Загрузка…" subtitle={companyId} />
        <Skeleton lines={6} />
      </>
    )
  if (isError || !c)
    return (
      <>
        <PageHead crumb="Профиль компании" title="Профиль недоступен" subtitle={companyId} />
        <StateCard
          kind="error"
          title="Не удалось загрузить профиль"
          text={
            error instanceof ApiError && error.status === 404
              ? 'Компания не найдена или у вас нет к ней доступа.'
              : (error?.message ?? 'Неизвестная ошибка')
          }
          action={<Button onClick={() => refetch()}>Повторить</Button>}
        />
      </>
    )

  return <Profile key={c.id} c={c} />
}

/** Строка серого блока признаков: подпись и значение, пустое — «Нет данных» */
function Fact({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className={s.fact}>
      <span className={s.factLabel}>{label}</span>
      <span className={s.factValue}>{orMissing(value)}</span>
    </div>
  )
}

function Profile({ c }: { c: Company }) {
  const { notes, setNote } = useWorkspace()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')

  const kpis = [
    { label: 'Выручка', value: formatRevenueShort(c.annual_revenue) },
    { label: 'Основной ОКВЭД', value: c.okved_code },
    { label: 'Группа', value: c.group_id },
    // в данных бэкенда доли рынка нет — как и в макете, показываем «Нет данных»
    { label: 'Доля рынка', value: null },
  ]
  const owned = products.filter(([k]) => c[k] === true).map(([, label]) => label)
  const productsKnown = products.some(([k]) => c[k] !== null)
  const filled = profileFields.filter((k) => c[k] !== null).length
  const completeness = c.is_placeholder
    ? {
        status: 'Заглушка',
        text: 'Компания известна только по связи или платежу. Загрузите CSV юрлиц с её SYNTHETIC_U.',
      }
    : {
        status: `${Math.round((filled / profileFields.length) * 100)}%`,
        text: `Заполнено ${filled} из ${profileFields.length} признаков. Пропуски снижают точность отбора событий.`,
      }
  const selection = [
    c.okved_name && `Отрасль: ${c.okved_name}`,
    place(c) && `Регион: ${place(c)}`,
    owned.length > 0 && `Продукты банка: ${owned.join(', ')}`,
    c.has_fts_data && 'Внешняя торговля',
    c.development_stage && `Стадия: ${c.development_stage}`,
  ].filter(Boolean) as string[]
  const note = notes[c.id]

  const startEdit = () => {
    setDraft(note ?? '')
    setEditing(true)
  }

  return (
    <>
      <PageHead crumb="Профиль компании" title={companyTitle(c)} subtitle={`${today()} · ${c.id}`}>
        {c.is_placeholder && <Tag>Заглушка · CSV не загружен</Tag>}
      </PageHead>

      <div className={s.kpis}>
        {kpis.map((k) => (
          <Panel key={k.label} className={s.flat}>
            <div className={s.kpi}>
              <span className={s.kpiLabel}>{k.label}</span>
              <span className={s.kpiValue}>{k.value ?? 'Нет данных'}</span>
            </div>
          </Panel>
        ))}
      </div>

      <div className={`${s.split} ${s.split330}`}>
        <div className={s.col} style={{ gap: 20 }}>
          <Panel className={s.flat}>
            <h2 className="t-h2">Производство и масштаб</h2>
            <div className={s.facts}>
              <Fact label="Отрасль и основная деятельность" value={c.okved_name} />
              <div className={s.factsRow}>
                <Fact
                  label="Масштаб / стадия"
                  value={joined([c.client_type, c.development_stage], ' / ')}
                />
                <Fact
                  label="Возраст / численность"
                  value={joined(
                    [
                      c.age_category,
                      joined(
                        [
                          c.employees_fns_category,
                          c.employees_spark_category !== c.employees_fns_category
                            ? c.employees_spark_category
                            : null,
                        ],
                        ' · СПАРК ',
                      ),
                    ],
                    ' / ',
                  )}
                />
              </div>
              <Fact label="Регион / группа" value={joined([place(c), c.group_id], ' / ')} />
            </div>
            <p className={s.factNote}>
              Положение на рынке: {c.okved_name ? `${c.okved_name}. ` : ''}Рыночная доля и место в
              отраслевом рейтинге не предоставлены.
            </p>
          </Panel>
          <Panel className={s.flat}>
            <h2 className="t-h2">Банковский и внешнеторговый контекст</h2>
            <div className={s.facts}>
              <Fact label="Продукты" value={productsKnown ? owned.join(' · ') || 'Нет' : null} />
              <Fact
                label="Внешняя торговля"
                value={
                  c.has_fts_data === null
                    ? null
                    : `FTS_FLAG: ${c.has_fts_data ? 'да' : 'нет'}${c.fts_country_name ? ` · Импорт: ${c.fts_country_name}` : ''}`
                }
              />
              <Fact label="Ключевой собственник" value={yesNo(c.key_owner_flag)} />
            </div>
            <div className={s.row} style={{ gap: 10 }}>
              <span className={s.marker}>ORG_TYPE: {c.org_type ?? 'нет данных'}</span>
              <span className={s.marker}>
                Форма собственности: {c.ownership_form ?? 'нет данных'}
              </span>
            </div>
          </Panel>
        </div>

        <div className={s.aside}>
          <Panel green>
            <h2 className="t-h2">Что влияет на отбор</h2>
            {selection.length ? (
              <ol className={s.numbered}>
                {selection.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ol>
            ) : (
              <p className="t-13">Признаков пока нет — загрузите CSV юрлиц.</p>
            )}
          </Panel>
          <Panel>
            <h2 className="t-h2">Полнота профиля</h2>
            <p className={s.bigStatus}>{completeness.status}</p>
            <p className="t-13">{completeness.text}</p>
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
          <MembersPanel companyId={c.id} />
        </div>
      </div>

      <PaymentsPanel companyId={c.id} />
      <PersonsPanel companyId={c.id} />
    </>
  )
}

const directions: { value: PaymentDirection; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'incoming', label: 'Входящие' },
  { value: 'outgoing', label: 'Исходящие' },
]

/** «Показано 40 из 57» — пока загружено не всё */
const Shown = ({ data }: { data: { items: unknown[]; total: number } }) =>
  data.items.length < data.total && (
    <span className="t-12 c-muted">
      Показано {data.items.length} из {data.total.toLocaleString('ru-RU')}
    </span>
  )

function PaymentsPanel({ companyId }: { companyId: string }) {
  const [direction, setDirection] = useState<PaymentDirection>('all')
  const [importId, setImportId] = useState<string | null>(null)
  const imports = usePaymentImports(companyId)
  const list = useCompanyPayments(companyId, { direction, importId, limit: PAGE })
  const { isLoading, isError, error } = list
  // новый фильтр — новый ключ запроса, список начинается с первой порции
  const data = flatPages(list.data)

  return (
    <Panel>
      <h2 className="t-h2">Связи и ключевые контрагенты</h2>
      <p className="t-12 c-muted">
        Агрегаты PAY_AMT / PAY_CNT из загруженных файлов, не отдельные транзакции. Период и валюта в
        данных не указаны; без выбора набора строки разных файлов могут перекрываться.
      </p>
      <div className={s.row}>
        {directions.map((d) => (
          <Button
            key={d.value}
            pressed={direction === d.value}
            onClick={() => setDirection(d.value)}
          >
            {d.label}
          </Button>
        ))}
      </div>
      {imports.data && imports.data.items.length > 1 && (
        <div className={s.row}>
          <span className="t-12 c-muted">Набор:</span>
          <Button pressed={importId === null} onClick={() => setImportId(null)}>
            Все наборы
          </Button>
          {imports.data.items.map((i) => (
            <Button
              key={i.import_id}
              pressed={importId === i.import_id}
              title={`${i.company_payment_rows} строк с компанией из ${i.row_count}`}
              onClick={() => setImportId(i.import_id)}
            >
              {i.filename} · {formatDate(i.created_at)}
            </Button>
          ))}
        </div>
      )}
      {isLoading && <Skeleton lines={3} />}
      {isError && <p className="t-13 c-red">{error.message}</p>}
      {data &&
        (data.items.length ? (
          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th>Контрагент</th>
                  <th>Направление</th>
                  <th>Сумма</th>
                  <th>Количество</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((p) => {
                  const self = p.payer_company_id === p.beneficiary_company_id
                  const outgoing = p.payer_company_id === companyId
                  return (
                    <tr key={p.id}>
                      <td>{outgoing ? p.beneficiary_company_id : p.payer_company_id}</td>
                      <td>{self ? 'Внутри компании' : outgoing ? 'Исходящий' : 'Входящий'}</td>
                      <td>{formatDecimal(p.payment_amount)}</td>
                      <td>{p.payment_count}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="t-15">Платёжные связи компании не загружены.</p>
        ))}
      {data && <Shown data={data} />}
      <InfiniteLoader {...loaderProps(list)} />
    </Panel>
  )
}

function PersonsPanel({ companyId }: { companyId: string }) {
  const list = useCompanyPersons(companyId, { limit: PAGE })
  const { isLoading, isError, error } = list
  const data = flatPages(list.data)
  return (
    <Panel>
      <h2 className="t-h2">Связанные физлица</h2>
      <p className="t-12 c-muted">
        Обезличенные SYNTHETIC_F. Тип связи (владелец, директор) в исходных данных не задан.
      </p>
      {isLoading && <Skeleton lines={3} />}
      {isError && <p className="t-13 c-red">{error.message}</p>}
      {data &&
        (data.items.length ? (
          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th>Физлицо</th>
                  <th>Город / регион</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((p) => (
                  <tr key={p.person_id}>
                    <td>{p.person_id}</td>
                    <td>{orMissing(place(p))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="t-15">Связанные физлица не загружены.</p>
        ))}
      {data && <Shown data={data} />}
      <InfiniteLoader {...loaderProps(list)} />
    </Panel>
  )
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function MembersPanel({ companyId }: { companyId: string }) {
  const { user } = useAuth()
  const [userId, setUserId] = useState('')
  const [formError, setFormError] = useState('')
  const [added, setAdded] = useState(false)
  const list = useCompanyUsers(companyId, { limit: PAGE })
  const { isLoading } = list
  const data = flatPages(list.data)
  const add = useAddCompanyUser(companyId)

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    const id = userId.trim()
    setAdded(false)
    if (!UUID.test(id)) return setFormError('ID пользователя — это UUID из его меню профиля')
    if (id === user?.id) return setFormError('Вы уже участник этой компании')
    setFormError('')
    add.mutate(id, {
      onSuccess: () => {
        setUserId('')
        setAdded(true)
      },
    })
  }

  const apiError =
    add.error &&
    (add.error instanceof ApiError && add.error.status === 404
      ? 'Пользователь с таким ID не найден'
      : add.error.message)

  return (
    <Panel>
      <h2 className="t-h2">Участники компании</h2>
      <p className="t-13">
        Все участники видят данные компании и могут приглашать других. Ролей доступа нет.
      </p>
      {isLoading && <Skeleton lines={2} />}
      {data?.items.map((m) => (
        <Field
          key={m.user_id}
          label={`С ${formatDate(m.joined_at)}`}
          value={
            <>
              {m.full_name || m.user_id}
              {m.user_id === user?.id && <span className="c-muted"> · вы</span>}
            </>
          }
        />
      ))}
      {data && <Shown data={data} />}
      <InfiniteLoader {...loaderProps(list)} />
      <form className={s.col} style={{ gap: 10 }} onSubmit={onSubmit}>
        <TextField
          label="Добавить по ID пользователя"
          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
          value={userId}
          error={formError || apiError || undefined}
          onChange={(e) => {
            setUserId(e.target.value)
            setFormError('')
            setAdded(false)
          }}
        />
        {added && <Tag variant="green">Пользователь добавлен</Tag>}
        <Button type="submit" disabled={!userId.trim() || add.isPending}>
          {add.isPending ? 'Добавляем…' : 'Добавить участника'}
        </Button>
      </form>
    </Panel>
  )
}
