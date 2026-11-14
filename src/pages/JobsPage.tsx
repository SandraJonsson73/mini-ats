import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { createJob, deleteJob, fetchJobs, setJobStatus, type Job } from '../lib/jobs'
import { useActiveOrg } from '../org/ActiveOrgContext'
import { fetchCandidates } from '../lib/candidates'
import { ListSkeleton } from '../components/Skeleton'
import { jobSchema, type JobForm } from '../lib/jobSchema'
import JobEditForm from '../components/JobEditForm'

const inputClass = 'mt-1 w-full rounded-md border border-slate-300 px-3 py-2'

export default function JobsPage() {
  const { organizations, activeOrgId } = useActiveOrg()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string[]>([])
  const toggleExpanded = (id: string) =>
  setExpanded((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]))
  const [editingId, setEditingId] = useState<string | null>(null)

  const orgName = organizations.find((o) => o.id === activeOrgId)?.name

  const jobs = useQuery({
    queryKey: ['jobs', activeOrgId],
    queryFn: () => fetchJobs(activeOrgId!),
    enabled: !!activeOrgId,
  })

    const candidates = useQuery({
    queryKey: ['candidates', activeOrgId],
    queryFn: () => fetchCandidates(activeOrgId!),
    enabled: !!activeOrgId,
  })
  const candidateCount = (jobId: string) =>
    candidates.data?.filter((c) => c.job_id === jobId).length ?? 0

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<JobForm>({ resolver: zodResolver(jobSchema) })

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['jobs', activeOrgId] })

  const create = useMutation({
    mutationFn: createJob,
    onSuccess: () => {
      refresh()
      reset()
      setShowForm(false)
    },
  })

  const toggle = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Job['status'] }) => setJobStatus(id, status),
    onSuccess: refresh,
  })

    const remove = useMutation({
    mutationFn: deleteJob,
    onSuccess: () => {
      refresh()
      queryClient.invalidateQueries({ queryKey: ['candidates', activeOrgId] })
    },
  })

  if (!activeOrgId) {
    return <p className="text-slate-500">Ingen organisation vald. Skapa en kund under Användare först.</p>
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold sm:text-2xl">Jobb hos {orgName}</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="whitespace-nowrap rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          {showForm ? 'Avbryt' : 'Nytt jobb'}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit((values) => create.mutate({ organization_id: activeOrgId, ...values }))}
          className="mt-4 space-y-4 rounded-xl bg-white p-6 border border-slate-200 shadow-sm"
        >
          <label className="block text-sm font-medium text-slate-700">
            Titel
            <input {...register('title')} className={inputClass} />
            {errors.title && <span className="text-xs text-red-600">{errors.title.message}</span>}
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Plats
            <input {...register('location')} className={inputClass} />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Beskrivning
            <textarea {...register('description')} rows={5} className={inputClass} />
          </label>

          {create.isError && <p className="text-sm text-red-600">{create.error.message}</p>}

          <button
            type="submit"
            disabled={create.isPending}
            className="rounded-md bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {create.isPending ? 'Sparar…' : 'Lägg upp jobb'}
          </button>
        </form>
      )}

      {jobs.isPending && <ListSkeleton />}
      {jobs.isError && <p className="mt-6 text-red-600">Kunde inte hämta jobb.</p>}
      {jobs.data?.length === 0 && <p className="mt-6 text-slate-500">Inga jobb ännu.</p>}

      <ul className="mt-6 space-y-3">
        {jobs.data?.map((job) =>
          editingId === job.id ? (
            <li key={job.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <JobEditForm job={job} onDone={() => setEditingId(null)} />
            </li>
          ) : (
          <li key={job.id} className="rounded-xl bg-white p-4 border border-slate-200 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-semibold">{job.title}</h2>
                {job.location && <p className="text-sm text-slate-500">{job.location}</p>}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    job.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {job.status === 'open' ? 'Öppet' : 'Stängt'}
                </span>
                <button
                  onClick={() => toggle.mutate({ id: job.id, status: job.status === 'open' ? 'closed' : 'open' })}
                  className="rounded-md border border-slate-300 px-2 py-1 text-xs hover:bg-slate-100"
                >
                  {job.status === 'open' ? 'Stäng' : 'Öppna igen'}
                </button>
                <button
                  onClick={() => setEditingId(job.id)}
                  className="whitespace-nowrap rounded-md border border-slate-300 px-2 py-1 text-xs hover:bg-slate-100"
                >
                  Redigera
                </button>

                <button
                  onClick={() => {
                    const n = candidateCount(job.id)
                    const warning =
                      n > 0 ? ` Även ${n} kandidat${n === 1 ? '' : 'er'} och deras CV tas bort.` : ''
                    if (window.confirm(`Ta bort jobbet "${job.title}"?${warning} Det går inte att ångra.`)) {
                      remove.mutate(job.id)
                    }
                  }}
                  disabled={remove.isPending}
                  className="rounded-md border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  Ta bort
                </button>
              </div>
            </div>
            {job.description && (
              <>
                <p
                  className={`mt-2 whitespace-pre-line text-sm text-slate-700 ${
                    expanded.includes(job.id) ? '' : 'line-clamp-3'
                  }`}
                >
                  {job.description}
                </p>
                {(job.description.includes('\n') || job.description.length > 150) && (
                  <button onClick={() => toggleExpanded(job.id)} className="mt-1 text-sm text-indigo-600 hover:underline">
                    {expanded.includes(job.id) ? 'Visa mindre' : 'Visa mer'}
                  </button>
                )}
              </>
            )}
          </li>
        ))}
      </ul>
            {remove.isError && <p className="mt-2 text-sm text-red-600">Kunde inte ta bort jobbet.</p>}

    </div>
  )
}
