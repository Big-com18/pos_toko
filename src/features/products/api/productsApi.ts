import { supabase } from '@/lib/supabase'
import type { Product } from '@/types/models'

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

export const productsApi = {
  async list(): Promise<Product[]> {
    const { data, error } = await supabase.from('products').select('*').order('name')
    if (error) throw error
    return (data ?? []) as Product[]
  },

  /** Membuat barang baru. Kalau initialStock > 0, langsung dicatat sebagai stok awal. */
  async create(input: ProductInput, initialStock: number): Promise<void> {
    const { data, error } = await supabase.from('products').insert(input).select('id').single()
    if (error) throw error
    if (initialStock > 0) {
      const { error: moveError } = await supabase
        .from('stock_movements')
        .insert({ product_id: data.id, type: 'in', qty: initialStock, note: 'stok awal' })
      if (moveError) throw moveError
    }
  },

  async update(id: string, input: ProductInput): Promise<void> {
    const { error } = await supabase.from('products').update(input).eq('id', id)
    if (error) throw error
  },

  async setActive(id: string, isActive: boolean): Promise<void> {
    const { error } = await supabase.from('products').update({ is_active: isActive }).eq('id', id)
    if (error) throw error
  },
}
