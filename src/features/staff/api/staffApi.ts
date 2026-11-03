import { supabase } from '@/lib/supabase'
import type { Profile, Role, SignupCode } from '@/types/models'

export const staffApi = {
  async list(): Promise<Profile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: true })
    if (error) throw error
    return (data ?? []) as Profile[]
  },

  async setActive(id: string, isActive: boolean): Promise<void> {
    const { error } = await supabase.from('profiles').update({ is_active: isActive }).eq('id', id)
    if (error) throw error
  },

  async listCodes(): Promise<SignupCode[]> {
    const { data, error } = await supabase.from('signup_codes').select('role, code')
    if (error) throw error
    return (data ?? []) as SignupCode[]
  },

  async setCode(role: Role, code: string): Promise<void> {
    const { error } = await supabase.from('signup_codes').update({ code }).eq('role', role)
    if (error) throw error
  },
}
