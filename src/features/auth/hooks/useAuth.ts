import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useContext } from 'react'

import { qk } from '@/lib/queryKeys'
import type { Role } from '@/types/models'

import { authApi } from '../api/authApi'
import { AuthContext } from '../AuthContext'

export function useAuth() {
  return useContext(AuthContext)
}

/** Profil user yang sedang login (berisi peran owner/kasir). */
export function useProfile() {
  const { session } = useAuth()
  const userId = session?.user.id
  return useQuery({
    queryKey: qk.profile(userId ?? ''),
    queryFn: () => authApi.myProfile(userId as string),
    enabled: !!userId,
    staleTime: 5 * 60_000,
  })
}

export function useSignIn() {
  return useMutation({
    mutationFn: (v: { email: string; password: string }) => authApi.signIn(v.email, v.password),
  })
}

export function useSignUp() {
  return useMutation({
    mutationFn: async (v: {
      email: string
      password: string
      fullName: string
      role: Role
      code: string
    }) => {
      const ok = await authApi.checkSignupCode(v.role, v.code)
      if (!ok) throw new Error('Kode pendaftaran salah')
      return authApi.signUp(v.email, v.password, v.fullName, v.role, v.code)
    },
  })
}

export function useSignOut() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: authApi.signOut,
    onSuccess: () => queryClient.clear(),
  })
}
