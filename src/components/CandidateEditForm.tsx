import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { updateCandidate, type Candidate } from '../lib/candidates'
import { candidateSchema, type CandidateForm } from '../lib/candidateSchema'
import { fetchJobs } from '../lib/jobs'

const inputClass = 'mt-1 w-full rounded-md border border-slate-300 px-3 py-2'

export default function CandidateEditForm({
  candidate,
  onDone,
}: {
  candidate: Candidate
  onDone: () => void
}) {
  const queryClient = useQueryClient()
  const jobs = useQuery({
    queryKey: ['jobs', candidate.organization_id],
    queryFn: () => fetchJobs(candidate.organization_id),
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CandidateForm>({
    resolver: zodResolver(candidateSchema),
    defaultValues: {
      full_name: candidate.full_name,
      job_id: candidate.job_id,
      email: candidate.email ?? '',
      phone: candidate.phone ?? '',
      linkedin_url: candidate.linkedin_url ?? '',
      notes: candidate.notes ?? '',
    },
  })

  const save = useMutation({
    mutationFn: (values: CandidateForm) => updateCandidate(candidate, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates', candidate.organization_id] })
      onDone()
    },
  })

  // Vänta tills jobblistan finns, så att rätt jobb är förvalt i rullgardinen
  if (!jobs.data) return <p className="text-sm text-slate-500">Laddar…</p>
  const selectable = jobs.data.filter((j) => j.status === 'open' || j.id === candidate.job_id)

  return (
    <form onSubmit={handleSubmit((values) => save.mutate(values))} className="space-y-4">
      <label className="block text-sm font-medium text-slate-700">
        Namn
        <input {...register('full_name')} className={inputClass} />
        {errors.full_name && <span className="text-xs text-red-600">{errors.full_name.message}</span>}
      </label>

      <label className="block text-sm font-medium text-slate-700">
        Jobb
        <select {...register('job_id')} className={inputClass}>
          {selectable.map((j) => (
            <option key={j.id} value={j.id}>
              {j.title}
            </option>
          ))}
        </select>
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
        <input {...register('linkedin_url')} className={inputClass} />
        {errors.linkedin_url && <span className="text-xs text-red-600">{errors.linkedin_url.message}</span>}
      </label>

      <label className="block text-sm font-medium text-slate-700">
        Anteckningar
        <textarea {...register('notes')} rows={3} className={inputClass} />
      </label>

      {save.isError && <p className="text-sm text-red-600">{save.error.message}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={save.isPending}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {save.isPending ? 'Sparar…' : 'Spara'}
        </button>
        <button type="button" onClick={onDone} className="rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100">
          Avbryt
        </button>
      </div>
    </form>
  )
}
