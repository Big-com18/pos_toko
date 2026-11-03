import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { SaleItemInput } from '@/types/models'

import { salesApi } from '../api/salesApi'

export function useCreateSale() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (v: { items: SaleItemInput[]; note: string | null }) =>
      salesApi.create(v.items, v.note),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['stock'] }),
        queryClient.invalidateQueries({ queryKey: ['history'] }),
        queryClient.invalidateQueries({ queryKey: ['report-daily'] }),
        queryClient.invalidateQueries({ queryKey: ['report-products'] }),
      ]),
  })
}
