import type { ReactNode } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/context'
import { ChartIcon, UserIcon } from '../components/Icons'
import { Divider, Tag } from '../components/ui'
import s from './AppLayout.module.css'

const bankSections = ['Главная', 'Счета и платежи', 'Операции', 'Кредиты', 'Валютный контроль']

const analyticsSections: { label: string; to?: string }[] = [
  { label: 'Сводка', to: '/digest' },
  { label: 'Компании', to: '/companies' },
  { label: 'Профиль компании', to: '/profile' },
  { label: 'Сохранённое' },
  { label: 'Источники' },
  { label: 'Agent Trace' },
  { label: 'Как это работает' },
  { label: 'Безопасность' },
]

function Header() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const onLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }
  return (
    <header className={s.header}>
      <Link to="/" className={s.logo}>
        Альфа-Бизнес
      </Link>
      <span className={s.company}>Вектор Машиностроение⌄</span>
      <Link to="/digest" className={s.entry}>
        <ChartIcon />
        Новостная аналитика
      </Link>
      <span className={s.help}>Помощь</span>
      <button
        type="button"
        className={s.userButton}
        onClick={onLogout}
        title={user ? `${user.email} · Выйти` : 'Выйти'}
        aria-label="Выйти"
      >
        <UserIcon />
      </button>
    </header>
  )
}

function Sidebar() {
  return (
    <nav className={s.nav}>
      <span className={s.navCaption}>ИНТЕРНЕТ-БАНК</span>
      {bankSections.map((label) =>
        label === 'Главная' ? (
          <Link key={label} to="/" className={s.bankItem}>
            {label}
          </Link>
        ) : (
          <span key={label} className={s.bankItem}>
            {label}
          </span>
        ),
      )}
      <Divider />
      <span className={s.navCaption}>АЛЬФА БУДУЩЕЕ</span>
      {analyticsSections.map(({ label, to }) =>
        to ? (
          <NavLink key={label} to={to} className={s.navItem}>
            {({ isActive }) =>
              isActive ? <span className={s.navItemActive}>{label}</span> : label
            }
          </NavLink>
        ) : (
          <span key={label} className={s.navItem}>
            {label}
          </span>
        ),
      )}
      <Divider />
      <span className={s.navCaption}>
        Все компании и события — синтетические. Интерфейс статичный.
      </span>
    </nav>
  )
}

export default function AppLayout() {
  return (
    <>
      <Header />
      <div className={s.workspace}>
        <Sidebar />
        <main className={s.content}>
          <Outlet />
          <Footer />
        </main>
      </div>
    </>
  )
}

export function Footer() {
  return (
    <>
      <Divider />
      <footer className={s.footer}>
        <span>Альфа Хак · Новостная аналитика · 2026</span>
        <span>AI помогает оценить контекст, но не принимает решения</span>
      </footer>
    </>
  )
}

/** Хлебные крошки, строка «АЛЬФА БУДУЩЕЕ / роль» и заголовок страницы */
export function PageHead({
  crumb,
  title,
  subtitle,
  section = 'Новостная аналитика',
  tag = <Tag>Финансовый директор ⌄</Tag>,
}: {
  crumb: string
  title: ReactNode
  subtitle: ReactNode
  /** средний уровень крошек; null — страница вне раздела аналитики */
  section?: string | null
  tag?: ReactNode
}) {
  const crumbs = ['Альфа-Бизнес', section, crumb].filter(Boolean).join('  /  ')
  return (
    <>
      <p className={s.crumbs}>{crumbs}</p>
      <div className={s.context}>
        <span className={s.wordmark}>АЛЬФА БУДУЩЕЕ</span>
        {tag}
      </div>
      <div className={s.title}>
        <h1 className="t-h1">{title}</h1>
        <p className="t-15 c-muted">{subtitle}</p>
      </div>
    </>
  )
}
