import { supabase } from '@/lib/supabase'
import type { DailyReportRow, ProductReportRow } from '@/types/models'

export const reportApi = {
  async daily(from: string, to: string): Promise<DailyReportRow[]> {
    const { data, error } = await supabase.rpc('report_daily', { p_from: from, p_to: to })
    if (error) throw error
    return ((data ?? []) as DailyReportRow[]).map((r) => ({
      report_day: r.report_day,
      total_revenue: Number(r.total_revenue),
      trx_count: Number(r.trx_count),
      total_profit: Number(r.total_profit ?? 0),
      uncosted_revenue: Number(r.uncosted_revenue ?? 0),
    }))
  },

  async products(from: string, to: string): Promise<ProductReportRow[]> {
    const { data, error } = await supabase.rpc('report_products', { p_from: from, p_to: to })
    if (error) throw error
    return ((data ?? []) as ProductReportRow[]).map((r) => ({
      product_id: r.product_id,
      product_name: r.product_name,
      qty_base: Number(r.qty_base),
      revenue: Number(r.revenue),
      profit: r.profit === null || r.profit === undefined ? null : Number(r.profit),
    }))
  },
}
