import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { qk } from '@/lib/queryKeys'

import { historyApi } from '../api/historyApi'

export function useHistory(date: string) {
  return useQuery({ queryKey: qk.history(date), queryFn: () => historyApi.listByDate(date) })
}

export function useVoidSale() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => historyApi.voidSale(id),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['history'] }),
        queryClient.invalidateQueries({ queryKey: ['stock'] }),
        queryClient.invalidateQueries({ queryKey: ['report-daily'] }),
        queryClient.invalidateQueries({ queryKey: ['report-products'] }),
      ]),
  })
}
