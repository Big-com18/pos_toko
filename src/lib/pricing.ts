import type { Product } from '@/types/models'

/** Harga per satuan besar. Kalau owner tidak mengisi, dihitung dari harga eceran x isi. */
export function packPrice(p: Product): number | null {
  if (!p.pack_unit || !p.pack_size) return null
  return p.pack_price ?? p.unit_price * p.pack_size
}
