import { supabase } from '@/lib/supabase'
import type { Product, ProductCost } from '@/types/models'

export interface ProductInput {
  name: string
  category: string | null
  unit: string
  unit_price: number
  pack_unit: string | null
  pack_size: number | null
  pack_price: number | null
  min_stock: number
}

/** null = modal dikosongkan (barang tanpa modal) */
export type CostInput = { cost_price: number; cost_pack: number | null } | null

export const productsApi = {
  async list(): Promise<Product[]> {
    const { data, error } = await supabase.from('products').select('*').order('name')
    if (error) throw error
    return (data ?? []) as Product[]
  },

  /** Hanya owner yang bisa membaca (kasir akan mendapat daftar kosong). */
  async listCosts(): Promise<ProductCost[]> {
    const { data, error } = await supabase
      .from('product_costs')
      .select('product_id, cost_price, cost_pack')
    if (error) throw error
    return ((data ?? []) as ProductCost[]).map((c) => ({
      product_id: c.product_id,
      cost_price: Number(c.cost_price),
      cost_pack: c.cost_pack === null ? null : Number(c.cost_pack),
    }))
  },

  async saveCost(productId: string, cost: CostInput): Promise<void> {
    if (cost === null) {
      const { error } = await supabase.from('product_costs').delete().eq('product_id', productId)
      if (error) throw error
      return
    }
    const { error } = await supabase
      .from('product_costs')
      .upsert({ product_id: productId, ...cost }, { onConflict: 'product_id' })
    if (error) throw error
  },

  /** Membuat barang baru. Kalau initialStock > 0, langsung dicatat sebagai stok awal. */
  async create(input: ProductInput, initialStock: number, cost: CostInput): Promise<void> {
    const { data, error } = await supabase.from('products').insert(input).select('id').single()
    if (error) throw error
    if (initialStock > 0) {
      const { error: moveError } = await supabase
        .from('stock_movements')
        .insert({ product_id: data.id, type: 'in', qty: initialStock, note: 'stok awal' })
      if (moveError) throw moveError
    }
    if (cost !== null) await productsApi.saveCost(data.id, cost)
  },

  async update(id: string, input: ProductInput, cost: CostInput): Promise<void> {
    const { error } = await supabase.from('products').update(input).eq('id', id)
    if (error) throw error
    await productsApi.saveCost(id, cost)
  },

  async setActive(id: string, isActive: boolean): Promise<void> {
    const { error } = await supabase.from('products').update({ is_active: isActive }).eq('id', id)
    if (error) throw error
  },
}
