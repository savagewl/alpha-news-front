import { useEffect, useState, type ReactNode } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { companyTitle, formatDecimal, place } from '../api/companyFormat'
import { useCompanies, useCompany } from '../api/companyHooks'
import { ApiError } from '../api/client'
import { useAuth } from '../auth/context'
import { AlfaLogo, Icon, UserGlyph, type IconName } from '../components/Icons'
import { Divider, Dropdown, MenuItem } from '../components/ui'
import { cx } from '../components/cx'
import { useWorkspace } from '../state/context'
import s from './AppLayout.module.css'
import { ChangePasswordDialog } from './ChangePasswordDialog'
import { CompanyPickerDialog } from './CompanyPickerDialog'

interface NavEntry {
  label: string
  to: string
  icon: IconName
  /** Дополнительные пути, на которых пункт считается активным */
  also?: string[]
}

const analyticsNav: NavEntry[] = [
  { label: 'Сводка', to: '/digest', icon: 'chart', also: ['/events', '/articles'] },
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

/** Компании пользователя для переключателя — первых 100 хватает, полный список на «Компаниях» */
const switcherQuery = { limit: 100, offset: 0 }

/**
 * Держит выбранную компанию в пределах доступных: пустой выбор или компания, к которой
 * больше нет доступа, заменяется первой из списка.
 */
function useCompanyGuard() {
  const { companyId, setCompany } = useWorkspace()
  const list = useCompanies(switcherQuery)
  const current = useCompany(companyId)
  const lost = current.error instanceof ApiError && [403, 404].includes(current.error.status)
  const first = list.data?.items[0]?.id ?? ''
  useEffect(() => {
    if (!list.data) return
    if ((!companyId || lost) && first !== companyId) setCompany(first)
  }, [list.data, companyId, lost, first, setCompany])
}

function CompanySwitcher({ compact }: { compact?: boolean }) {
  const { companyId, setCompany } = useWorkspace()
  const [open, setOpen] = useState(false)
  const list = useCompanies(switcherQuery)
  const current = useCompany(companyId)
  const items = list.data?.items ?? []
  // выбранная компания может не попасть в первую порцию списка — берём её отдельным запросом
  const company = items.find((c) => c.id === companyId) ?? current.data
  const title = company
    ? companyTitle(company)
    : list.isLoading
      ? 'Загрузка…'
      : 'Компания не выбрана'
  return (
    <div className={s.company}>
      <button
        type="button"
        className={s.companyButton}
        aria-haspopup="dialog"
        aria-label="Сменить компанию"
        onClick={() => setOpen(true)}
      >
        <span className={s.companyTrigger}>
          <span className={s.triggerText}>
            {compact && company ? `${company.id} · ${title}` : title}
          </span>
          <Icon name="chevronDown" size={14} color="var(--c-hint)" />
        </span>
      </button>
      {open && (
        <CompanyPickerDialog
          currentId={companyId}
          onSelect={setCompany}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  )
}

function UserMenu() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [changing, setChanging] = useState(false)
  return (
    <>
      <Dropdown
        label="Профиль пользователя"
        align="right"
        trigger={
          <span className={s.userTrigger}>
            <UserGlyph />
          </span>
        }
      >
        {(close) => (
          <>
            <div className={s.userCard}>
              <span className="t-13 t-semibold">{user?.name}</span>
              <span className="t-12 c-muted">{user?.email}</span>
              <span className="t-12 c-muted">ID для приглашения в компанию: {user?.id}</span>
            </div>
            <Divider />
            <MenuItem
              onSelect={() => {
                close()
                setChanging(true)
              }}
            >
              Сменить пароль
            </MenuItem>
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
      {changing && <ChangePasswordDialog onClose={() => setChanging(false)} />}
    </>
  )
}

function Header() {
  return (
    <header className={s.topbar}>
      {/* На десктопе знак банка живёт в сайдбаре, в шапке — только без сайдбара */}
      <Link to="/" className={cx(s.logo, s.topbarLogo)}>
        Альфа-Бизнес
      </Link>
      <div className={s.headerCompany}>
        <CompanySwitcher />
      </div>
      {/* Постоянная точка входа в сервис на главном экране (критерий 09) */}
      <NavLink to="/digest" className={s.entry}>
        <Icon name="chart" size={18} strokeWidth={2} />
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
  const { pathname } = useLocation()
  const { saved } = useWorkspace()
  const home = pathname === '/'
  return (
    <nav className={s.nav} aria-label="Разделы">
      <Link to="/" className={s.navLogo} aria-label="Альфа-Бизнес, главная">
        <AlfaLogo />
      </Link>
      <div className={s.navGroup}>
        <span className={s.navCaption}>Интернет-банк</span>
        <div className={s.navList}>
          <Link
            to="/"
            className={cx(s.navItem, home && s.navItemActive)}
            aria-current={home ? 'page' : undefined}
          >
            Главная
          </Link>
        </div>
      </div>
      <div className={s.navGroup}>
        <span className={s.navCaption}>Альфа Будущее</span>
        <div className={s.navList}>
          {analyticsNav.map((e) => (
            <Link
              key={e.to}
              to={e.to}
              className={cx(s.navItem, isActive(e) && s.navItemActive)}
              aria-current={isActive(e) ? 'page' : undefined}
            >
              {e.label}
              {e.to === '/saved' && saved.length > 0 && (
                <span className={s.count}>{saved.length}</span>
              )}
            </Link>
          ))}
        </div>
      </div>
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

/**
 * Новая страница открывается сверху, а не на прокрутке предыдущей. Ссылки с якорем
 * (например «Первоисточники →» на #sources) прокручивает сама страница.
 */
function useScrollToTop() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (!hash) window.scrollTo(0, 0)
  }, [pathname, hash])
}

export default function AppLayout() {
  useCompanyGuard()
  useScrollToTop()
  return (
    <>
      <div className={s.workspace}>
        <Sidebar />
        <Rail />
        <div className={s.main}>
          <Header />
          <main className={s.content}>
            <Page />
            <Footer />
          </main>
        </div>
      </div>
      <TabBar />
    </>
  )
}

/** Страница плавно появляется при каждом переходе — key пересоздаёт обёртку */
function Page() {
  const { pathname } = useLocation()
  return (
    <div key={pathname} className={s.page}>
      <Outlet />
    </div>
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

/** Мобильный: компания переезжает из шапки в карточку под заголовком */
function MobileContext() {
  const { companyId } = useWorkspace()
  const { data: company } = useCompany(companyId)
  return (
    <div className={s.mobileContext}>
      <CompanySwitcher />
      {company && (
        <span className="t-12 c-muted">
          {[company.id, formatDecimal(company.annual_revenue), place(company)]
            .filter(Boolean)
            .join(' · ')}
        </span>
      )}
    </div>
  )
}

/** Хлебные крошки и заголовок страницы */
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
  /** Правый элемент строки контекста */
  tag?: ReactNode
  /** Строка меток / действий под заголовком */
  children?: ReactNode
}) {
  const crumbs = ['Альфа-Бизнес', section, crumb].filter(Boolean).join('  /  ')
  const workspacePage = tag === undefined
  return (
    <>
      <div className={s.context}>
        <p className={s.crumbs}>{crumbs}</p>
        {tag}
      </div>
      <div className={s.title}>
        <h1 className={s.titleText}>{title}</h1>
        {subtitle && <p className={s.subtitle}>{subtitle}</p>}
      </div>
      {workspacePage && <MobileContext />}
      {children && <div className={s.headExtra}>{children}</div>}
    </>
  )
}
