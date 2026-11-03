import { type FormEvent, useState } from 'react'

import { Button } from '@/components/shared/Button'
import { Field } from '@/components/shared/Field'
import { Modal } from '@/components/shared/Modal'
import { useToast } from '@/components/shared/toastContext'
import { toMessage } from '@/lib/errors'
import { formatNumber, parseNumber } from '@/lib/format'
import type { StockRow } from '@/types/models'

import { useAdjustStock } from '../hooks/useStock'

export function AdjustDialog({ row, onClose }: { row: StockRow; onClose: () => void }) {
  const [actual, setActual] = useState(String(row.stock))
  const [note, setNote] = useState('Stok opname')
  const [error, setError] = useState<string>()
  const adjust = useAdjustStock()
  const { notify } = useToast()

  const actualNum = parseNumber(actual)
  const delta = actual.trim() && Number.isFinite(actualNum) ? actualNum - row.stock : NaN

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!Number.isFinite(actualNum) || actualNum < 0 || !actual.trim()) {
      setError('Isi stok fisik 0 atau lebih')
      return
    }
    if (delta === 0) {
      setError('Stok fisik sama dengan stok sistem, tidak perlu koreksi')
      return
    }
    try {
      await adjust.mutateAsync({ productId: row.id, delta, note: note.trim() || null })
      notify(`Stok ${row.name} dikoreksi`)
      onClose()
    } catch (err) {
      notify(toMessage(err), 'error')
    }
  }

  return (
    <Modal open title={`Koreksi stok: ${row.name}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <p className="text-sm text-slate-600">
          Stok di sistem:{' '}
          <strong>
            {formatNumber(row.stock)} {row.unit}
          </strong>
        </p>
        <Field
          label={`Stok fisik sebenarnya (${row.unit})`}
          inputMode="decimal"
          autoFocus
          value={actual}
          onChange={(e) => {
            setActual(e.target.value)
            setError(undefined)
          }}
          error={error}
        />
        {Number.isFinite(delta) && delta !== 0 && (
          <p className="text-sm text-slate-600">
            Selisih:{' '}
            <strong>
              {delta > 0 ? '+' : ''}
              {formatNumber(delta)} {row.unit}
            </strong>
          </p>
        )}
        <Field label="Catatan" value={note} onChange={(e) => setNote(e.target.value)} />
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" disabled={adjust.isPending}>
            Simpan koreksi
          </Button>
        </div>
      </form>
    </Modal>
  )
}
