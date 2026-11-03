import { Package, Plus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'

import { Button } from '@/components/shared/Button'
import { Chip } from '@/components/shared/Chip'
import { Field } from '@/components/shared/Field'
import { Modal } from '@/components/shared/Modal'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState, ErrorState, Loading } from '@/components/shared/States'
import { useToast } from '@/components/shared/toastContext'
import type { CostInput, ProductInput } from '@/features/products/api/productsApi'
import { ProductForm } from '@/features/products/components/ProductForm'
import {
  useProductCosts,
  useProducts,
  useSaveProduct,
  useToggleProduct,
} from '@/features/products/hooks/useProducts'
import { AdjustDialog } from '@/features/stock/components/AdjustDialog'
import { MovementsDialog } from '@/features/stock/components/MovementsDialog'
import { RestockDialog } from '@/features/stock/components/RestockDialog'
import { useStock } from '@/features/stock/hooks/useStock'
import { toMessage } from '@/lib/errors'
import type { Product, ProductCost, StockRow } from '@/types/models'

import { InventoryItem } from '../components/InventoryItem'

type Filter = 'all' | 'low' | 'empty' | 'inactive'

export default function InventoryPage() {
  const products = useProducts()
  const stock = useStock()
  const costs = useProductCosts()
  const saveProduct = useSaveProduct()
  const toggleProduct = useToggleProduct()
  const { notify } = useToast()

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [editing, setEditing] = useState<Product | 'new' | null>(null)
  const [restockRow, setRestockRow] = useState<StockRow | null>(null)
  const [adjustRow, setAdjustRow] = useState<StockRow | null>(null)
  const [historyRow, setHistoryRow] = useState<StockRow | null>(null)

  const stockMap = useMemo(
    () => new Map((stock.data ?? []).map((s) => [s.id, s] as [string, StockRow])),
    [stock.data],
  )

  const costMap = useMemo(
    () => new Map((costs.data ?? []).map((c) => [c.product_id, c] as [string, ProductCost])),
    [costs.data],
  )

  const counts = useMemo(() => {
    const all = products.data ?? []
    const active = all.filter((p) => p.is_active)
    return {
      all: active.length,
      low: active.filter((p) => {
        const s = stockMap.get(p.id)
        return !!s && s.stock > 0 && s.is_low
      }).length,
      empty: active.filter((p) => {
        const s = stockMap.get(p.id)
        return !!s && s.stock <= 0
      }).length,
      inactive: all.length - active.length,
    }
  }, [products.data, stockMap])

  const list = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (products.data ?? [])
      .filter((p) => {
        const s = stockMap.get(p.id)
        if (filter === 'inactive') return !p.is_active
        if (!p.is_active) return false
        if (filter === 'low') return !!s && s.stock > 0 && s.is_low
        if (filter === 'empty') return !!s && s.stock <= 0
        return true
      })
      .filter(
        (p) => !q || p.name.toLowerCase().includes(q) || (p.category ?? '').toLowerCase().includes(q),
      )
  }, [products.data, stockMap, filter, search])

  async function handleSave(input: ProductInput, initialStock: number, cost: CostInput) {
    try {
      await saveProduct.mutateAsync({
        id: editing && editing !== 'new' ? editing.id : undefined,
        input,
        initialStock,
        cost,
      })
      notify(editing === 'new' ? 'Barang ditambahkan' : 'Barang diperbarui')
      setEditing(null)
    } catch (e) {
      notify(toMessage(e), 'error')
    }
  }

  async function handleToggle(p: Product, isActive: boolean) {
    try {
      await toggleProduct.mutateAsync({ id: p.id, isActive })
      notify(isActive ? 'Barang diaktifkan' : 'Barang dinonaktifkan')
    } catch (e) {
      notify(toMessage(e), 'error')
    }
  }

  const loading = products.isPending || stock.isPending
  const error = products.error ?? stock.error

  return (
    <>
      <PageHeader
        title="Barang & Stok"
        description="Atur barang, harga, dan sisa stok di satu tempat. Karyawan hanya bisa menjual barang yang aktif di sini."
        actions={
          <Button onClick={() => setEditing('new')}>
            <Plus className="h-4 w-4" />
            Tambah barang
          </Button>
        }
      />

      <div className="mb-6 space-y-3">
        <Field
          aria-label="Cari barang"
          placeholder="Cari nama atau kategori"
          icon={<Search className="h-4 w-4" />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-sm"
        />
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:px-0">
          <Chip active={filter === 'all'} onClick={() => setFilter('all')}>
            Semua ({counts.all})
          </Chip>
          <Chip active={filter === 'low'} onClick={() => setFilter('low')}>
            Hampir habis ({counts.low})
          </Chip>
          <Chip active={filter === 'empty'} onClick={() => setFilter('empty')}>
            Habis ({counts.empty})
          </Chip>
          <Chip active={filter === 'inactive'} onClick={() => setFilter('inactive')}>
            Nonaktif ({counts.inactive})
          </Chip>
        </div>
      </div>

      {loading && <Loading />}
      {error && (
        <ErrorState
          error={error}
          onRetry={() => {
            void products.refetch()
            void stock.refetch()
          }}
        />
      )}

      {!loading && !error && list.length === 0 && (
        <EmptyState
          icon={<Package className="h-12 w-12" />}
          title={(products.data ?? []).length === 0 ? 'Belum ada barang' : 'Tidak ada barang di sini'}
          description={
            (products.data ?? []).length === 0
              ? 'Mulai dengan menambahkan barang pertama beserta harganya.'
              : 'Coba kata kunci lain atau ganti filter.'
          }
          action={
            (products.data ?? []).length === 0 ? (
              <Button onClick={() => setEditing('new')}>
                <Plus className="h-4 w-4" />
                Tambah barang
              </Button>
            ) : undefined
          }
        />
      )}

      <ul className="grid gap-4 lg:grid-cols-2">
        {list.map((p) => (
          <li key={p.id}>
            <InventoryItem
              product={p}
              stock={stockMap.get(p.id)}
              cost={costMap.get(p.id)}
              onEdit={setEditing}
              onToggle={handleToggle}
              onRestock={setRestockRow}
              onAdjust={setAdjustRow}
              onHistory={setHistoryRow}
            />
          </li>
        ))}
      </ul>

      <Modal
        open={editing !== null}
        title={editing === 'new' ? 'Tambah barang' : 'Ubah barang'}
        onClose={() => setEditing(null)}
      >
        {editing !== null && (
          <ProductForm
            initial={editing === 'new' ? undefined : editing}
            initialCost={editing === 'new' ? undefined : costMap.get(editing.id)}
            submitting={saveProduct.isPending}
            onSubmit={handleSave}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>

      {restockRow && <RestockDialog row={restockRow} onClose={() => setRestockRow(null)} />}
      {adjustRow && <AdjustDialog row={adjustRow} onClose={() => setAdjustRow(null)} />}
      {historyRow && <MovementsDialog row={historyRow} onClose={() => setHistoryRow(null)} />}
    </>
  )
}
