import { supabase } from '@/lib/supabase'
import type { StockMovement, StockRow } from '@/types/models'

export const stockApi = {
  /** Stok saat ini (dari view v_stock), hanya barang aktif. */
  async list(): Promise<StockRow[]> {
    const { data, error } = await supabase
      .from('v_stock')
      .select('*')
      .eq('is_active', true)
      .order('name')
    if (error) throw error
    return (data ?? []) as StockRow[]
  },

  async movements(productId: string): Promise<StockMovement[]> {
    const { data, error } = await supabase
      .from('stock_movements')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false })
      .limit(50)
    if (error) throw error
    return (data ?? []) as StockMovement[]
  },

  /** qty dalam satuan eceran */
  async restock(productId: string, qty: number, note: string | null): Promise<void> {
    const { error } = await supabase
      .from('stock_movements')
      .insert({ product_id: productId, type: 'in', qty, note })
    if (error) throw error
  },

  /** delta boleh positif atau negatif (selisih stok fisik dengan stok sistem). */
  async adjust(productId: string, delta: number, note: string | null): Promise<void> {
    const { error } = await supabase
      .from('stock_movements')
      .insert({ product_id: productId, type: 'adjust', qty: delta, note })
    if (error) throw error
  },
}
