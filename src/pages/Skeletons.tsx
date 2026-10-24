// Скелетоны экранов, которые ждут бэк, LLM или BGE: повторяют раскладку страницы,
// чтобы при появлении данных ничего не прыгало.
import type { InterpretationStage } from '../api/companyNewsTypes'
import { stageLabel } from '../api/interpretationStream'
import { SkeletonBar, SkeletonCard } from '../components/ui'
import { PageHead } from '../layout/AppLayout'
import h from './digest.module.css'
import s from './pages.module.css'

/** Сводка: главный вывод дня, панель фильтров, карточки ленты и колонка контекста */
export function DigestSkeleton({ note }: { note: string }) {
  return (
    <div className={h.layout} aria-busy>
      <div className={h.feed}>
        <SkeletonCard dark lines={3} />
        <div className={s.row} style={{ gap: 8, margin: '8px 0' }}>
          {[96, 72, 104, 96].map((w, i) => (
            <SkeletonBar key={i} width={w} height={32} />
          ))}
        </div>
        <p className="t-12 c-muted" role="status">
          {note}
        </p>
        {[0, 1, 2].map((i) => (
          <SkeletonCard key={i} chips={4} lines={2} />
        ))}
      </div>
      <aside className={h.aside}>
        <SkeletonCard lines={5} />
        <SkeletonCard lines={3} />
      </aside>
    </div>
  )
}

/** Экраны события (разбор, источники, trace), пока AI готовит интерпретацию */
export function EventSkeleton({
  crumb,
  stage,
}: {
  crumb: string
  /** Текущий этап потока — показываем, чем сейчас занят AI */
  stage?: InterpretationStage | null
}) {
  return (
    <>
      <PageHead
        crumb={crumb}
        title={<SkeletonBar width="min(560px, 80%)" height={30} />}
        subtitle="AI готовит разбор: черновик → проверка верификатором → доработка. Первый разбор занимает до полутора минут, повторный открывается сразу."
      />
      {stage && (
        <p className={`${h.stage} t-13`} role="status">
          <span className={h.stageDot} aria-hidden />
          {stageLabel[stage]}…
        </p>
      )}
      <div aria-busy role="status" className={s.col}>
        <SkeletonCard lines={2} />
        <div className={s.split}>
          <div className={s.col}>
            {[3, 2, 3].map((lines, i) => (
              <SkeletonCard key={i} lines={lines} />
            ))}
          </div>
          <div className={s.aside}>
            <SkeletonCard lines={3} />
            <SkeletonCard lines={4} />
          </div>
        </div>
      </div>
    </>
  )
}
