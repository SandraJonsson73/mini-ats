import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type SubmitEvent } from 'react'
import {
  createUser,
  deleteUser,
  fetchOrganizations,
  fetchUsers,
  type CreateUserResult,
} from '../../lib/users'
import { useAuth } from '../../auth/AuthContext'


const NEW_ORG = '__new__'
const inputClass = 'mt-1 w-full rounded-md border border-slate-300 px-3 py-2'

export default function UsersPage() {
  const queryClient = useQueryClient()
  const { profile } = useAuth()
  const orgs = useQuery({ queryKey: ['organizations'], queryFn: fetchOrganizations })
  const users = useQuery({ queryKey: ['users'], queryFn: fetchUsers })
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<'admin' | 'customer'>('customer')
  const [orgChoice, setOrgChoice] = useState('')
  const [newOrgName, setNewOrgName] = useState('')
  const [created, setCreated] = useState<CreateUserResult | null>(null)

  const mutation = useMutation({
    mutationFn: createUser,
    onSuccess: (result) => {
      setCreated(result)
      setEmail('')
      setFullName('')
      setOrgChoice('')
      setNewOrgName('')
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['organizations'] })
    },
  })

  const remove = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })


  function handleSubmit(e: SubmitEvent<HTMLFormElement>) {    e.preventDefault()
    setCreated(null)
    mutation.mutate({
      email,
      full_name: fullName,
      role,
      ...(role === 'customer' &&
        (orgChoice === NEW_ORG
          ? { new_organization_name: newOrgName }
          : { organization_id: orgChoice })),
    })
  }

  const orgName = (id: string | null) => orgs.data?.find((o) => o.id === id)?.name ?? '–'

  return (
    <div className="mx-auto max-w-3xl p-8">
      <h1 className="mt-2 text-2xl font-bold text-indigo-600">Användare</h1>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-xl bg-white p-6 shadow">
        <h2 className="font-semibold">Skapa konto</h2>

        <label className="block text-sm font-medium text-slate-700">
          E-post
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Namn
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Roll
          <select value={role} onChange={(e) => setRole(e.target.value as 'admin' | 'customer')} className={inputClass}>
            <option value="customer">Kund</option>
            <option value="admin">Admin</option>
          </select>
        </label>

        {role === 'customer' && (
          <>
            <label className="block text-sm font-medium text-slate-700">
              Organisation
              <select required value={orgChoice} onChange={(e) => setOrgChoice(e.target.value)} className={inputClass}>
                <option value="">Välj…</option>
                {orgs.data?.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
                <option value={NEW_ORG}>+ Ny organisation</option>
              </select>
            </label>

            {orgChoice === NEW_ORG && (
              <label className="block text-sm font-medium text-slate-700">
                Namn på ny organisation
                <input required value={newOrgName} onChange={(e) => setNewOrgName(e.target.value)} className={inputClass} />
              </label>
            )}
          </>
        )}

        {mutation.isError && <p className="text-sm text-red-600">{mutation.error.message}</p>}

        <button
          type="submit"
          disabled={mutation.isPending}
          className="rounded-md bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {mutation.isPending ? 'Skapar…' : 'Skapa konto'}
        </button>
      </form>

      {created && (
        <div className="mt-6 rounded-xl border border-green-300 bg-green-50 p-4">
          <p className="font-semibold text-green-800">Kontot är skapat</p>
          <p className="mt-1 text-sm">E-post: {created.email}</p>
          <p className="text-sm">
            Lösenord: <code className="rounded bg-white px-1 py-0.5">{created.password}</code>
          </p>
          <p className="mt-2 text-xs text-slate-600">Lösenordet visas bara nu. Skicka det till användaren.</p>
        </div>
      )}

      <h2 className="mt-8 font-semibold">Alla konton</h2>
      <table className="mt-2 w-full text-left text-sm">
        <thead className="text-slate-500">
          <tr>
            <th className="py-2">E-post</th>
            <th>Namn</th>
            <th>Roll</th>
            <th>Organisation</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {users.data?.map((u) => (
            <tr key={u.id} className="border-t border-slate-200">
              <td className="py-2">{u.email}</td>
              <td>{u.full_name ?? '–'}</td>
              <td>{u.role === 'admin' ? 'Admin' : 'Kund'}</td>
              <td>{orgName(u.organization_id)}</td>
              <td className="text-right">
                {u.id !== profile?.id && (
                  <button
                    onClick={() => {
                      if (window.confirm(`Ta bort ${u.email}? Kontot kan inte återställas.`)) {
                        remove.mutate(u.id)
                      }
                    }}
                    disabled={remove.isPending}
                    className="text-sm text-red-600 hover:underline disabled:opacity-50"
                  >
                    Ta bort
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {remove.isError && <p className="mt-2 text-sm text-red-600">{remove.error.message}</p>}
    </div>
  )
}
