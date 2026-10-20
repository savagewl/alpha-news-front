import { BrandKey, Button, Field, Panel, Tag } from '../components/ui'
import { PageHead } from '../layout/AppLayout'
import { digestU001 } from '../mocks/data'
import s from './pages.module.css'

const filters = ['Отрасль: все ⌄', '△ Риски', '↗ Возможности', '□ Только аналитика банка']

export default function DigestPage() {
  return (
    <>
      <PageHead
        crumb="Сводка"
        title="Фокус дня: защитить инвестбюджет"
        subtitle="11 сентября 2026 · U001 · Финансовый директор · Персонализированная сводка"
      />

      <div className={s.lime} style={{ gap: 24, padding: 28 }}>
        <div className={`${s.col} ${s.grow}`} style={{ gap: 12 }}>
          <Tag>✦ AI · Условный бизнес-эффект</Tag>
          <h2 className={s.limeTitle} style={{ fontSize: 31, lineHeight: '36px' }}>
            Стоимость денег не снижается.
            <br />
            Капвложения требуют нового сценария.
          </h2>
          <p className="t-15">
            Сопоставьте инвестиционный график с обслуживанием долга. Рост затрат на медь и персонал
            может усилить давление на денежный поток — фактический эффект без контрактов не оценён.
          </p>
          <p className="t-12">
            Основание: ставка из учебного кейса [S1], кредиты [P1], ОКВЭД [P2]. Не рекомендация по
            сделке.
          </p>
        </div>
        <BrandKey to="/digest" />
      </div>

      <div className={s.row} style={{ gap: 10 }}>
        <Tag>■ Факт сценария</Tag>
        <Tag variant="green">▤ Аналитика банка</Tag>
        <Tag variant="red">✦ Вывод AI · условно</Tag>
      </div>

      <div className={s.row} style={{ gap: 24 }}>
        <div className={`${s.col} ${s.grow}`} style={{ gap: 8 }}>
          <div className={s.col} style={{ gap: 12 }}>
            <div className={s.row} style={{ gap: 8 }}>
              {filters.map((f) => (
                <Button key={f}>{f}</Button>
              ))}
            </div>
            <div className={s.row} style={{ justifyContent: 'space-between' }}>
              <p className="t-12 c-muted">По релевантности ↓</p>
              <Button>Подгрузить новую новость</Button>
            </div>
          </div>

          {digestU001.map((e) => (
            <article key={e.rank} className={s.event}>
              <div className={s.row} style={{ justifyContent: 'space-between' }}>
                {e.kind === 'risk' ? (
                  <Tag variant="red">{e.rank} / Риск</Tag>
                ) : (
                  <Tag variant="green">{e.rank} / Возможность</Tag>
                )}
                <span className={s.save}>☆ Сохранить</span>
              </div>
              <h3 className="t-h3">{e.title}</h3>
              <p className="t-15">{e.text}</p>
              <p className="t-12 c-green">{e.relevance}</p>
              <p className="t-11 c-muted" style={{ whiteSpace: 'pre-wrap' }}>
                {e.meta}
              </p>
            </article>
          ))}

          <Button>Показать сохранённое · 3</Button>
        </div>

        <div className={`${s.col} ${s.side300}`} style={{ gap: 20 }}>
          <Panel>
            <h2 className="t-h2">Почему именно вам</h2>
            <Tag variant="red">U001 / CFO</Tag>
            <Field label="Компания" value="Вектор Машиностроение" />
            <Field label="Выручка / регион" value="42,8 млрд ₽ / Екатеринбург" />
            <Field label="Ключевые признаки" value="Кредиты · Лизинг · Импорт Китай / Турция" />
            <Button to="/profile">Профиль и доказательства →</Button>
          </Panel>
          <Panel green>
            <h2 className="t-h2">Задачи роли</h2>
            <p className="t-13">1. Обслуживание долга</p>
            <p className="t-13">2. Инвестиционный бюджет</p>
            <p className="t-13">3. Себестоимость и оборотный капитал</p>
          </Panel>
          <Panel>
            <h2 className="t-h2">Что не подтверждено</h2>
            <p className="t-13">
              Нет ставок договоров, графика выплат и структуры сырьевых закупок. Точные потери не
              рассчитываем.
            </p>
            <p className="t-12 c-muted">
              Аналитика банка: доступны заголовки, полные тексты не предоставлены.
            </p>
          </Panel>
        </div>
      </div>
    </>
  )
}
