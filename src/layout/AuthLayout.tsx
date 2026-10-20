import { Link, Outlet } from 'react-router-dom'
import { Footer } from './AppLayout'
import s from './AppLayout.module.css'

/** Шапка интернет-банка до входа: без компании и точки входа в аналитику */
export default function AuthLayout() {
  return (
    <>
      <header className={s.header}>
        <Link to="/login" className={s.logo}>
          Альфа-Бизнес
        </Link>
        <span className={s.help}>Помощь</span>
      </header>
      <main className={s.authContent}>
        <Outlet />
        <Footer />
      </main>
    </>
  )
}
