import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { qk } from '@/lib/queryKeys'

import { stockApi } from '../api/stockApi'

export function useStock() {
  return useQuery({ queryKey: qk.stock, queryFn: stockApi.list })
}

export function useMovements(productId: string) {
  return useQuery({
    queryKey: qk.movements(productId),
    queryFn: () => stockApi.movements(productId),
  })
}

function useRefreshStock() {
  const queryClient = useQueryClient()
  return (productId: string) =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: qk.stock }),
      queryClient.invalidateQueries({ queryKey: qk.movements(productId) }),
    ])
}

export function useRestock() {
  const refresh = useRefreshStock()
  return useMutation({
    mutationFn: (v: { productId: string; qty: number; note: string | null }) =>
      stockApi.restock(v.productId, v.qty, v.note),
    onSuccess: (_d, v) => refresh(v.productId),
  })
}

export function useAdjustStock() {
  const refresh = useRefreshStock()
  return useMutation({
    mutationFn: (v: { productId: string; delta: number; note: string | null }) =>
      stockApi.adjust(v.productId, v.delta, v.note),
    onSuccess: (_d, v) => refresh(v.productId),
  })
}
