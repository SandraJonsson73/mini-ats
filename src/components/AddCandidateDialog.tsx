import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { createCandidate } from '../lib/candidates'
import { candidateSchema, type CandidateForm } from '../lib/candidateSchema'
import { fetchJobs } from '../lib/jobs'

const inputClass = 'mt-1 w-full rounded-md border border-slate-300 px-3 py-2'

export default function AddCandidateDialog({
  orgId,
  onClose,
}: {
  orgId: string
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const jobs = useQuery({ queryKey: ['jobs', orgId], queryFn: () => fetchJobs(orgId) })
  const openJobs = jobs.data?.filter((j) => j.status === 'open') ?? []

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CandidateForm>({ resolver: zodResolver(candidateSchema) })

  const create = useMutation({
    mutationFn: createCandidate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates', orgId] })
      onClose()
    },
  })

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/40 p-4">
      <form
        onSubmit={handleSubmit((values) => create.mutate({ organization_id: orgId, ...values }))}
        className="max-h-full w-full max-w-md space-y-4 overflow-y-auto rounded-xl bg-white p-6 shadow-xl"
      >
        <h2 className="text-lg font-semibold">Ny kandidat</h2>

        {jobs.isSuccess && openJobs.length === 0 && (
          <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">
            Det finns inga öppna jobb. Lägg upp ett jobb först.
          </p>
        )}

        <label className="block text-sm font-medium text-slate-700">
          Namn
          <input {...register('full_name')} className={inputClass} />
          {errors.full_name && <span className="text-xs text-red-600">{errors.full_name.message}</span>}
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Jobb
          <select {...register('job_id')} className={inputClass}>
            <option value="">Välj…</option>
            {openJobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title}
              </option>
            ))}
          </select>
          {errors.job_id && <span className="text-xs text-red-600">{errors.job_id.message}</span>}
        </label>

        <label className="block text-sm font-medium text-slate-700">
          E-post
          <input {...register('email')} className={inputClass} />
          {errors.email && <span className="text-xs text-red-600">{errors.email.message}</span>}
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Telefon
          <input {...register('phone')} className={inputClass} />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          LinkedIn
          <input {...register('linkedin_url')} placeholder="https://www.linkedin.com/in/…" className={inputClass} />
          {errors.linkedin_url && <span className="text-xs text-red-600">{errors.linkedin_url.message}</span>}
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Anteckningar
          <textarea {...register('notes')} rows={3} className={inputClass} />
        </label>

        {create.isError && <p className="text-sm text-red-600">{create.error.message}</p>}

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-md border border-slate-300 px-4 py-2 hover:bg-slate-100">
            Avbryt
          </button>
          <button
            type="submit"
            disabled={create.isPending}
            className="rounded-md bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {create.isPending ? 'Sparar…' : 'Lägg till'}
          </button>
        </div>
      </form>
    </div>
  )
}
