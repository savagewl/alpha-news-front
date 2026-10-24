import { useEffect, useRef, useState } from 'react'

/** Блок печатается примерно за это время, независимо от длины */
const typingMs = 1500

const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

const commonPrefix = (a: string, b: string) => {
  let i = 0
  while (i < a.length && i < b.length && a[i] === b[i]) i++
  return i
}

/**
 * Текст в стиле печатной машинки — для ответа, который пришёл только что.
 * Новый снимок продолжает печать с места расхождения, а не с начала.
 * Скринридер сразу получает полный текст.
 */
export function Typewriter({
  text,
  animate = true,
  delay = 0,
}: {
  text: string
  /** false — показать сразу: ответ взят из кеша, а не пришёл сейчас */
  animate?: boolean
  /** Задержка старта, чтобы блоки печатались по очереди */
  delay?: number
}) {
  const instant = !animate || reducedMotion()
  const [shown, setShown] = useState(instant ? text.length : 0)
  const prev = useRef<string | null>(null)
  const shownRef = useRef(shown)

  useEffect(() => {
    const show = (n: number) => {
      shownRef.current = n
      setShown(n)
    }
    if (instant) {
      prev.current = text
      show(text.length)
      return
    }
    // текст сменился (новый черновик или итог) — продолжаем с места расхождения,
    // но не дальше уже напечатанного
    const from =
      prev.current === null ? 0 : Math.min(commonPrefix(prev.current, text), shownRef.current)
    prev.current = text
    let n = from
    show(n)
    const step = Math.max(1, Math.ceil((text.length - n) / ((typingMs / 1000) * 60)))
    let frame = 0
    const tick = () => {
      n = Math.min(text.length, n + step)
      show(n)
      if (n < text.length) frame = requestAnimationFrame(tick)
    }
    const timer = setTimeout(() => (frame = requestAnimationFrame(tick)), from ? 0 : delay)
    return () => {
      clearTimeout(timer)
      cancelAnimationFrame(frame)
    }
  }, [text, instant, delay])

  const typing = shown < text.length
  return (
    <>
      <span aria-hidden>
        {text.slice(0, shown)}
        {typing && <span className="tw-caret" />}
      </span>
      <span className="sr-only">{text}</span>
    </>
  )
}
