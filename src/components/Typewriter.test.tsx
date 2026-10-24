import { act, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Typewriter } from './Typewriter'

const typed = (c: HTMLElement) => c.querySelector('[aria-hidden]')?.textContent ?? ''

describe('Typewriter', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('shows text at once without animation', () => {
    const { container } = render(<Typewriter text="Ставка выросла" animate={false} />)
    expect(typed(container)).toBe('Ставка выросла')
  })

  it('types text gradually and keeps full text for screen readers', () => {
    const text = 'Решение может повлиять на стоимость кредита.'
    const { container } = render(<Typewriter text={text} />)
    expect(container.querySelector('.sr-only')?.textContent).toBe(text)
    expect(typed(container)).toBe('')
    act(() => vi.advanceTimersByTime(200))
    const partial = typed(container)
    expect(partial.length).toBeGreaterThan(0)
    expect(partial.length).toBeLessThan(text.length)
    act(() => vi.advanceTimersByTime(3000))
    expect(typed(container)).toBe(text)
  })
})
