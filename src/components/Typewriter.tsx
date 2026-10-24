import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { parseRichText, plainText, type Segment } from './richText'

/** Блок печатается примерно за это время, независимо от длины */
const typingMs = 1500

const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

const commonPrefix = (a: string, b: string) => {
  let i = 0
  while (i < a.length && i < b.length && a[i] === b[i]) i++
  return i
}

/** Первые limit символов размеченного текста — стили сохраняются и у недопечатанного куска */
function renderSegments(segments: Segment[], limit = Infinity): ReactNode[] {
  const out: ReactNode[] = []
  let left = limit
  segments.forEach((seg, i) => {
    if (left <= 0) return
    const text = seg.text.slice(0, left)
    left -= text.length
    if (seg.style === 'bold') out.push(<strong key={i}>{text}</strong>)
    else if (seg.style === 'italic') out.push(<em key={i}>{text}</em>)
    else if (seg.style === 'code')
      out.push(
        <code key={i} className="t-mono">
          {text}
        </code>,
      )
    else out.push(text)
  })
  return out
}

/** Текст модели с разметкой (**жирный**, *курсив*, `код`) — без анимации */
export function RichText({ text }: { text: string }) {
  const segments = useMemo(() => parseRichText(text), [text])
  return <>{renderSegments(segments)}</>
}

/**
 * Текст в стиле печатной машинки — для ответа, который пришёл только что.
 * Разметка разбирается заранее, поэтому печатаются уже чистые символы без звёздочек.
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
  const segments = useMemo(() => parseRichText(text), [text])
  const plain = useMemo(() => plainText(segments), [segments])
  const instant = !animate || reducedMotion()
  const [shown, setShown] = useState(instant ? plain.length : 0)
  const prev = useRef<string | null>(null)
  const shownRef = useRef(shown)

  useEffect(() => {
    const show = (n: number) => {
      shownRef.current = n
      setShown(n)
    }
    if (instant) {
      prev.current = plain
      show(plain.length)
      return
    }
    // текст сменился (новый черновик или итог) — продолжаем с места расхождения,
    // но не дальше уже напечатанного
    const from =
      prev.current === null ? 0 : Math.min(commonPrefix(prev.current, plain), shownRef.current)
    prev.current = plain
    let n = from
    show(n)
    const step = Math.max(1, Math.ceil((plain.length - n) / ((typingMs / 1000) * 60)))
    let frame = 0
    const tick = () => {
      n = Math.min(plain.length, n + step)
      show(n)
      if (n < plain.length) frame = requestAnimationFrame(tick)
    }
    const timer = setTimeout(() => (frame = requestAnimationFrame(tick)), from ? 0 : delay)
    return () => {
      clearTimeout(timer)
      cancelAnimationFrame(frame)
    }
  }, [plain, instant, delay])

  const typing = shown < plain.length
  return (
    <>
      <span aria-hidden>
        {renderSegments(segments, shown)}
        {typing && <span className="tw-caret" />}
      </span>
      <span className="sr-only">{plain}</span>
    </>
  )
}
