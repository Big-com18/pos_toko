import { Store } from 'lucide-react'
import { Navigate } from 'react-router-dom'

import { Loading } from '@/components/shared/States'

import { LoginForm } from '../components/LoginForm'
import { useAuth } from '../hooks/useAuth'

export default function LoginPage() {
  const { session, loading } = useAuth()

  if (loading) return <Loading />
  if (session) return <Navigate to="/" replace />

  return (
    <div className="flex min-h-screen items-center justify-center bg-emerald-50/60 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/30">
            <Store className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Toko Stok</h1>
          <p className="mt-1 text-sm text-slate-500">Masuk untuk mencatat penjualan dan stok</p>
        </div>
        <div className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-xl shadow-slate-200/60">
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
