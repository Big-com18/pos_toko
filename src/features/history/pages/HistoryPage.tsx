import { Receipt } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/shared/Button'
import { DateNav } from '@/components/shared/DateNav'
import { Modal } from '@/components/shared/Modal'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState, ErrorState, Loading } from '@/components/shared/States'
import { useToast } from '@/components/shared/toastContext'
import { useProfile } from '@/features/auth/hooks/useAuth'
import { toMessage } from '@/lib/errors'
import { formatJam, formatRupiah, todayWita } from '@/lib/format'
import type { Sale } from '@/types/models'

import { SaleCard } from '../components/SaleCard'
import { useHistory, useVoidSale } from '../hooks/useHistory'

export default function HistoryPage() {
  const [date, setDate] = useState(todayWita())
  const { data, isPending, error, refetch } = useHistory(date)
  const profile = useProfile()
  const voidSale = useVoidSale()
  const { notify } = useToast()
  const [voiding, setVoiding] = useState<Sale | null>(null)

  const isOwner = profile.data?.role === 'owner'
  const valid = (data ?? []).filter((s) => !s.voided_at)
  const total = valid.reduce((sum, s) => sum + s.total, 0)

  async function confirmVoid() {
    if (!voiding) return
    try {
      await voidSale.mutateAsync(voiding.id)
      notify('Transaksi dibatalkan, stok dikembalikan')
      setVoiding(null)
    } catch (e) {
      notify(toMessage(e), 'error')
    }
  }

  return (
    <>
      <PageHeader
        title="Riwayat"
        description={isOwner ? 'Semua transaksi toko.' : 'Transaksi yang kamu catat.'}
      />

      <div className="mb-5">
        <DateNav value={date} onChange={setDate} />
      </div>

      {isPending && <Loading />}
      {error && <ErrorState error={error} onRetry={() => refetch()} />}

      {data && (
        <>
          <p className="mb-3 text-sm font-medium text-slate-600">
            {valid.length} transaksi · total {formatRupiah(total)}
          </p>
          {data.length === 0 ? (
            <EmptyState
              icon={<Receipt className="h-12 w-12" />}
              title="Belum ada transaksi"
              description="Transaksi di tanggal ini akan muncul di sini."
            />
          ) : (
            <ul className="grid gap-3 lg:grid-cols-2">
              {data.map((s) => (
                <li key={s.id}>
                  <SaleCard sale={s} showCashier={isOwner} onVoid={isOwner ? setVoiding : undefined} />
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <Modal open={voiding !== null} title="Batalkan transaksi?" onClose={() => setVoiding(null)}>
        {voiding && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Transaksi jam {formatJam(voiding.sold_at)} senilai{' '}
              <strong>{formatRupiah(voiding.total)}</strong> akan dibatalkan dan stok barangnya
              dikembalikan. Ini tidak bisa diurungkan.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setVoiding(null)}>
                Tidak jadi
              </Button>
              <Button variant="danger" onClick={confirmVoid} disabled={voidSale.isPending}>
                Ya, batalkan
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
