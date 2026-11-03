import {
  Boxes,
  LayoutDashboard,
  LogOut,
  Receipt,
  ShoppingCart,
  Store,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'

import { useProfile, useSignOut } from '@/features/auth/hooks/useAuth'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  end: boolean
}

interface NavGroup {
  title?: string
  items: NavItem[]
}

const ownerNav: NavGroup[] = [
  {
    items: [
      { to: '/', label: 'Ringkasan', icon: LayoutDashboard, end: true },
      { to: '/kasir', label: 'Kasir', icon: ShoppingCart, end: false },
      { to: '/riwayat', label: 'Riwayat', icon: Receipt, end: false },
    ],
  },
  {
    title: 'Kelola toko',
    items: [
      { to: '/barang', label: 'Barang & Stok', icon: Boxes, end: false },
      { to: '/karyawan', label: 'Karyawan', icon: Users, end: false },
    ],
  },
]

const kasirNav: NavGroup[] = [
  {
    items: [
      { to: '/kasir', label: 'Kasir', icon: ShoppingCart, end: false },
      { to: '/riwayat', label: 'Riwayat', icon: Receipt, end: false },
    ],
  },
]

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white">
        <Store className="h-5 w-5" />
      </div>
      <span className="text-[17px] font-bold tracking-tight">Toko Stok</span>
    </div>
  )
}

export function AppLayout() {
  const signOut = useSignOut()
  const { data: profile } = useProfile()
  const groups = profile?.role === 'owner' ? ownerNav : kasirNav
  const flat = groups.flatMap((g) => g.items)
  const initial = (profile?.full_name ?? '?').charAt(0).toUpperCase()

  return (
    <div className="min-h-screen">
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200/70 bg-white lg:flex">
        <div className="px-6 py-6">
          <Logo />
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3">
          {groups.map((g, gi) => (
            <div key={gi}>
              {g.title && (
                <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  {g.title}
                </p>
              )}
              <div className="space-y-0.5">
                {g.items.map(({ to, label, icon: Icon, end }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                        isActive
                          ? 'bg-slate-900 text-white'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`
                    }
                  >
                    <Icon className="h-[18px] w-[18px]" />
                    {label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-slate-100 p-3">
          <div className="flex items-center gap-3 rounded-xl px-2 py-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{profile?.full_name ?? 'Pengguna'}</p>
              <p className="text-xs text-slate-500">{profile?.role === 'owner' ? 'Owner' : 'Kasir'}</p>
            </div>
            <button
              type="button"
              aria-label="Keluar"
              title="Keluar"
              onClick={() => signOut.mutate()}
              disabled={signOut.isPending}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <LogOut className="h-[18px] w-[18px]" />
            </button>
          </div>
        </div>
      </aside>

      {/* Top bar mobile */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200/70 bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
        <Logo />
        <button
          type="button"
          aria-label="Keluar"
          onClick={() => signOut.mutate()}
          disabled={signOut.isPending}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700"
        >
          {initial}
        </button>
      </header>

      <main className="lg:pl-64">
        <div className="mx-auto max-w-6xl px-4 py-5 pb-28 lg:px-10 lg:py-9 lg:pb-10">
          <Outlet />
        </div>
      </main>

      {/* Menu bawah mobile */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 grid border-t border-slate-200/70 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden"
        style={{ gridTemplateColumns: `repeat(${flat.length}, minmax(0, 1fr))` }}
      >
        {flat.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 py-2 text-[11px] font-medium ${
                isActive ? 'text-emerald-700' : 'text-slate-500'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`flex h-7 w-12 items-center justify-center rounded-full transition ${
                    isActive ? 'bg-emerald-100' : ''
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </span>
                {label.split(' ')[0]}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
