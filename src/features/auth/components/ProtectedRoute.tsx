import { Navigate, Outlet } from 'react-router-dom'

import { Button } from '@/components/shared/Button'
import { ErrorState, Loading } from '@/components/shared/States'

import { useAuth, useProfile, useSignOut } from '../hooks/useAuth'

export function ProtectedRoute() {
  const { session, loading } = useAuth()
  const profile = useProfile()
  const signOut = useSignOut()

  if (loading) return <Loading />
  if (!session) return <Navigate to="/login" replace />
  if (profile.isPending) return <Loading />
  if (profile.error) {
    return (
      <div className="p-6">
        <ErrorState error={profile.error} onRetry={() => profile.refetch()} />
      </div>
    )
  }
  if (!profile.data || !profile.data.is_active) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-lg font-semibold">Akun belum aktif</p>
        <p className="max-w-sm text-sm text-slate-500">
          Akunmu belum bisa dipakai. Hubungi owner toko untuk mengaktifkannya.
        </p>
        <Button variant="secondary" onClick={() => signOut.mutate()}>
          Keluar
        </Button>
      </div>
    )
  }
  return <Outlet />
}
