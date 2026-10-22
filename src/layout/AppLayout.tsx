import { useState, type ReactNode } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/context'
import { ChartIcon, Icon, UserIcon, type IconName } from '../components/Icons'
import { Divider, Dropdown, MenuItem } from '../components/ui'
import { cx } from '../components/cx'
import { companies, findCompany, roles } from '../mocks/data'
import { useWorkspace } from '../state/context'
import s from './AppLayout.module.css'

const bankSections = ['Главная', 'Счета и платежи', 'Операции', 'Кредиты', 'Валютный контроль']

interface NavEntry {
  label: string
  to: string
  icon: IconName
  /** Дополнительные пути, на которых пункт считается активным */
  also?: string[]
}

const analyticsNav: NavEntry[] = [
  { label: 'Сводка', to: '/digest', icon: 'chart', also: ['/events'] },
  { label: 'Компании', to: '/companies', icon: 'building' },
  { label: 'Профиль компании', to: '/profile', icon: 'idCard' },
  { label: 'Сохранённое', to: '/saved', icon: 'bookmark' },
  { label: 'Источники', to: '/sources', icon: 'book' },
  { label: 'Agent Trace', to: '/trace', icon: 'route' },
  { label: 'Как это работает', to: '/how', icon: 'info' },
  { label: 'Безопасность', to: '/security', icon: 'shield' },
]

function useIsActive() {
  const { pathname } = useLocation()
  return (e: NavEntry) =>
    [e.to, ...(e.also ?? [])].some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

function CompanySwitcher({ compact }: { compact?: boolean }) {
  const { companyId, setCompany } = useWorkspace()
  const company = findCompany(companyId)
  return (
    <Dropdown
      label="Сменить компанию"
      className={s.company}
      trigger={
        <span className={s.companyTrigger}>
          {compact ? `${company.id} · ${company.shortName}` : company.shortName}
          <Icon name="chevronDown" size={14} />
        </span>
      }
    >
      {(close) =>
        companies.map((c) => (
          <MenuItem
            key={c.id}
            active={c.id === companyId}
            hint={`${c.id} · ${c.industry} · ${c.revenue}`}
            onSelect={() => {
              setCompany(c.id)
              close()
            }}
          >
            {c.name}
          </MenuItem>
        ))
      }
    </Dropdown>
  )
}

export function RoleSwitcher() {
  const { role, setRole } = useWorkspace()
  return (
    <Dropdown
      label="Сменить роль"
      align="right"
      trigger={
        <span className={s.roleTrigger}>
          {role}
          <Icon name="chevronDown" size={12} />
        </span>
      }
    >
      {(close) => (
        <>
          <p className={s.menuNote}>
            Роль меняет порядок событий и вопросы к бизнесу, но не расширяет права доступа.
          </p>
          {roles.map((r) => (
            <MenuItem
              key={r}
              active={r === role}
              onSelect={() => {
                setRole(r)
                close()
              }}
            >
              {r}
            </MenuItem>
          ))}
        </>
      )}
    </Dropdown>
  )
}

function UserMenu() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  return (
    <Dropdown label="Профиль пользователя" align="right" trigger={<UserIcon />}>
      {(close) => (
        <>
          <div className={s.userCard}>
            <span className="t-13 t-semibold">{user?.name}</span>
            <span className="t-12 c-muted">{user?.email}</span>
          </div>
          <Divider />
          <MenuItem
            onSelect={async () => {
              close()
              await logout()
              navigate('/login', { replace: true })
            }}
          >
            Выйти
          </MenuItem>
        </>
      )}
    </Dropdown>
  )
}

function Header() {
  return (
    <header className={s.header}>
      <Link to="/" className={s.logo}>
        Альфа-Бизнес
      </Link>
      <div className={s.headerCompany}>
        <CompanySwitcher />
      </div>
      {/* Постоянная точка входа в сервис на главном экране (критерий 09) */}
      <NavLink to="/digest" className={s.entry}>
        <ChartIcon />
        Новостная аналитика
      </NavLink>
      <Link to="/map" className={s.help}>
        Помощь
      </Link>
      <div className={s.user}>
        <UserMenu />
      </div>
    </header>
  )
}

function Sidebar() {
  const isActive = useIsActive()
  const { saved } = useWorkspace()
  return (
    <nav className={s.nav} aria-label="Разделы">
      <span className={s.navCaption}>ИНТЕРНЕТ-БАНК</span>
      {bankSections.map((label) =>
        label === 'Главная' ? (
          <Link key={label} to="/" className={s.bankItem}>
            {label}
          </Link>
        ) : (
          <span key={label} className={cx(s.bankItem, s.bankItemStub)}>
            {label}
          </span>
        ),
      )}
      <Divider />
      <span className={s.navCaption}>АЛЬФА БУДУЩЕЕ</span>
      {analyticsNav.map((e) => (
        <Link
          key={e.to}
          to={e.to}
          className={cx(s.navItem, isActive(e) && s.navItemActive)}
          aria-current={isActive(e) ? 'page' : undefined}
        >
          {e.label}
          {e.to === '/saved' && saved.length > 0 && <span className={s.count}>{saved.length}</span>}
        </Link>
      ))}
    </nav>
  )
}

/** Планшет: узкий рейл с иконками вместо сайдбара */
function Rail() {
  const isActive = useIsActive()
  const { pathname } = useLocation()
  return (
    <nav className={s.rail} aria-label="Разделы">
      <Link
        to="/"
        className={cx(s.railItem, pathname === '/' && s.railItemActive)}
        title="Главная"
        aria-label="Главная"
      >
        <Icon name="home" size={22} />
      </Link>
      {analyticsNav.map((e) => (
        <Link
          key={e.to}
          to={e.to}
          className={cx(s.railItem, isActive(e) && s.railItemActive)}
          title={e.label}
          aria-label={e.label}
          aria-current={isActive(e) ? 'page' : undefined}
        >
          <Icon name={e.icon} size={22} />
        </Link>
      ))}
    </nav>
  )
}

const tabs: NavEntry[] = [analyticsNav[0], analyticsNav[1], analyticsNav[3]]

/** Мобильный: нижние вкладки + лист «Ещё» с остальными разделами */
function TabBar() {
  const isActive = useIsActive()
  const [more, setMore] = useState(false)
  const restActive = analyticsNav.filter((e) => !tabs.includes(e)).some(isActive)
  return (
    <>
      <nav className={s.tabbar} aria-label="Разделы">
        {tabs.map((e) => (
          <Link
            key={e.to}
            to={e.to}
            className={cx(s.tab, isActive(e) && s.tabActive)}
            aria-current={isActive(e) ? 'page' : undefined}
          >
            <Icon name={e.icon} size={22} />
            {e.label === 'Сохранённое' ? 'Сохранено' : e.label}
          </Link>
        ))}
        <button
          type="button"
          className={cx(s.tab, (more || restActive) && s.tabActive)}
          aria-expanded={more}
          onClick={() => setMore((m) => !m)}
        >
          <Icon name="menu" size={22} />
          Ещё
        </button>
      </nav>
      {more && (
        <div className={s.sheetBackdrop} onClick={() => setMore(false)}>
          <nav className={s.sheet} aria-label="Ещё разделы" onClick={(e) => e.stopPropagation()}>
            <div className={s.sheetHead}>
              <span className="t-h2">Разделы</span>
              <button
                type="button"
                className={s.sheetClose}
                aria-label="Закрыть"
                onClick={() => setMore(false)}
              >
                <Icon name="close" size={20} />
              </button>
            </div>
            <Link to="/" className={s.sheetItem} onClick={() => setMore(false)}>
              <Icon name="home" size={20} />
              Главная Альфа-Бизнеса
            </Link>
            {analyticsNav
              .filter((e) => !tabs.includes(e))
              .map((e) => (
                <Link
                  key={e.to}
                  to={e.to}
                  className={cx(s.sheetItem, isActive(e) && s.sheetItemActive)}
                  onClick={() => setMore(false)}
                >
                  <Icon name={e.icon} size={20} />
                  {e.label}
                </Link>
              ))}
            <Link to="/map" className={s.sheetItem} onClick={() => setMore(false)}>
              <Icon name="info" size={20} />
              Карта экранов
            </Link>
          </nav>
        </div>
      )}
    </>
  )
}

export default function AppLayout() {
  return (
    <>
      <Header />
      <div className={s.workspace}>
        <Sidebar />
        <Rail />
        <main className={s.content}>
          <Outlet />
          <Footer />
        </main>
      </div>
      <TabBar />
    </>
  )
}

export function Footer() {
  return (
    <>
      <Divider />
      <footer className={s.footer}>
        <span>Альфа Хак · Новостная аналитика · 2026</span>
      </footer>
    </>
  )
}

/** Мобильный: компания и роль переезжают из шапки в карточку под заголовком */
function MobileContext() {
  const { companyId } = useWorkspace()
  const company = findCompany(companyId)
  return (
    <div className={s.mobileContext}>
      <CompanySwitcher />
      <span className="t-12 c-muted">
        {company.id} · {company.revenue} · {company.city}
      </span>
      <Divider />
      <RoleSwitcher />
    </div>
  )
}

/** Хлебные крошки, строка «АЛЬФА БУДУЩЕЕ / роль» и заголовок страницы */
export function PageHead({
  crumb,
  title,
  subtitle,
  section = 'Новостная аналитика',
  tag,
  children,
}: {
  crumb: string
  title: ReactNode
  subtitle: ReactNode
  /** средний уровень крошек; null — страница вне раздела аналитики */
  section?: string | null
  /** Правый элемент строки контекста; по умолчанию — переключатель роли */
  tag?: ReactNode
  /** Строка меток / действий под заголовком */
  children?: ReactNode
}) {
  const crumbs = ['Альфа-Бизнес', section, crumb].filter(Boolean).join('  /  ')
  const workspacePage = tag === undefined
  return (
    <>
      <p className={s.crumbs}>{crumbs}</p>
      <div className={s.context}>
        <span className={s.wordmark}>АЛЬФА БУДУЩЕЕ</span>
        <span className={cx(workspacePage && s.desktopOnly)}>
          {workspacePage ? <RoleSwitcher /> : tag}
        </span>
      </div>
      <div className={s.title}>
        <h1 className="t-h1">{title}</h1>
        <p className="t-15 c-muted">{subtitle}</p>
      </div>
      {workspacePage && <MobileContext />}
      {children && <div className={s.headExtra}>{children}</div>}
    </>
  )
}
