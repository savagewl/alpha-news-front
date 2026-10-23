// Компании, их физлица, платёжные связи, участники и импорт CSV — запросы к бэкенду.
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './client'
import type {
  CompaniesQuery,
  Company,
  CompanyListItem,
  CompanyMembership,
  CompanyPerson,
  CompanyUser,
  CreateCompanyInput,
  ImportInput,
  ImportResult,
  Page,
  PaymentDirection,
  PaymentImport,
  PaymentPage,
} from './companyTypes'

interface PageQuery {
  limit: number
  offset: number
}

export interface PaymentsQuery extends PageQuery {
  direction: PaymentDirection
  importId: string | null
}

const path = (id: string) => `/companies/${encodeURIComponent(id)}`

export const companyApi = {
  list: (q: CompaniesQuery, signal?: AbortSignal) =>
    api.get<Page<CompanyListItem>>('/companies', { ...q }, signal),
  get: (id: string, signal?: AbortSignal) => api.get<Company>(path(id), undefined, signal),
  create: (input: CreateCompanyInput) => api.post<Company>('/companies', input),
  persons: (id: string, q: PageQuery, signal?: AbortSignal) =>
    api.get<Page<CompanyPerson>>(`${path(id)}/persons`, { ...q }, signal),
  payments: (id: string, { importId, ...q }: PaymentsQuery, signal?: AbortSignal) =>
    api.get<PaymentPage>(`${path(id)}/payments`, { ...q, import_id: importId }, signal),
  paymentImports: (id: string, q: PageQuery, signal?: AbortSignal) =>
    api.get<Page<PaymentImport>>(`${path(id)}/payment-imports`, { ...q }, signal),
  users: (id: string, q: PageQuery, signal?: AbortSignal) =>
    api.get<Page<CompanyUser>>(`${path(id)}/users`, { ...q }, signal),
  addUser: (id: string, userId: string) =>
    api.post<CompanyMembership>(`${path(id)}/users`, { user_id: userId }),
  importCsv: ({ kind, file, encoding, delimiter }: ImportInput) => {
    const form = new FormData()
    form.append('file', file)
    return api.post<ImportResult>(`/imports/${kind}`, form, { encoding, delimiter })
  },
}

export const companyKeys = {
  all: ['companies'] as const,
  list: (q: CompaniesQuery) => ['companies', 'list', q] as const,
  one: (id: string) => ['companies', id] as const,
  persons: (id: string, q: PageQuery) => ['companies', id, 'persons', q] as const,
  payments: (id: string, q: PaymentsQuery) => ['companies', id, 'payments', q] as const,
  paymentImports: (id: string) => ['companies', id, 'payment-imports'] as const,
  users: (id: string, q: PageQuery) => ['companies', id, 'users', q] as const,
}

export const useCompanies = (q: CompaniesQuery) =>
  useQuery({
    queryKey: companyKeys.list(q),
    queryFn: ({ signal }) => companyApi.list(q, signal),
    placeholderData: keepPreviousData,
  })

export const useCompany = (id: string) =>
  useQuery({
    queryKey: companyKeys.one(id),
    queryFn: ({ signal }) => companyApi.get(id, signal),
    enabled: !!id,
    retry: false,
  })

export const useCreateCompany = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: companyApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: companyKeys.all }),
  })
}

export const useCompanyPersons = (id: string, q: PageQuery) =>
  useQuery({
    queryKey: companyKeys.persons(id, q),
    queryFn: ({ signal }) => companyApi.persons(id, q, signal),
    enabled: !!id,
    placeholderData: keepPreviousData,
  })

export const useCompanyPayments = (id: string, q: PaymentsQuery) =>
  useQuery({
    queryKey: companyKeys.payments(id, q),
    queryFn: ({ signal }) => companyApi.payments(id, q, signal),
    enabled: !!id,
    placeholderData: keepPreviousData,
  })

/** Наборы платежей для выбора import_id — первых 100 хватает для селектора */
export const usePaymentImports = (id: string) =>
  useQuery({
    queryKey: companyKeys.paymentImports(id),
    queryFn: ({ signal }) => companyApi.paymentImports(id, { limit: 100, offset: 0 }, signal),
    enabled: !!id,
  })

export const useCompanyUsers = (id: string, q: PageQuery) =>
  useQuery({
    queryKey: companyKeys.users(id, q),
    queryFn: ({ signal }) => companyApi.users(id, q, signal),
    enabled: !!id,
    placeholderData: keepPreviousData,
  })

export const useAddCompanyUser = (id: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => companyApi.addUser(id, userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['companies', id, 'users'] }),
  })
}

/** Импорт меняет компании, физлиц и платежи — сбрасываем весь кэш компаний */
export const useImportCsv = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: companyApi.importCsv,
    onSuccess: () => qc.invalidateQueries({ queryKey: companyKeys.all }),
  })
}
