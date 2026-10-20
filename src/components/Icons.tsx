// Иконки lucide из макета. strokeWidth пересчитан под viewBox 24, чтобы толщина линии совпадала с Figma.
import type { ReactNode } from 'react'

interface IconProps {
  size: number
  strokeWidth: number
  color?: string
}

function Svg({
  size,
  strokeWidth,
  color = 'currentColor',
  children,
}: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  )
}

export const ChartIcon = () => (
  <Svg size={18} strokeWidth={24 / 18} color="var(--c-red)">
    <path d="M12 16v5" />
    <path d="M16 14v7" />
    <path d="M20 10v11" />
    <path d="m22 3-8.646 8.646a.5.5 0 0 1-.708 0L9.354 8.354a.5.5 0 0 0-.707 0L2 15" />
    <path d="M4 18v3" />
    <path d="M8 14v7" />
  </Svg>
)

export const UserIcon = () => (
  <Svg size={28} strokeWidth={24 / 28} color="var(--c-text)">
    <path d="M18 20a6 6 0 0 0-12 0" />
    <circle cx="12" cy="10" r="4" />
    <circle cx="12" cy="12" r="10" />
  </Svg>
)

export const ArrowUpRightIcon = () => (
  <Svg size={36} strokeWidth={2} color="var(--c-red)">
    <path d="M7 7h10v10" />
    <path d="M7 17 17 7" />
  </Svg>
)
