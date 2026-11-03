import { Search, ShoppingCart, Store } from 'lucide-react'
import { useMemo, useState } from 'react'

import { Chip } from '@/components/shared/Chip'
import { Field } from '@/components/shared/Field'
import { Modal } from '@/components/shared/Modal'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState, ErrorState, Loading } from '@/components/shared/States'
import { useProducts } from '@/features/products/hooks/useProducts'
import { useStock } from '@/features/stock/hooks/useStock'
import { formatRupiah, formatTanggal, todayWita } from '@/lib/format'

import { Cart } from '../components/Cart'
import { ProductPicker } from '../components/ProductPicker'
import { useCartStore } from '../store/cartStore'

export default function SalesPage() {
  const products = useProducts()
  const stock = useStock()
  const lines = useCartStore((s) => s.lines)

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [sheetOpen, setSheetOpen] = useState(false)

  const itemCount = lines.length
  const cartTotal = lines.reduce((sum, l) => sum + Math.round(l.price * l.quantity), 0)

  const stockMap = useMemo(
    () => new Map((stock.data ?? []).map((s) => [s.id, s.stock] as [string, number])),
    [stock.data],
  )

  const active = useMemo(() => (products.data ?? []).filter((p) => p.is_active), [products.data])

  const categories = useMemo(
    () => Array.from(new Set(active.map((p) => p.category).filter((c): c is string => !!c))),
    [active],
  )

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    return active
      .filter((p) => !category || p.category === category)
      .filter((p) => !q || p.name.toLowerCase().includes(q))
  }, [active, category, search])

  return (
    <>
      <PageHeader title="Kasir" description={formatTanggal(todayWita())} />

      {products.isPending && <Loading />}
      {products.error && <ErrorState error={products.error} onRetry={() => products.refetch()} />}

      {products.data && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <section>
            <div className="mb-4 space-y-3">
              <Field
                aria-label="Cari barang"
                placeholder="Cari barang, misal: gula"
                icon={<Search className="h-4 w-4" />}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {categories.length > 0 && (
                <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:px-0">
                  <Chip active={category === ''} onClick={() => setCategory('')}>
                    Semua
                  </Chip>
                  {categories.map((c) => (
                    <Chip key={c} active={category === c} onClick={() => setCategory(c)}>
                      {c}
                    </Chip>
                  ))}
                </div>
              )}
            </div>

            {visible.length === 0 ? (
              <EmptyState
                icon={<Store className="h-12 w-12" />}
                title={active.length === 0 ? 'Belum ada barang' : 'Barang tidak ditemukan'}
                description={
                  active.length === 0
                    ? 'Minta owner menambahkan barang dan harganya dulu.'
                    : 'Coba kata kunci lain.'
                }
              />
            ) : (
              <ProductPicker products={visible} stockMap={stockMap} />
            )}
          </section>

          <aside className="hidden lg:block">
            <Cart stockMap={stockMap} />
          </aside>
        </div>
      )}

      {/* Bar keranjang untuk HP */}
      {itemCount > 0 && (
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="fixed inset-x-4 bottom-[4.75rem] z-40 flex items-center justify-between rounded-2xl bg-emerald-600 px-5 py-3.5 text-white shadow-xl shadow-emerald-900/20 active:bg-emerald-700 lg:hidden"
        >
          <span className="flex items-center gap-2.5 font-semibold">
            <ShoppingCart className="h-5 w-5" />
            {itemCount} barang
          </span>
          <span className="font-bold tabular-nums">{formatRupiah(cartTotal)}</span>
        </button>
      )}

      <Modal open={sheetOpen} title="Keranjang" onClose={() => setSheetOpen(false)}>
        <Cart stockMap={stockMap} embedded onDone={() => setSheetOpen(false)} />
      </Modal>
    </>
  )
}
