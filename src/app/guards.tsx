import { Navigate, Outlet } from 'react-router-dom'

import { useProfile } from '@/features/auth/hooks/useAuth'
import DashboardPage from '@/features/dashboard/pages/DashboardPage'

/** Halaman yang hanya boleh dibuka owner. Kasir diarahkan ke halaman kasir. */
export function OwnerRoute() {
  const { data } = useProfile()
  if (data?.role !== 'owner') return <Navigate to="/kasir" replace />
  return <Outlet />
}

/** Halaman awal: owner melihat dashboard, kasir langsung ke halaman kasir. */
export function HomeRoute() {
  const { data } = useProfile()
  if (data?.role === 'owner') return <DashboardPage />
  return <Navigate to="/kasir" replace />
}
