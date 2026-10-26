import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { InfiniteLoader } from './ui'

describe('InfiniteLoader', () => {
  it('loads the next portion only on button click', () => {
    const onLoad = vi.fn()
    render(<InfiniteLoader hasMore loading={false} onLoad={onLoad} />)
    expect(onLoad).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Показать ещё' }))
    expect(onLoad).toHaveBeenCalledTimes(1)
  })

  it('offers retry after an error', () => {
    const onLoad = vi.fn()
    render(<InfiniteLoader hasMore loading={false} error onLoad={onLoad} />)
    fireEvent.click(screen.getByRole('button', { name: 'Повторить' }))
    expect(onLoad).toHaveBeenCalledTimes(1)
  })

  it('renders nothing when everything is loaded', () => {
    const { container } = render(
      <InfiniteLoader hasMore={false} loading={false} onLoad={vi.fn()} />,
    )
    expect(container).toBeEmptyDOMElement()
  })
})
