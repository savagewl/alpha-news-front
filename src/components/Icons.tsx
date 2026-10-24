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

const paths = {
  chart: (
    <>
      <path d="M12 16v5" />
      <path d="M16 14v7" />
      <path d="M20 10v11" />
      <path d="m22 3-8.646 8.646a.5.5 0 0 1-.708 0L9.354 8.354a.5.5 0 0 0-.707 0L2 15" />
      <path d="M4 18v3" />
      <path d="M8 14v7" />
    </>
  ),
  user: (
    <>
      <path d="M18 20a6 6 0 0 0-12 0" />
      <circle cx="12" cy="10" r="4" />
      <circle cx="12" cy="12" r="10" />
    </>
  ),
  arrowUpRight: (
    <>
      <path d="M7 7h10v10" />
      <path d="M7 17 17 7" />
    </>
  ),
  home: (
    <>
      <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
      <path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </>
  ),
  wallet: (
    <>
      <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
      <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
    </>
  ),
  building: (
    <>
      <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
      <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
      <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
      <path d="M10 6h4" />
      <path d="M10 10h4" />
      <path d="M10 14h4" />
      <path d="M10 18h4" />
    </>
  ),
  bookmark: <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />,
  shield: (
    <>
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  bell: (
    <>
      <path d="M10.268 21a2 2 0 0 0 3.464 0" />
      <path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" />
    </>
  ),
  menu: (
    <>
      <path d="M4 12h16" />
      <path d="M4 18h16" />
      <path d="M4 6h16" />
    </>
  ),
  filter: (
    <>
      <path d="M3 6h18" />
      <path d="M7 12h10" />
      <path d="M10 18h4" />
    </>
  ),
  fileX: (
    <>
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="m14.5 12.5-5 5" />
      <path d="m9.5 12.5 5 5" />
    </>
  ),
  database: (
    <>
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5V19A9 3 0 0 0 21 19V5" />
      <path d="M3 12A9 3 0 0 0 21 12" />
    </>
  ),
  route: (
    <>
      <circle cx="6" cy="19" r="3" />
      <path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" />
      <circle cx="18" cy="5" r="3" />
    </>
  ),
  idCard: (
    <>
      <path d="M16 10h2" />
      <path d="M16 14h2" />
      <path d="M6.17 15a3 3 0 0 1 5.66 0" />
      <circle cx="9" cy="11" r="2" />
      <rect x="2" y="5" width="20" height="14" rx="2" />
    </>
  ),
  book: (
    <>
      <path d="M12 7v14" />
      <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </>
  ),
  // Фильтры сводки: риски, возможности, все новости, аналитика банка
  risk: (
    <>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </>
  ),
  trendUp: (
    <>
      <path d="M16 7h6v6" />
      <path d="m22 7-8.5 8.5-5-5L2 17" />
    </>
  ),
  newspaper: (
    <>
      <path d="M15 18h-5" />
      <path d="M18 14h-8" />
      <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-4 0v-9a2 2 0 0 1 2-2h2" />
      <rect width="8" height="4" x="10" y="6" rx="1" />
    </>
  ),
  bank: (
    <>
      <path d="M10 18v-7" />
      <path d="M11.12 2.198a2 2 0 0 1 1.76.006l7.866 3.847c.476.233.31.949-.22.949H3.474c-.53 0-.695-.716-.22-.949z" />
      <path d="M14 18v-7" />
      <path d="M18 18v-7" />
      <path d="M3 22h18" />
      <path d="M6 18v-7" />
    </>
  ),
  chevronDown: <path d="m6 9 6 6 6-6" />,
  close: (
    <>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </>
  ),
  arrowUp: (
    <>
      <path d="m5 12 7-7 7 7" />
      <path d="M12 19V5" />
    </>
  ),
}

export type IconName = keyof typeof paths

/** Иконка набора; размер и цвет — из макета конкретного места */
export function Icon({
  name,
  size = 20,
  color,
  strokeWidth = 1.5,
}: {
  name: IconName
  size?: number
  color?: string
  strokeWidth?: number
}) {
  return (
    <Svg size={size} strokeWidth={strokeWidth} color={color}>
      {paths[name]}
    </Svg>
  )
}

export const ChartIcon = () => (
  <Icon name="chart" size={18} strokeWidth={24 / 18} color="var(--c-red)" />
)

export const UserIcon = () => (
  <Icon name="user" size={28} strokeWidth={24 / 28} color="var(--c-text)" />
)

export const ArrowUpRightIcon = () => (
  <Icon name="arrowUpRight" size={36} strokeWidth={2} color="var(--c-red)" />
)

// Иконки нового макета главной — контуры экспортированы из Figma как есть

/** Знак «А» Альфа-Банка: в сайдбаре и на мини-карте счёта */
export const AlfaLogo = ({
  width = 41,
  color = 'var(--c-red)',
}: {
  width?: number
  color?: string
}) => (
  <svg width={width} height={(width * 60) / 41} viewBox="0 0 41 60" fill={color} aria-hidden>
    <path
      fillRule="evenodd"
      d="M1.2 59.98v-8.19h39.13v8.19H1.2Zm13.98-34.52h10.87L20.87 9.03h-.2l-5.49 16.43ZM27.88 6l11.54 34.66h-8.54l-2.59-8.24H12.84l-2.8 8.24H2.01L14.12 6C15.3 2.64 16.66 0 21.07 0c4.41 0 5.69 2.65 6.81 6Z"
    />
  </svg>
)

/** Залитый силуэт пользователя на кнопке профиля */
export const UserGlyph = () => (
  <svg width="16" height="16" viewBox="12 12 16 16" fill="#181a19" aria-hidden>
    <path d="M25.45 27.86c.93 0 1.7-.76 1.49-1.67a7.14 7.14 0 0 0-13.88 0c-.22.9.56 1.67 1.49 1.67h10.9Z" />
    <circle cx="20" cy="15.75" r="3.18" />
  </svg>
)

/** Сердце «Сохранить»: залитое красным, когда событие сохранено */
export const HeartIcon = ({ filled }: { filled?: boolean }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 14 14"
    fill={filled ? 'var(--c-red)' : 'none'}
    stroke={filled ? 'var(--c-red)' : 'var(--c-text)'}
    strokeWidth="1.13"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M4.25 2.02c-.85 0-1.7.27-2.34.92-1.3 1.3-1.26 3.32 0 4.62l4.13 4.32c.52.55 1.4.55 1.93 0l4.13-4.32c1.25-1.3 1.29-3.32 0-4.62a3.85 3.85 0 0 0-4.68 0L7 3.38l-.41-.44a3.27 3.27 0 0 0-2.34-.92Z" />
  </svg>
)

/** Звёзды у вывода AI в карточке события */
export const SparklesIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="var(--c-text)" aria-hidden>
    <path d="m7.22 1.6 1.36 2.91a6 6 0 0 0 2.95 2.95l2.91 1.36-2.91 1.36a6 6 0 0 0-2.95 2.95l-1.36 2.91-1.36-2.91a6 6 0 0 0-2.95-2.95L0 8.82l2.91-1.36a6 6 0 0 0 2.95-2.95L7.22 1.6Z" />
    <path d="m15.67 9.68.44.94a6 6 0 0 0 2.95 2.95l.94.44-.94.44a6 6 0 0 0-2.95 2.95l-.44.94-.44-.94a6 6 0 0 0-2.95-2.95l-.94-.44.94-.44a6 6 0 0 0 2.95-2.95l.44-.94Z" />
    <path d="M14.85 0a5.8 5.8 0 0 0 2.77 2.77 5.8 5.8 0 0 0-2.77 2.77 5.8 5.8 0 0 0-2.77-2.77A5.8 5.8 0 0 0 14.85 0Z" />
  </svg>
)
