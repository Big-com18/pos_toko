import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { z } from 'zod'

import { Button } from '@/components/shared/Button'
import { Field } from '@/components/shared/Field'
import { toMessage } from '@/lib/errors'

import { useSignIn } from '../hooks/useAuth'

const schema = z.object({
  email: z.string().trim().min(1, 'Email wajib diisi').email('Format email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
})

type Values = z.infer<typeof schema>

export function LoginForm() {
  const signIn = useSignIn()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { email: '', password: '' } })

  const onSubmit = handleSubmit((values) => signIn.mutate(values))

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
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
        autoComplete="current-password"
        error={errors.password?.message}
        {...register('password')}
      />
      {signIn.error && <p className="text-sm text-rose-600">{toMessage(signIn.error)}</p>}
      <Button type="submit" size="lg" className="w-full" disabled={signIn.isPending}>
        {signIn.isPending ? 'Masuk…' : 'Masuk'}
      </Button>
      <p className="text-center text-sm text-slate-500">
        Belum punya akun?{' '}
        <Link to="/daftar" className="font-semibold text-emerald-700 hover:underline">
          Daftar
        </Link>
      </p>
    </form>
  )
}
