import { Users } from 'lucide-react'

import { Badge } from '@/components/shared/Badge'
import { Card } from '@/components/shared/Card'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState, ErrorState, Loading } from '@/components/shared/States'
import { Switch } from '@/components/shared/Switch'
import { useToast } from '@/components/shared/toastContext'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { toMessage } from '@/lib/errors'

import { SignupCodes } from '../components/SignupCodes'
import { useStaff, useToggleStaff } from '../hooks/useStaff'

export default function StaffPage() {
  const { data, isPending, error, refetch } = useStaff()
  const toggle = useToggleStaff()
  const { session } = useAuth()
  const { notify } = useToast()

  async function handleToggle(id: string, isActive: boolean) {
    try {
      await toggle.mutateAsync({ id, isActive })
      notify(isActive ? 'Akun diaktifkan' : 'Akun dinonaktifkan')
    } catch (e) {
      notify(toMessage(e), 'error')
    }
  }

  return (
    <>
      <PageHeader
        title="Karyawan"
        description="Atur siapa yang bisa mendaftar dan nonaktifkan akun yang tidak dipakai lagi."
      />

      <SignupCodes />

      {isPending && <Loading />}
      {error && <ErrorState error={error} onRetry={() => refetch()} />}
      {data && data.length === 0 && (
        <EmptyState icon={<Users className="h-12 w-12" />} title="Belum ada pengguna" />
      )}

      <ul className="grid gap-3 lg:grid-cols-2">
        {data?.map((p) => {
          const isSelf = p.id === session?.user.id
          return (
            <li key={p.id}>
              <Card className={`flex items-center gap-3 p-4 ${p.is_active ? '' : 'opacity-60'}`}>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-lg font-bold text-slate-600">
                  {(p.full_name ?? p.email ?? '?').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-semibold">{p.full_name ?? 'Tanpa nama'}</p>
                    <Badge tone={p.role === 'owner' ? 'success' : 'neutral'}>
                      {p.role === 'owner' ? 'Owner' : 'Kasir'}
                    </Badge>
                    {isSelf && <Badge>Kamu</Badge>}
                  </div>
                  <p className="truncate text-sm text-slate-500">{p.email}</p>
                </div>
                <Switch
                  checked={p.is_active}
                  label={`Aktifkan ${p.full_name ?? p.email ?? 'akun'}`}
                  disabled={isSelf}
                  onChange={(v) => handleToggle(p.id, v)}
                />
              </Card>
            </li>
          )
        })}
      </ul>
    </>
  )
}
