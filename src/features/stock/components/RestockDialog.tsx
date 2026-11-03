import { type FormEvent, useState } from 'react'

import { Button } from '@/components/shared/Button'
import { Chip } from '@/components/shared/Chip'
import { Field } from '@/components/shared/Field'
import { Modal } from '@/components/shared/Modal'
import { useToast } from '@/components/shared/toastContext'
import { toMessage } from '@/lib/errors'
import { formatNumber, parseNumber } from '@/lib/format'
import type { StockRow } from '@/types/models'

import { useRestock } from '../hooks/useStock'

export function RestockDialog({ row, onClose }: { row: StockRow; onClose: () => void }) {
  const hasPack = !!row.pack_unit && !!row.pack_size
  const [mode, setMode] = useState<'unit' | 'pack'>('unit')
  const [qty, setQty] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState<string>()
  const restock = useRestock()
  const { notify } = useToast()

  const multiplier = mode === 'pack' && row.pack_size ? row.pack_size : 1
  const label = mode === 'pack' && row.pack_unit ? row.pack_unit : row.unit
  const n = parseNumber(qty)
  const baseQty = Number.isFinite(n) ? n * multiplier : NaN

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!qty.trim() || !Number.isFinite(n) || n <= 0) {
      setError('Isi jumlah lebih dari 0')
      return
    }
    try {
      const autoNote = `masuk ${formatNumber(n)} ${label}`
      await restock.mutateAsync({
        productId: row.id,
        qty: baseQty,
        note: note.trim() ? `${autoNote} · ${note.trim()}` : autoNote,
      })
      notify(`Stok ${row.name} bertambah ${formatNumber(baseQty)} ${row.unit}`)
      onClose()
    } catch (err) {
      notify(toMessage(err), 'error')
    }
  }

  return (
    <Modal open title={`Barang masuk: ${row.name}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        {hasPack && (
          <div className="flex gap-2">
            <Chip active={mode === 'unit'} onClick={() => setMode('unit')}>
              Per {row.unit}
            </Chip>
            <Chip active={mode === 'pack'} onClick={() => setMode('pack')}>
              Per {row.pack_unit}
            </Chip>
          </div>
        )}
        <Field
          label={`Jumlah (${label})`}
          inputMode="decimal"
          autoFocus
          value={qty}
          onChange={(e) => {
            setQty(e.target.value)
            setError(undefined)
          }}
          error={error}
          hint={
            mode === 'pack' && Number.isFinite(baseQty) && baseQty > 0
              ? `= ${formatNumber(baseQty)} ${row.unit}`
              : undefined
          }
        />
        <Field
          label="Catatan (opsional)"
          placeholder="Belanja dari supplier"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" disabled={restock.isPending}>
            Simpan
          </Button>
        </div>
      </form>
    </Modal>
  )
}
