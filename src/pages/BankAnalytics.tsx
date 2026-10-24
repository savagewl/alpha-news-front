import { useState, type CSSProperties, type FormEvent } from 'react'
import {
  interpretationError,
  useAnalyticsDocuments,
  useAnalyticsSearch,
  useDocumentPassages,
} from '../api/companyNewsHooks'
import type { AnalyticsDocument, AnalyticsSearchHit, DocumentStatus } from '../api/companyNewsTypes'
import { plural } from '../api/companyFormat'
import { Icon } from '../components/Icons'
import { OpenPdf } from '../components/OpenPdf'
import { cx } from '../components/cx'
import {
  Button,
  OriginTag,
  SkeletonBar,
  SkeletonCard,
  StateCard,
  Tag,
  type TagVariant,
} from '../components/ui'
import h from './digest.module.css'

const documentStatus: Record<DocumentStatus, { label: string; variant: TagVariant }> = {
  ready: { label: 'Готов к смысловому поиску', variant: 'green' },
  parsed: { label: 'Текст извлечён', variant: 'green' },
  queued: { label: 'В очереди', variant: 'neutral' },
  extracting: { label: 'Извлекаем текст', variant: 'neutral' },
  indexing: { label: 'Индексируем', variant: 'neutral' },
  failed: { label: 'Ошибка обработки', variant: 'red' },
}

const processing = (d: AnalyticsDocument) =>
  d.status === 'queued' || d.status === 'extracting' || d.status === 'indexing'

const formatDay = (date: string | null) =>
  date ? new Date(date).toLocaleDateString('ru-RU', { dateStyle: 'long' }) : null

/** Аналитика банка в сводке: поиск по материалам и каталог PDF с фрагментами по страницам */
export function BankAnalytics() {
  const docs = useAnalyticsDocuments()
  const list = docs.data ?? []
  const ready = list.filter((d) => d.status === 'ready').length

  return (
    <div className={h.layout}>
      <div className={h.feed}>
        <Search />

        <h2 className={cx('t-h2', h.sectionTitle)}>
          Материалы банка{docs.data && ` · ${list.length}`}
        </h2>

        {docs.isPending && [0, 1, 2].map((i) => <SkeletonCard key={i} chips={2} lines={2} />)}
        {docs.isError && (
          <StateCard
            kind="error"
            title="Каталог аналитики недоступен"
            text="Не удалось получить материалы банка. Повторите попытку."
            action={<Button onClick={() => docs.refetch()}>Повторить</Button>}
          />
        )}
        {docs.data?.length === 0 && (
          <StateCard
            kind="empty"
            title="Материалы ещё не загружены"
            text="Когда банк загрузит аналитические обзоры, они появятся здесь и в разборах событий."
          />
        )}
        {list.map((d, i) => (
          <DocumentCard key={d.id} doc={d} index={i} />
        ))}
      </div>

      <aside className={h.aside}>
        <section className={cx(h.panel, 'appear')}>
          <h2 className="t-h2">Как используется</h2>
          <div className={h.facts}>
            <Fact label="Материалов" value={docs.data ? String(list.length) : null} />
            <Fact
              label="Готовы к смысловому поиску"
              value={docs.data ? `${ready} из ${list.length}` : null}
            />
          </div>
          <p className={h.note}>
            Позиция банка появляется в разборе события только по подтверждённым фрагментам этих
            материалов. AI её не заменяет.
          </p>
        </section>
      </aside>
    </div>
  )
}

function Search() {
  const search = useAnalyticsSearch()
  const [draft, setDraft] = useState('')
  const [asked, setAsked] = useState('')

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    const q = draft.trim()
    if (!q || search.isPending) return
    setAsked(q)
    search.mutate(q)
  }

  const result = search.data
  return (
    <section className={cx(h.panel, h.search, 'appear')}>
      <h2 className="t-h2">Поиск по аналитике банка</h2>
      <form className={h.searchForm} onSubmit={onSubmit}>
        <input
          type="search"
          aria-label="Запрос по аналитике банка"
          placeholder="Например: ключевая ставка, инфляция, сталь"
          value={draft}
          maxLength={300}
          onChange={(e) => setDraft(e.target.value)}
        />
        <Button variant="primary" type="submit" disabled={!draft.trim() || search.isPending}>
          {search.isPending ? 'Ищем…' : 'Найти'}
        </Button>
      </form>

      {search.isPending && (
        <div className={h.hits} aria-busy role="status">
          <p className="t-12 c-muted">Ищем фрагменты по смыслу и по словам…</p>
          {[0, 1, 2].map((i) => (
            <SkeletonCard key={i} chips={1} lines={3} />
          ))}
        </div>
      )}

      {search.isError && (
        <p className="t-13 c-red" role="alert">
          {interpretationError(search.error)}
        </p>
      )}

      {result && !search.isPending && (
        <div className={h.hits}>
          <p className="t-12 c-muted">
            {result.items.length
              ? `${result.items.length} ${plural(result.items.length, 'фрагмент', 'фрагмента', 'фрагментов')} по запросу «${asked}»`
              : `По запросу «${asked}» ничего не найдено`}
            {result.mode_used === 'keyword' &&
              ' · смысловой поиск сейчас недоступен, показаны совпадения по словам'}
          </p>
          {result.items.map((hit, i) => (
            <Hit key={`${hit.document_id}-${hit.chunk_id}`} hit={hit} index={i} />
          ))}
          {!!result.warnings?.length && <p className={h.note}>{result.warnings.join(' · ')}</p>}
        </div>
      )}
    </section>
  )
}

function Hit({ hit, index }: { hit: AnalyticsSearchHit; index: number }) {
  return (
    <article className={cx(h.hit, 'appear')} style={{ '--i': index } as CSSProperties}>
      <div className={h.chips}>
        <OriginTag origin="bank">Аналитика банка</OriginTag>
        <span className={h.chip}>{hit.title}</span>
        <span className={h.chip}>{hit.publisher}</span>
        {hit.published_at && <span className={h.chip}>{formatDay(hit.published_at)}</span>}
        <span className={h.chip}>стр. {hit.page_number}</span>
      </div>
      {hit.section && <p className="t-13 t-semibold">{hit.section}</p>}
      <p className={h.fragment}>{hit.text}</p>
      <OpenPdf documentId={hit.document_id} page={hit.page_number} />
    </article>
  )
}

function DocumentCard({ doc, index }: { doc: AnalyticsDocument; index: number }) {
  const [open, setOpen] = useState(false)
  const status = documentStatus[doc.status]
  const busy = processing(doc)

  return (
    <article className={cx(h.card, 'appear')} style={{ '--i': index } as CSSProperties}>
      <div className={h.cardTop}>
        <div className={h.chips}>
          <span className={cx(h.chip, h.chipRank)}>▤ {doc.publisher}</span>
          {doc.published_at && <span className={h.chip}>{formatDay(doc.published_at)}</span>}
          {doc.page_count > 0 && (
            <span className={h.chip}>
              {doc.page_count} {plural(doc.page_count, 'страница', 'страницы', 'страниц')}
            </span>
          )}
          {doc.chunk_count > 0 && (
            <span className={h.chip}>
              {doc.chunk_count} {plural(doc.chunk_count, 'фрагмент', 'фрагмента', 'фрагментов')}
            </span>
          )}
        </div>
        <Tag variant={status.variant} className={cx(busy && h.pulse)}>
          {status.label}
        </Tag>
      </div>
      <h3 className={h.cardTitle}>{doc.title}</h3>
      {busy && (
        <div className={h.assessing} aria-hidden>
          <SkeletonBar width="80%" />
          <SkeletonBar width="52%" />
        </div>
      )}
      {doc.error && <p className="t-13 c-red">{doc.error}</p>}
      {doc.embedding_error && (
        <p className={h.note}>
          Смысловой поиск по документу пока недоступен — работает поиск по словам.
        </p>
      )}
      {doc.warnings.length > 0 && <p className={h.note}>{doc.warnings.join(' · ')}</p>}
      <div className={h.origins}>
        <button
          type="button"
          className={h.origin}
          aria-expanded={open}
          disabled={doc.chunk_count === 0}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? 'Скрыть фрагменты' : 'Фрагменты по страницам'}
          <Icon name="chevronDown" size={12} />
        </button>
        <OpenPdf documentId={doc.id} />
      </div>
      {open && <Passages documentId={doc.id} />}
    </article>
  )
}

function Passages({ documentId }: { documentId: string }) {
  const { data, isPending, isError, refetch } = useDocumentPassages(documentId)

  if (isPending)
    return (
      <div className={h.hits} aria-busy>
        {[0, 1, 2].map((i) => (
          <SkeletonCard key={i} lines={2} />
        ))}
      </div>
    )
  if (isError)
    return (
      <p className="t-13 c-red" role="alert">
        Фрагменты не загрузились.{' '}
        <button type="button" className={h.inlineLink} onClick={() => refetch()}>
          Повторить
        </button>
      </p>
    )
  return (
    <ol className={h.hits}>
      {data.map((p, i) => (
        <li key={p.chunk_id} className={cx(h.hit, 'appear')} style={{ '--i': i } as CSSProperties}>
          <p className="t-12 c-muted">
            стр. {p.page_number}
            {p.section && ` · ${p.section}`}
          </p>
          <p className={h.fragment}>{p.text}</p>
        </li>
      ))}
    </ol>
  )
}

function Fact({ label, value }: { label: string; value: string | null }) {
  return (
    <div className={h.fact}>
      <span className={h.factLabel}>{label}</span>
      <span className={h.factValue}>{value ?? <SkeletonBar width={64} />}</span>
    </div>
  )
}
