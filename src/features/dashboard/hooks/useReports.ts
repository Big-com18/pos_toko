import { useQuery } from '@tanstack/react-query'

import { qk } from '@/lib/queryKeys'

import { reportApi } from '../api/reportApi'

export function useDailyReport(from: string, to: string) {
  return useQuery({ queryKey: qk.reportDaily(from, to), queryFn: () => reportApi.daily(from, to) })
}

export function useProductReport(from: string, to: string) {
  return useQuery({
    queryKey: qk.reportProducts(from, to),
    queryFn: () => reportApi.products(from, to),
  })
}
