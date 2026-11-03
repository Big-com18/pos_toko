import { create } from 'zustand'

import type { UnitType } from '@/types/models'

export interface CartLine {
  key: string
  productId: string
  productName: string
  unitType: UnitType
  unitLabel: string
  price: number
  /** berapa satuan eceran dalam 1 satuan jual (1 untuk eceran, isi pak untuk pak) */
  multiplier: number
  baseUnit: string
  quantity: number
}

export type NewCartLine = Omit<CartLine, 'key' | 'quantity'>

interface CartState {
  lines: CartLine[]
  add: (line: NewCartLine) => void
  setQuantity: (key: string, quantity: number) => void
  clear: () => void
}

export const useCartStore = create<CartState>((set) => ({
  lines: [],

  add: (line) =>
    set((state) => {
      const key = `${line.productId}:${line.unitType}`
      const exists = state.lines.some((l) => l.key === key)
      if (exists) {
        return {
          lines: state.lines.map((l) => (l.key === key ? { ...l, quantity: l.quantity + 1 } : l)),
        }
      }
      return { lines: [...state.lines, { ...line, key, quantity: 1 }] }
    }),

  setQuantity: (key, quantity) =>
    set((state) => ({
      lines:
        quantity <= 0
          ? state.lines.filter((l) => l.key !== key)
          : state.lines.map((l) => (l.key === key ? { ...l, quantity } : l)),
    })),

  clear: () => set({ lines: [] }),
}))
