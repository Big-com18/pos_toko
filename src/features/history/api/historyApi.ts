import { dayRange } from '@/lib/format'
import { supabase } from '@/lib/supabase'
import type { Sale } from '@/types/models'

export const historyApi = {
  async listByDate(date: string): Promise<Sale[]> {
    const { start, end } = dayRange(date)
    const { data, error } = await supabase
      .from('sales')
      .select(
        'id, sold_at, total, note, voided_at, created_by, profiles!created_by(full_name), sale_items(id, quantity, unit_label, price, subtotal, products(name))',
      )
      .gte('sold_at', start)
      .lt('sold_at', end)
      .order('sold_at', { ascending: false })
    if (error) throw error
    return (data ?? []) as unknown as Sale[]
  },

  async voidSale(id: string): Promise<void> {
    const { error } = await supabase.rpc('void_sale', { p_sale_id: id })
    if (error) throw error
  },
}
