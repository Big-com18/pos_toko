import type { Session } from '@supabase/supabase-js'
import { type ReactNode, useEffect, useMemo, useState } from 'react'

import { authApi } from '@/features/auth/api/authApi'
import { AuthContext } from '@/features/auth/AuthContext'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    authApi
      .getSession()
      .then((s) => {
        if (active) {
          setSession(s)
          setLoading(false)
        }
      })
      .catch(() => {
        if (active) setLoading(false)
      })
    const off = authApi.onChange((s) => {
      setSession(s)
      setLoading(false)
    })
    return () => {
      active = false
      off()
    }
  }, [])

  const value = useMemo(() => ({ session, loading }), [session, loading])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
