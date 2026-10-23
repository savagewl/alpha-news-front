// Контракт разделов Companies и CSV imports бэкенда (OpenAPI: /docs).
// Денежные значения приходят десятичными строками, неизвестные атрибуты — null.

export interface Page<T> {
  items: T[]
  /** Число записей по фильтрам до пагинации */
  total: number
  limit: number
  offset: number
}

export interface CompanyListItem {
  /** SYNTHETIC_U из CSV или ID из POST /companies; ведущие нули сохраняются */
  id: string
  /** Задаётся только при создании, в CSV названия нет */
  name: string | null
  group_id: string | null
  okved_code: string | null
  okved_name: string | null
  city: string | null
  region: string | null
  annual_revenue: string | null
  /** Компания известна только по связи или платежу, CSV ещё не загружен */
  is_placeholder: boolean
}

export interface Company extends CompanyListItem {
  org_type: string | null
  ownership_form: string | null
  age_category: string | null
  development_stage: string | null
  key_owner_flag: boolean | null
  employees_fns_category: string | null
  employees_spark_category: string | null
  client_type: string | null
  has_rko: boolean | null
  has_guarantees: boolean | null
  has_credit: boolean | null
  has_leasing: boolean | null
  has_deposit: boolean | null
  has_payroll: boolean | null
  has_fts_data: boolean | null
  fts_country_name: string | null
  has_factoring: boolean | null
  source_data: Record<string, unknown> | null
  last_import_id: string | null
  updated_at: string
}

export interface CompaniesQuery {
  limit?: number
  offset?: number
  /** Подстрока ID, названия, ОКВЭД или города */
  q?: string
}

export interface CreateCompanyInput {
  id?: string | null
  name: string
}

export interface CompanyPerson {
  /** Обезличенный SYNTHETIC_F */
  person_id: string
  city: string | null
  region: string | null
  person_import_id: string
  link_import_id: string
}

export type PaymentDirection = 'all' | 'incoming' | 'outgoing'

/** Агрегат PAY_AMT / PAY_CNT из строки файла, а не отдельная транзакция */
export interface CompanyPayment {
  id: number
  payer_company_id: string
  beneficiary_company_id: string
  payment_amount: string
  payment_count: number
  import_id: string
  source_row_number: number
}

export interface PaymentPage extends Page<CompanyPayment> {
  direction: PaymentDirection
  import_id: string | null
}

export interface PaymentImport {
  import_id: string
  filename: string
  created_at: string
  /** Строк во всём файле */
  row_count: number
  /** Строк файла с участием компании */
  company_payment_rows: number
}

export interface CompanyUser {
  user_id: string
  full_name: string | null
  joined_at: string
}

export interface CompanyMembership {
  company_id: string
  user_id: string
  added_by_user_id: string | null
  created_at: string
}

export type ImportKind = 'companies' | 'persons' | 'payments'
export type CsvEncoding = 'utf-8-sig' | 'cp1251'
/** null — бэк определит разделитель сам */
export type CsvDelimiter = ',' | ';' | '\t' | null

export interface ImportInput {
  kind: ImportKind
  file: File
  encoding: CsvEncoding
  delimiter: CsvDelimiter
}

export interface ImportResult {
  import_id: string
  kind: ImportKind
  filename: string
  row_count: number
  encoding: CsvEncoding
  delimiter: string
  /** Тот же файл уже загружался — данные не продублированы */
  reused: boolean
  counts: {
    companies: number
    persons: number
    links: number
    payments: number
    placeholder_companies: number
  }
}
