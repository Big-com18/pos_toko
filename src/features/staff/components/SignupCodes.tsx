import { Copy, RefreshCw } from 'lucide-react'

import { Button } from '@/components/shared/Button'
import { Card } from '@/components/shared/Card'
import { ErrorState, Loading } from '@/components/shared/States'
import { useToast } from '@/components/shared/toastContext'
import { toMessage } from '@/lib/errors'
import type { Role } from '@/types/models'

import { useSignupCodes, useUpdateSignupCode } from '../hooks/useStaff'

const INFO: Record<Role, { title: string; desc: string }> = {
  kasir: { title: 'Kode kasir', desc: 'Bagikan ke karyawan agar bisa mendaftar sebagai kasir.' },
  owner: { title: 'Kode owner', desc: 'Jangan dibagikan. Hanya untuk menambah owner lain.' },
}

function randomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = new Uint32Array(8)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (n) => chars[n % chars.length]).join('')
}

export function SignupCodes() {
  const { data, isPending, error, refetch } = useSignupCodes()
  const update = useUpdateSignupCode()
  const { notify } = useToast()

  async function copy(code: string) {
    try {
      await navigator.clipboard.writeText(code)
      notify('Kode disalin')
    } catch {
      notify('Gagal menyalin, salin manual saja', 'error')
    }
  }

  async function regenerate(role: Role) {
    if (!window.confirm(`Buat kode ${role} yang baru? Kode lama tidak bisa dipakai lagi.`)) return
    try {
      await update.mutateAsync({ role, code: randomCode() })
      notify('Kode baru dibuat')
    } catch (e) {
      notify(toMessage(e), 'error')
    }
  }

  const rows = (['kasir', 'owner'] as const).map((role) => ({
    role,
    code: data?.find((c) => c.role === role)?.code,
  }))

  return (
    <Card className="mb-6 p-5">
      <h2 className="font-bold">Kode pendaftaran</h2>
      <p className="mb-4 mt-1 text-sm text-slate-500">
        Orang baru harus memasukkan kode ini di halaman Daftar. Tanpa kode yang benar, akun tidak
        bisa dibuat.
      </p>

      {isPending && <Loading />}
      {error && <ErrorState error={error} onRetry={() => refetch()} />}

      {data && (
        <ul className="space-y-3">
          {rows.map(({ role, code }) => (
            <li
              key={role}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold">{INFO[role].title}</p>
                <p className="text-xs text-slate-500">{INFO[role].desc}</p>
              </div>
              <div className="flex items-center gap-2">
                <code className="rounded-lg bg-white px-3 py-1.5 text-base font-bold tracking-widest">
                  {code ?? '-'}
                </code>
                <Button
                  variant="secondary"
                  iconOnly
                  aria-label={`Salin ${INFO[role].title}`}
                  disabled={!code}
                  onClick={() => code && copy(code)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  iconOnly
                  aria-label={`Buat ${INFO[role].title} baru`}
                  disabled={update.isPending}
                  onClick={() => regenerate(role)}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
