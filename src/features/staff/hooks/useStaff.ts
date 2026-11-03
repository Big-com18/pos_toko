import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { qk } from '@/lib/queryKeys'
import type { Role } from '@/types/models'

import { staffApi } from '../api/staffApi'

export function useStaff() {
  return useQuery({ queryKey: qk.staff, queryFn: staffApi.list })
}

export function useToggleStaff() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (v: { id: string; isActive: boolean }) => staffApi.setActive(v.id, v.isActive),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.staff }),
  })
}

export function useSignupCodes() {
  return useQuery({ queryKey: qk.signupCodes, queryFn: staffApi.listCodes })
}

export function useUpdateSignupCode() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (v: { role: Role; code: string }) => staffApi.setCode(v.role, v.code),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.signupCodes }),
  })
}
