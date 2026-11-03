import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { z } from 'zod'

import { Button } from '@/components/shared/Button'
import { Field } from '@/components/shared/Field'
import { toMessage } from '@/lib/errors'

import { useSignUp } from '../hooks/useAuth'

const schema = z.object({
  role: z.enum(['kasir', 'owner']),
  fullName: z.string().trim().min(1, 'Nama wajib diisi'),
  email: z.string().trim().min(1, 'Email wajib diisi').email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  code: z.string().trim().min(1, 'Kode pendaftaran wajib diisi'),
})

type Values = z.infer<typeof schema>

const ROLES = [
  { key: 'kasir', title: 'Kasir', desc: 'Mencatat penjualan' },
  { key: 'owner', title: 'Owner', desc: 'Kelola barang, stok, laporan' },
] as const

export function RegisterForm() {
  const signUp = useSignUp()
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'kasir', fullName: '', email: '', password: '', code: '' },
  })

  const role = watch('role')
  const onSubmit = handleSubmit((values) => signUp.mutate(values))

  if (signUp.data?.needsConfirm) {
    return (
      <div className="space-y-3 text-center">
        <p className="font-semibold">Cek email kamu</p>
        <p className="text-sm text-slate-500">
          Kami mengirim link konfirmasi. Klik link itu, lalu masuk dengan akunmu.
        </p>
        <Link to="/login" className="inline-block text-sm font-semibold text-emerald-700 hover:underline">
          Ke halaman masuk
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div>
        <p className="mb-1.5 text-sm font-medium text-slate-700">Daftar sebagai</p>
        <div className="grid grid-cols-2 gap-2">
          {ROLES.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => setValue('role', r.key, { shouldValidate: true })}
              className={`rounded-xl border-2 px-3 py-2.5 text-left transition ${
                role === r.key
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <span className="block text-sm font-semibold">{r.title}</span>
              <span className="block text-xs text-slate-500">{r.desc}</span>
            </button>
          ))}
        </div>
        <input type="hidden" {...register('role')} />
      </div>

      <Field label="Nama" placeholder="Nama kamu" error={errors.fullName?.message} {...register('fullName')} />
      <Field
        label="Email"
        type="email"
        autoComplete="email"
        placeholder="nama@email.com"
        error={errors.email?.message}
        {...register('email')}
      />
      <Field
        label="Password"
        type="password"
        autoComplete="new-password"
        hint="Minimal 6 karakter"
        error={errors.password?.message}
        {...register('password')}
      />
      <Field
        label={role === 'owner' ? 'Kode pendaftaran owner' : 'Kode pendaftaran kasir'}
        placeholder="Contoh: AB12CD34"
        autoCapitalize="characters"
        hint={
          role === 'owner'
            ? 'Kode owner ada di halaman Karyawan milik akun owner.'
            : 'Minta kode kasir ke owner toko.'
        }
        error={errors.code?.message}
        {...register('code')}
      />

      {signUp.error && <p className="text-sm text-rose-600">{toMessage(signUp.error)}</p>}
      <Button type="submit" size="lg" className="w-full" disabled={signUp.isPending}>
        {signUp.isPending ? 'Mendaftar…' : 'Daftar'}
      </Button>
      <p className="text-center text-sm text-slate-500">
        Sudah punya akun?{' '}
        <Link to="/login" className="font-semibold text-emerald-700 hover:underline">
          Masuk
        </Link>
      </p>
    </form>
  )
}
