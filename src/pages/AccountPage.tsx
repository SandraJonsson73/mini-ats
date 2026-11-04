import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useAuth } from '../auth/AuthContext'
import { supabase } from '../lib/supabase'

const schema = z
  .object({
    current: z.string().min(1, 'Ange ditt nuvarande lösenord'),
    next: z.string().min(8, 'Minst 8 tecken'),
    confirm: z.string(),
  })
  .refine((v) => v.next === v.confirm, { message: 'Lösenorden matchar inte', path: ['confirm'] })
type PasswordForm = z.infer<typeof schema>

const inputClass = 'mt-1 w-full rounded-md border border-slate-300 px-3 py-2'

export default function AccountPage() {
  const { profile } = useAuth()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordForm>({ resolver: zodResolver(schema) })

  const change = useMutation({
    mutationFn: async ({ current, next }: PasswordForm) => {
      // Kontrollera det nuvarande lösenordet innan vi byter
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: profile!.email,
        password: current,
      })
      if (verifyError) throw new Error('Nuvarande lösenord stämmer inte.')

      const { error } = await supabase.auth.updateUser({ password: next })
      if (error) throw new Error(error.message)
    },
    onSuccess: () => reset(),
  })

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-2xl font-bold">Konto</h1>
      <p className="mt-1 text-sm text-slate-500">
        {profile?.email} ({profile?.role === 'admin' ? 'Admin' : 'Kund'})
      </p>

      <form
        onSubmit={handleSubmit((values) => change.mutate(values))}
        className="mt-6 space-y-4 rounded-xl bg-white p-6 shadow"
      >
        <h2 className="font-semibold">Byt lösenord</h2>

        <label className="block text-sm font-medium text-slate-700">
          Nuvarande lösenord
          <input type="password" autoComplete="current-password" {...register('current')} className={inputClass} />
          {errors.current && <span className="text-xs text-red-600">{errors.current.message}</span>}
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Nytt lösenord
          <input type="password" autoComplete="new-password" {...register('next')} className={inputClass} />
          {errors.next && <span className="text-xs text-red-600">{errors.next.message}</span>}
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Upprepa nytt lösenord
          <input type="password" autoComplete="new-password" {...register('confirm')} className={inputClass} />
          {errors.confirm && <span className="text-xs text-red-600">{errors.confirm.message}</span>}
        </label>

        {change.isError && <p className="text-sm text-red-600">{change.error.message}</p>}
        {change.isSuccess && <p className="text-sm text-green-700">Lösenordet är bytt.</p>}

        <button
          type="submit"
          disabled={change.isPending}
          className="rounded-md bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {change.isPending ? 'Sparar…' : 'Byt lösenord'}
        </button>
      </form>
    </div>
  )
}
