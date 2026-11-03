import { supabase } from '@/lib/supabase'
import type { SaleItemInput } from '@/types/models'

export const salesApi = {
  /** Memanggil fungsi database create_sale (atomik, harga diambil dari database). */
  async create(items: SaleItemInput[], note: string | null): Promise<string> {
    const { data, error } = await supabase.rpc('create_sale', { p_note: note, p_items: items })
    if (error) throw error
    return data as string
  },
}
