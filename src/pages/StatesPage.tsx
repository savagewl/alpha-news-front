import { useState } from 'react'
import { Button, StateCard, Tag } from '../components/ui'
import { PageHead } from '../layout/AppLayout'
import s from './pages.module.css'

/**
 * Витрина UI-состояний для жюри. Те же StateCard живут на рабочих экранах:
 * загрузка сводки и разбора, пустой фильтр, ошибка источника, нехватка данных.
 */
export default function StatesPage() {
  const [deferred, setDeferred] = useState(false)
  return (
    <>
      <PageHead
        crumb="UI-состояния"
        title="Когда данных недостаточно, интерфейс говорит об этом"
        subtitle="Пять независимых состояний · Каждое содержит причину и следующий шаг · Не смешаны с успешной выдачей"
      />

      <div className={s.grid2} style={{ alignItems: 'start' }}>
        <StateCard
          kind="loading"
          title="Готовим контекст компании"
          text="Ожидаем профиль и разрешённые источники. Ранжирование ещё не сформировано."
          note="Ожидание данных · результатов пока нет"
        />
        <StateCard
          kind="empty"
          title="По фильтрам ничего не найдено"
          text="Отрасль: машиностроение · Возможности · Только аналитика банка. Измените условия или сбросьте фильтры."
          action={<Button to="/digest">Сбросить фильтры</Button>}
          note="Где встречается: сводка с фильтрами"
        />
        <StateCard
          kind="error"
          title="Источник недоступен"
          text="Не удалось получить текст выбранного материала. Ответ по нему не сформирован."
          action={<Button>Повторить загрузку</Button>}
          note="Где встречается: разбор события, источники, Agent Trace"
        />
        <StateCard
          kind="insufficient"
          title="Для вывода не хватает данных"
          text="Нет графика кредита и структуры инвестбюджета U001. Общая связь с отраслью не позволяет оценить сумму эффекта. Уточните признаки компании."
          action={<Button to="/profile">Уточнить профиль</Button>}
          note="Где встречается: разбор события без полного набора признаков"
        />
      </div>

      <section className={s.block}>
        <div className={s.conflict}>
          <div className={s.col}>
            <Tag variant="red">Конфликт источников</Tag>
            <h2 className={s.answerTitle}>Источники расходятся — вывод отложен</h2>
            <p className="t-15">
              Два бюллетеня дают разные сроки логистической задержки. Объединять их в подтверждённый
              факт нельзя. В сводку не включена точная дата восстановления поставок.
            </p>
            {deferred ? (
              <p className="t-13 c-green" role="status">
                Вывод отложен до независимого подтверждения. Событие останется в сводке с пометкой
                «конфликт».
              </p>
            ) : (
              <Button onClick={() => setDeferred(true)}>Отложить вывод</Button>
            )}
          </div>
          <div className={s.col} style={{ gap: 16 }}>
            <div className={s.sourceBox}>
              <span className="t-semibold">■ Источник L1</span>
              <span>Срок: 3–5 дней · актуальность не проверена</span>
            </div>
            <div className={`${s.sourceBox} ${s.sourceBoxRed}`}>
              <span className="t-semibold">■ Источник L2</span>
              <span>Срок: не определён · требуется сверка</span>
            </div>
            <p className="t-11 c-muted">
              Требуется независимое подтверждение. Успешный статус не показан.
            </p>
          </div>
        </div>
      </section>
    </>
  )
}
