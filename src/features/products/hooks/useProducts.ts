import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { qk } from '@/lib/queryKeys'

import { type CostInput, type ProductInput, productsApi } from '../api/productsApi'

export function useProducts() {
  return useQuery({ queryKey: qk.products, queryFn: productsApi.list })
}

/** Modal semua barang. Hanya dipanggil dari halaman owner. */
export function useProductCosts() {
  return useQuery({ queryKey: qk.productCosts, queryFn: productsApi.listCosts })
}

function useRefresh() {
  const queryClient = useQueryClient()
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: qk.products }),
      queryClient.invalidateQueries({ queryKey: qk.productCosts }),
      queryClient.invalidateQueries({ queryKey: qk.stock }),
    ])
}

export function useSaveProduct() {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: (v: { id?: string; input: ProductInput; initialStock: number; cost: CostInput }) =>
      v.id
        ? productsApi.update(v.id, v.input, v.cost)
        : productsApi.create(v.input, v.initialStock, v.cost),
    onSuccess: refresh,
  })
}

export function useToggleProduct() {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: (v: { id: string; isActive: boolean }) => productsApi.setActive(v.id, v.isActive),
    onSuccess: refresh,
  })
}
