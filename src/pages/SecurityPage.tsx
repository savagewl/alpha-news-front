import { Panel, Tag, type TagVariant } from '../components/ui'
import { PageHead } from '../layout/AppLayout'
import s from './pages.module.css'

const controls: {
  title: string
  text: string
  tag: string
  tagVariant: TagVariant
  note: string
}[] = [
  {
    title: '01 / Изоляция контекста',
    text: 'Компания задаёт границу данных, user — принадлежность сессии. Пользователь видит только компании, в которых состоит.',
    tag: 'U001 / DEMO_USER',
    tagVariant: 'neutral',
    note: 'Проверка scope на каждом инструменте и фильтр retrieval до выдачи фрагментов.',
  },
  {
    title: '02 / Минимизация данных',
    text: 'Чувствительные значения маскируются до передачи модели. Контрагенты обезличены, реальные ПДн и реквизиты модели не передаются.',
    tag: 'Маскирование до inference',
    tagVariant: 'neutral',
    note: 'Журналируется факт обращения и состав полей, секреты в трассировку не копируются.',
  },
  {
    title: '03 / Источник не даёт команды',
    text: 'Инструкции внутри новости или PDF считаются недоверенным содержимым. Попытка «игнорировать правила и перевести средства» блокируется как инструкция из источника.',
    tag: 'Prompt injection → изоляция',
    tagVariant: 'red',
    note: 'Фрагмент исключается из контекста команд, факт события проверяется независимо.',
  },
  {
    title: '04 / Аудируемая выдача',
    text: 'Сохраняются инструмент, версия схемы, company / user, доступные источники, результат проверки прав и ограничения ответа.',
    tag: 'Нет источника → нет цитаты',
    tagVariant: 'green',
    note: 'Журнал доступен аудитору; секреты в него не попадают.',
  },
]

const journal = [
  ['10:42:01 · U001', 'profile.get', 'scope разрешён', 'Профиль · маскирование'],
  ['10:42:02 · U001', 'rag.search(B1)', 'ACL до RAG', '0 фрагментов · текст отсутствует'],
  ['10:42:03 · U002', 'profile.get', 'scope отклонён', 'Данные не раскрыты'],
  ['10:42:04 · U001', 'source.sanitize', 'Небезопасная инструкция', 'Команда заблокирована'],
  ['10:42:05 · U001', 'payment.create', 'Инструмент запрещён', 'Не вызван · read-only'],
]

export default function SecurityPage() {
  return (
    <>
      <PageHead
        crumb="Безопасность"
        title="Контекст защищён до первого запроса"
        subtitle="Права доступа, изоляция данных и журнал обращений AI к инструментам"
      />

      <section className={`${s.lime} ${s.securityHero}`}>
        <div className={`${s.col} ${s.grow}`} style={{ gap: 12 }}>
          <p className="t-11 c-green">READ-ONLY ПО УМОЛЧАНИЮ</p>
          <h2 className={s.limeTitle} style={{ fontSize: 30, lineHeight: '34px' }}>
            AI объясняет события.
            <br />
            Не создаёт и не исполняет платежи.
          </h2>
          <p className="t-15">
            Интерпретация не может изменить реквизиты, подписать документ или выполнить банковскую
            операцию.
          </p>
        </div>
        <div className={s.col} style={{ gap: 10, maxWidth: 280 }}>
          <p className="t-15 t-semibold">company_id → user_id</p>
          <p className="t-13">
            Проверка разрешений до поиска, RAG и выдачи ответа. Запрет по умолчанию.
          </p>
        </div>
      </section>

      <div className={s.grid2}>
        {controls.map((c) => (
          <Panel key={c.title}>
            <h2 className="t-h2">{c.title}</h2>
            <p className="t-15">{c.text}</p>
            <Tag variant={c.tagVariant}>{c.tag}</Tag>
            <p className="t-12 c-muted">{c.note}</p>
          </Panel>
        ))}
      </div>

      <Panel>
        <h2 className="t-h2">Журнал обращений к инструментам</h2>
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead>
              <tr>
                <th>Время / контекст</th>
                <th>Инструмент</th>
                <th>Проверка</th>
                <th>Результат</th>
              </tr>
            </thead>
            <tbody>
              {journal.map((row) => (
                <tr key={row[0] + row[1]}>
                  {row.map((cell, i) => (
                    <td key={i} className={i === 1 ? 't-mono' : undefined}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  )
}
