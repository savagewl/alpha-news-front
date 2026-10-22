import { useState } from 'react'
import { Button } from './ui'

type Vote = 'useful' | 'missed'

/**
 * Обратная связь по выводу — вход для мониторинга качества персонализации (критерий 08).
 * В демо оценка живёт только в состоянии компонента; бэкенд будет принимать её отдельным запросом.
 */
export function Feedback({ question }: { question?: string }) {
  const [vote, setVote] = useState<Vote | null>(null)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {question && <p className="t-13 t-semibold">{question}</p>}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        <Button pressed={vote === 'useful'} onClick={() => setVote('useful')}>
          ↑ Полезно
        </Button>
        <Button pressed={vote === 'missed'} onClick={() => setVote('missed')}>
          ↓ Не учтён контекст
        </Button>
      </div>
      {vote && (
        <p className="t-12 c-muted" role="status">
          {vote === 'useful'
            ? 'Спасибо! Оценка учитывается в мониторинге качества.'
            : 'Спасибо! Отзыв попадёт в правила ранжирования после проверки качества. Дополните профиль, если чего-то не хватает.'}
        </p>
      )}
    </div>
  )
}
