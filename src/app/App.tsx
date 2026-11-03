import { RouterProvider } from 'react-router-dom'

import { AuthProvider } from './providers/AuthProvider'
import { QueryProvider } from './providers/QueryProvider'
import { ToastProvider } from './providers/ToastProvider'
import { router } from './router'

export default function App() {
  return (
    <QueryProvider>
      <AuthProvider>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </AuthProvider>
    </QueryProvider>
  )
}
