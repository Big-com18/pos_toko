export type Role = 'owner' | 'kasir'

export interface Profile {
  id: string
  full_name: string | null
  email: string | null
  role: Role
  is_active: boolean
  created_at: string
}

export interface Product {
  id: string
  name: string
  category: string | null
  unit: string
  unit_price: number
  pack_unit: string | null
  pack_size: number | null
  pack_price: number | null
  min_stock: number
  is_active: boolean
  created_at: string
}

export interface StockRow {
  id: string
  name: string
  category: string | null
  unit: string
  pack_unit: string | null
  pack_size: number | null
  min_stock: number
  is_active: boolean
  stock: number
  is_low: boolean
}

export type MovementType = 'in' | 'out' | 'adjust'

export interface StockMovement {
  id: string
  product_id: string
  type: MovementType
  qty: number
  note: string | null
  sale_id: string | null
  created_at: string
}

export type UnitType = 'unit' | 'pack'

export interface SaleItemInput {
  product_id: string
  unit_type: UnitType
  quantity: number
}

export interface SaleItem {
  id: string
  quantity: number
  unit_label: string
  price: number
  subtotal: number
  products: { name: string } | null
}

export interface Sale {
  id: string
  sold_at: string
  total: number
  note: string | null
  voided_at: string | null
  created_by: string | null
  profiles: { full_name: string | null } | null
  sale_items: SaleItem[]
}

export interface DailyReportRow {
  report_day: string
  total_revenue: number
  trx_count: number
  /** keuntungan dari barang yang modalnya sudah diisi */
  total_profit: number
  /** pendapatan dari barang yang modalnya belum diisi */
  uncosted_revenue: number
}

export interface ProductReportRow {
  product_id: string
  product_name: string
  qty_base: number
  revenue: number
  /** null = modal barang ini belum pernah diisi */
  profit: number | null
}

export interface ProductCost {
  product_id: string
  /** modal per satuan eceran */
  cost_price: number
  /** modal per satuan besar (sesuai yang diketik owner) */
  cost_pack: number | null
}

export interface SignupCode {
  role: Role
  code: string
}
