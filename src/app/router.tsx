import { createBrowserRouter, Navigate } from 'react-router-dom'

import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute'
import LoginPage from '@/features/auth/pages/LoginPage'
import RegisterPage from '@/features/auth/pages/RegisterPage'
import HistoryPage from '@/features/history/pages/HistoryPage'
import InventoryPage from '@/features/inventory/pages/InventoryPage'
import SalesPage from '@/features/sales/pages/SalesPage'
import StaffPage from '@/features/staff/pages/StaffPage'

import { HomeRoute, OwnerRoute } from './guards'
import { AppLayout } from './layouts/AppLayout'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/daftar', element: <RegisterPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <HomeRoute /> },
          { path: 'kasir', element: <SalesPage /> },
          { path: 'riwayat', element: <HistoryPage /> },
          {
            element: <OwnerRoute />,
            children: [
              { path: 'barang', element: <InventoryPage /> },
              { path: 'stok', element: <Navigate to="/barang" replace /> },
              { path: 'karyawan', element: <StaffPage /> },
            ],
          },
          { path: '*', element: <Navigate to="/" replace /> },
        ],
      },
    ],
  },
])
