import { z } from 'zod'

import { parseNumber } from '@/lib/format'

const nonNegative = (message: string) =>
  z
    .string()
    .trim()
    .min(1, message)
    .refine((v) => Number.isFinite(parseNumber(v)) && parseNumber(v) >= 0, message)

export const productSchema = z
  .object({
    name: z.string().trim().min(1, 'Nama barang wajib diisi'),
    category: z.string().trim(),
    unit: z.string().trim().min(1, 'Satuan wajib diisi'),
    unit_price: nonNegative('Isi harga 0 atau lebih'),
    has_pack: z.boolean(),
    pack_unit: z.string().trim(),
    pack_size: z.string().trim(),
    pack_price: z.string().trim(),
    min_stock: nonNegative('Isi angka 0 atau lebih'),
    initial_stock: z.string().trim(),
    cost: z.string().trim(),
    cost_qty: z.string().trim(),
  })
  .superRefine((v, ctx) => {
    if (v.has_pack) {
      if (!v.pack_unit) {
        ctx.addIssue({ code: 'custom', path: ['pack_unit'], message: 'Isi satuan besar, misal pak' })
      }
      const size = parseNumber(v.pack_size)
      if (!v.pack_size || !Number.isFinite(size) || size <= 0) {
        ctx.addIssue({ code: 'custom', path: ['pack_size'], message: 'Isi harus lebih dari 0' })
      }
      const price = parseNumber(v.pack_price)
      if (!v.pack_price || !Number.isFinite(price) || price < 0) {
        ctx.addIssue({ code: 'custom', path: ['pack_price'], message: 'Isi harga satuan besar' })
      }
    }
    if (v.cost) {
      const c = parseNumber(v.cost)
      if (!Number.isFinite(c) || c < 0) {
        ctx.addIssue({ code: 'custom', path: ['cost'], message: 'Isi angka 0 atau lebih' })
      }
    }
    if (v.cost && v.cost_qty) {
      const q = parseNumber(v.cost_qty)
      if (!Number.isFinite(q) || q <= 0) {
        ctx.addIssue({ code: 'custom', path: ['cost_qty'], message: 'Isi jumlah lebih dari 0' })
      }
    }
    if (v.initial_stock) {
      const n = parseNumber(v.initial_stock)
      if (!Number.isFinite(n) || n < 0) {
        ctx.addIssue({ code: 'custom', path: ['initial_stock'], message: 'Isi angka 0 atau lebih' })
      }
    }
  })

export type ProductFormValues = z.infer<typeof productSchema>
