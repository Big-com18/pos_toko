import type { Session } from '@supabase/supabase-js'

import { supabase } from '@/lib/supabase'
import type { Profile, Role } from '@/types/models'

export const authApi = {
  async getSession(): Promise<Session | null> {
    const { data, error } = await supabase.auth.getSession()
    if (error) throw error
    return data.session
  },

  async signIn(email: string, password: string): Promise<void> {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  },

  /** Cek kode pendaftaran sebelum membuat akun (hasilnya true/false). */
  async checkSignupCode(role: Role, code: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('check_signup_code', { p_role: role, p_code: code })
    if (error) throw error
    return data === true
  },

  /** needsConfirm = true kalau Supabase meminta konfirmasi email dulu. */
  async signUp(
    email: string,
    password: string,
    fullName: string,
    role: Role,
    code: string,
  ): Promise<{ needsConfirm: boolean }> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role, signup_code: code } },
    })
    if (error) {
      if (error.message.toLowerCase().includes('database error')) {
        throw new Error('Pendaftaran gagal. Periksa kode pendaftaran lalu coba lagi.')
      }
      throw error
    }
    return { needsConfirm: data.session === null }
  },

  async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  onChange(callback: (session: Session | null) => void): () => void {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session))
    return () => data.subscription.unsubscribe()
  },

  async myProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
    if (error) throw error
    return (data as Profile | null) ?? null
  },
}
