// Мок-бэкенд новостной аналитики. Функции асинхронные и повторяют будущие эндпоинты —
// при подключении бэкенда меняется этот файл (или хуки в api/newsHooks.ts), а не страницы.
import type {
  Answer,
  Digest,
  Interpretation,
  InterpretationBlock,
  NewsEvent,
  Source,
  Trace,
  TraceStep,
} from '../api/newsTypes'
import { findCompany, roleFocus, shortRole } from './data'
import {
  digestHeroes,
  events,
  findAnalytics,
  incomingEvents,
  interpretations,
  presetAnswer,
} from './news'

const wait = (ms = 450) => new Promise((r) => setTimeout(r, ms))

export function plural(n: number, one: string, few: string, many: string) {
  const d = n % 10
  const dd = n % 100
  const word = d === 1 && dd !== 11 ? one : d >= 2 && d <= 4 && (dd < 12 || dd > 14) ? few : many
  return `${n} ${word}`
}

/** Новости, «пришедшие» после открытия сводки. Живут до перезагрузки страницы */
const delivered = new Set<string>()

const allEvents = () => [...incomingEvents.filter((e) => delivered.has(e.id)), ...events]

/** Роль не меняет набор данных, только порядок: темы роли поднимаются выше */
function rankForRole(list: NewsEvent[], role: string) {
  const topics = roleFocus[role]?.topics ?? []
  const level = { Высокая: 0, Средняя: 1, Низкая: 2 }
  return list
    .map((e, i) => ({ e, i }))
    .sort((a, b) => {
      const byLevel = level[a.e.relevance] - level[b.e.relevance]
      if (byLevel) return byLevel
      const boost = Number(topics.includes(b.e.topic)) - Number(topics.includes(a.e.topic))
      return boost || a.i - b.i
    })
    .map(({ e }) => e)
}

export function findEvent(id: string) {
  return allEvents().find((e) => e.id === id)
}

export const newsMock = {
  async digest(companyId: string, role: string): Promise<Digest> {
    await wait()
    const hero = digestHeroes[companyId] ?? digestHeroes.U001
    const own = allEvents().filter((e) => e.companyId === companyId)
    return { ...hero, companyId, role, events: rankForRole(own, role) }
  },

  /** Забрать следующую ещё не показанную новость; null — новых нет */
  async pullNews(companyId: string): Promise<NewsEvent | null> {
    await wait(900)
    const next = incomingEvents.find((e) => e.companyId === companyId && !delivered.has(e.id))
    if (!next) return null
    delivered.add(next.id)
    return next
  },

  async interpretation(eventId: string): Promise<Interpretation> {
    await wait()
    const event = findEvent(eventId)
    if (!event) throw new Error('Событие не найдено')
    const company = findCompany(event.companyId)
    const detailed = interpretations[eventId]
    const sources = sourcesFor(event)
    if (detailed) return { event, detailed: true, sources, ...detailed }

    const blocks: InterpretationBlock[] = [
      {
        question: 'Что произошло?',
        origin: 'fact',
        label: 'Факт',
        text: `${event.title}. ${event.text}`,
        basis: `[${event.sourceCode}] ${event.sourceTitle} · ${event.date}`,
      },
      {
        question: 'Почему это важно для этой компании?',
        origin: 'ai',
        label: 'Вывод AI',
        text: `Событие отобрано для ${company.name} по признакам: ${event.relevanceReason}. Отрасль — ${company.industry.toLowerCase()}, выручка ${company.revenue}, продукты: ${company.products.join(', ')}.`,
        basis: `[P] Профиль ${company.id} + [${event.sourceCode}]. Связь с бизнесом — гипотеза AI.`,
      },
    ]
    return {
      event,
      detailed: false,
      title: event.title,
      main: event.text,
      blocks,
      context: `${company.revenue} · ${company.industry} · ${company.group} · ${company.products.join(', ')}.`,
      limits: company.completeness.text,
      sources,
    }
  },

  async trace(eventId: string, role: string): Promise<Trace> {
    await wait()
    const event = findEvent(eventId)
    if (!event) throw new Error('Событие не найдено')
    return buildTrace(event, role)
  },

  async ask(eventId: string, question: string, role: string): Promise<Answer> {
    await wait(1400)
    const event = findEvent(eventId)
    if (!event) throw new Error('Событие не найдено')
    return buildAnswer(event, question, role)
  },
}

export function sourcesFor(event: NewsEvent): Source[] {
  const company = findCompany(event.companyId)
  const bank = findAnalytics(event.bankRef)
  const list: Source[] = [
    {
      code: event.sourceCode,
      title: event.sourceTitle,
      kind: event.sourceTitle.startsWith('ТЗ') ? 'case' : 'news',
      date: event.date,
      available: true,
      note: event.sourceTitle.startsWith('ТЗ')
        ? '«Альфа Хак_Новостная аналитика.pdf» — источник требований. Использовано как основание факта, не как актуальный рыночный источник.'
        : 'Первоисточник новости.',
    },
    {
      code: 'P',
      title: `Профиль ${company.id} · ${company.shortName}`,
      kind: 'profile',
      available: true,
      note: 'Данные о компании, ТЗ стр. 15–16.',
    },
  ]
  if (bank)
    list.push({
      code: bank.code,
      title: bank.title,
      kind: 'bank',
      available: bank.available,
      note: bank.available
        ? (bank.summary ?? '')
        : 'Доступен заголовок из перечня на стр. 17. Цитаты и банковская оценка не извлечены.',
    })
  return list
}

function buildTrace(event: NewsEvent, role: string): Trace {
  const company = findCompany(event.companyId)
  const bank = findAnalytics(event.bankRef)
  const scope = `${company.id}/${shortRole(role)}`
  const bankFound = !!bank?.available
  const steps: TraceStep[] = [
    {
      id: 'plan',
      title: 'Планирование',
      short: 'Планирование',
      at: '00:00.0',
      ms: 120,
      call: `plan.build(company=${company.id}, role=${shortRole(role)}, event=${event.sourceCode})`,
      result: `План: проверить профиль → найти событие → запросить банковский обзор → оценить релевантность. Контекст зафиксирован: ${company.id} / ${shortRole(role)}.`,
      note: 'План зафиксирован в контексте',
      status: 'done',
    },
    {
      id: 'profile',
      title: 'Поиск профиля',
      short: 'Профиль',
      at: '00:00.1',
      ms: 180,
      call: `profile.get(SYNTHETIC_U=${company.id}, scope=read)`,
      result: `Найдено: ОКВЭД ${company.okved}; выручка ${company.revenue}; ${company.products.join(', ')}${company.fts.countries.length ? `; ФТС ${company.fts.countries.join(' / ')}` : ''}; ${company.group}. ${company.completeness.text}`,
      note: 'P · профиль компании',
      status: 'done',
    },
    {
      id: 'news',
      title: 'Поиск новостей',
      short: 'Новости',
      at: '00:00.3',
      ms: 240,
      call: `news.search(topic=${event.topic}, period=7d)`,
      result: `Найден ${event.sourceCode}: «${event.title}», ${event.date}. Классификация: ${event.kind === 'risk' ? 'риск' : 'возможность'}, тема «${event.topic}».`,
      note: `${event.sourceCode} · ${event.sourceTitle}`,
      status: 'done',
    },
    {
      id: 'rag',
      title: 'RAG по аналитике',
      short: 'RAG',
      at: '00:00.6',
      ms: 420,
      call: bank
        ? `rag.search(title="${bank.title.slice(0, 22)}…", acl=${scope})`
        : `rag.search(topic=${event.topic}, acl=${scope})`,
      result: bankFound
        ? `Найден материал ${bank.code}. Фрагменты переданы в интерпретацию с цитированием.`
        : bank
          ? `Найден только заголовок ${bank.code}. Полного обзора нет → повторный поиск по теме и дате → 0 фрагментов. Подтверждение позиции банка не найдено.`
          : 'Материала по теме в каталоге нет → повторный поиск по отрасли → 0 фрагментов. Позиция банка не установлена.',
      note: bank
        ? `${bank.code} · каталог, стр. 17 · адаптация: позиция ограничена`
        : 'B0 · адаптация: позиция ограничена',
      status: bankFound ? 'done' : 'retry',
    },
    {
      id: 'rank',
      title: 'Оценка релевантности',
      short: 'Релевантность',
      at: '00:01.0',
      ms: 160,
      call: `rank.evaluate(event=${event.sourceCode}, features=[${event.topic}, role, sector])`,
      result: `Приоритет «${event.relevance}»: ${event.relevanceReason}. Неизвестные значения не домысливаются.`,
      note: event.relevanceReason,
      status: 'done',
    },
    {
      id: 'interpret',
      title: 'Интерпретация',
      short: 'Интерпретация',
      at: '00:01.2',
      ms: 510,
      call: `interpret.compose(schema=six_questions, evidence=[${event.sourceCode}, P${bank ? `, ${bank.code}` : ''}])`,
      result:
        'Сформировано 6 блоков. Факт, AI-гипотезы и доступность аналитики размечены отдельно. Действия ограничены вопросами и проверкой сценария.',
      note: `${event.sourceCode} + P${bank ? ` · ${bank.code} только метаданные` : ''}`,
      status: 'done',
    },
    {
      id: 'verify',
      title: 'Самопроверка',
      short: 'Проверка',
      at: '00:01.7',
      ms: 220,
      call: 'verify.check(citations, uncertainty, bank_attribution)',
      result:
        'Проверены источники существенных выводов. Убрана неподтверждённая позиция банка. Нет точных потерь и платёжных действий. Вывод выпущен с ограничениями.',
      note: 'Итог: факт доступен / оценка условна / банк не подтверждён',
      status: 'done',
    },
  ]
  return {
    eventId: event.id,
    headline: bankFound
      ? 'Обзор найден → вывод опирается на позицию банка.'
      : 'Нет полного обзора → нет утверждения от имени банка.',
    summary: bankFound
      ? 'Планировщик нашёл материал банка и передал фрагменты в интерпретацию.'
      : 'Показана адаптация собственного планировщика: повторный поиск и явное ограничение ответа.',
    totalSec: '1,92 с',
    steps,
    context: {
      company: company.id,
      event: `${event.sourceCode} · ${event.title}`,
      access: 'Только чтение',
    },
  }
}

function buildAnswer(event: NewsEvent, question: string, role: string): Answer {
  const company = findCompany(event.companyId)
  const id = crypto.randomUUID()
  const q = question.toLowerCase()
  const refs: Answer['refs'] = [
    { origin: 'fact', label: `${event.sourceCode} · ${event.sourceTitle.split(' · ')[0]}` },
    { origin: 'fact', label: `P · ${company.id}` },
  ]
  if (event.bankRef) refs.push({ origin: 'bank', label: `${event.bankRef} · только заголовок` })

  if (event.id === presetAnswer.eventId && question === presetAnswer.question)
    return {
      id,
      question,
      headline: presetAnswer.headline,
      lead: presetAnswer.lead,
      section: presetAnswer.section,
      need: presetAnswer.need,
      limits: presetAnswer.limits,
      refs: [
        { origin: 'fact', label: 'S1 · стр. 11' },
        { origin: 'fact', label: 'P1 · Кредиты' },
        { origin: 'fact', label: 'P2 · ОКВЭД 28.29' },
      ],
    }

  const limits = 'Вывод AI по доступному контексту, не позиция банка.'

  if (q.includes('риск')) {
    const risks = events.filter((e) => e.companyId === company.id && e.kind === 'risk')
    return {
      id,
      question,
      headline: `${plural(risks.length, 'риск', 'риска', 'рисков')} в сводке ${company.id} на горизонте квартала.`,
      lead: 'Другой разрез той же сводки: только риски, по убыванию релевантности для вашей роли.',
      section: {
        title: 'Риски',
        items: risks.map((e) => `${e.title} — ${e.text} [${e.sourceCode}]`),
      },
      need: 'Для оценки на квартал нужны: платёжный календарь, график долга и контрактные сроки.',
      limits,
      refs,
    }
  }

  if (q.includes('контрагент')) {
    return {
      id,
      question,
      headline: company.links.length
        ? `В профиле ${company.id} ${plural(company.links.length, 'обезличенный контрагент', 'обезличенных контрагента', 'обезличенных контрагентов')}.`
        : `Платёжные связи ${company.id} в наборе не заполнены.`,
      lead: 'Связи взяты из платежей компании (PAYER / BENEFICIARY). Наличие связи не доказывает риск.',
      section: company.links.length
        ? {
            title: 'Контрагенты',
            items: company.links.map(
              (l) => `${l.who} — ${l.direction}, ${l.amount}, ${l.count} платежей [P]`,
            ),
          }
        : undefined,
      need: 'Чтобы связать событие с контрагентом, нужны договоры и отрасль контрагента.',
      limits,
      refs,
    }
  }

  if (q.includes('банк')) {
    return {
      id,
      question,
      headline: 'Позиция банка и вывод AI в этом разборе разделены.',
      lead: event.bankRef
        ? `По событию найден материал банка [${event.bankRef}], но доступен только заголовок. Всё, что помечено «AI · условный вывод», сформировано моделью и не является позицией банка.`
        : 'По событию в каталоге аналитики банка нет материала. Все выводы помечены как AI и требуют подтверждения.',
      need: 'Чтобы показать позицию банка, нужен полный текст обзора.',
      limits,
      refs,
    }
  }

  return {
    id,
    question,
    headline: `Ответ ограничен доступными данными по ${company.shortName}.`,
    lead: `Событие «${event.title}» [${event.sourceCode}] отобрано по признакам: ${event.relevanceReason}. Для роли «${shortRole(role)}» важно: ${event.text}`,
    need: `Чтобы уточнить ответ, не хватает данных профиля. ${company.completeness.text}`,
    limits,
    refs,
  }
}
