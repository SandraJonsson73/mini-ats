import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { updateJob, type Job } from '../lib/jobs'
import { jobSchema, type JobForm } from '../lib/jobSchema'

const inputClass = 'mt-1 w-full rounded-md border border-slate-300 px-3 py-2'

export default function JobEditForm({ job, onDone }: { job: Job; onDone: () => void }) {
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<JobForm>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      title: job.title,
      location: job.location ?? '',
      description: job.description ?? '',
    },
  })

  const save = useMutation({
    mutationFn: (values: JobForm) => updateJob(job.id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs', job.organization_id] })
      onDone()
    },
  })

  return (
    <form onSubmit={handleSubmit((values) => save.mutate(values))} className="space-y-4">
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
        <textarea {...register('description')} rows={8} className={inputClass} />
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
