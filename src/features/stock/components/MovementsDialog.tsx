import { Modal } from '@/components/shared/Modal'
import { ErrorState, Loading } from '@/components/shared/States'
import { formatNumber, formatWaktu } from '@/lib/format'
import type { MovementType, StockRow } from '@/types/models'

import { useMovements } from '../hooks/useStock'

const labels: Record<MovementType, string> = { in: 'Masuk', out: 'Keluar', adjust: 'Koreksi' }

export function MovementsDialog({ row, onClose }: { row: StockRow; onClose: () => void }) {
  const { data, isPending, error } = useMovements(row.id)

  return (
    <Modal open title={`Riwayat stok: ${row.name}`} onClose={onClose}>
      {isPending && <Loading />}
      {error && <ErrorState error={error} />}
      {data && data.length === 0 && (
        <p className="text-sm text-slate-500">Belum ada pergerakan stok.</p>
      )}
      <ul className="divide-y divide-slate-100">
        {data?.map((m) => {
          const signed = m.type === 'out' ? -m.qty : m.qty
          return (
            <li key={m.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
              <div className="min-w-0">
                <div className="font-medium">{labels[m.type]}</div>
                <div className="truncate text-xs text-slate-500">
                  {formatWaktu(m.created_at)}
                  {m.note ? ` · ${m.note}` : ''}
                </div>
              </div>
              <span
                className={`shrink-0 font-semibold tabular-nums ${
                  signed < 0 ? 'text-rose-600' : 'text-emerald-600'
                }`}
              >
                {signed > 0 ? '+' : ''}
                {formatNumber(signed)} {row.unit}
              </span>
            </li>
          )
        })}
      </ul>
    </Modal>
  )
}
