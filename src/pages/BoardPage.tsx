import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import AddCandidateDialog from '../components/AddCandidateDialog'
import CandidateDrawer from '../components/CandidateDrawer'
import KanbanBoard from '../components/KanbanBoard'
import { fetchCandidates, moveCandidate, type Candidate } from '../lib/candidates'
import { fetchJobs } from '../lib/jobs'
import { fetchOrganizations } from '../lib/users'
import type { Stage } from '../lib/stages'
import { useActiveOrg } from '../org/ActiveOrgContext'
import { BoardSkeleton } from '../components/Skeleton'

export default function BoardPage() {
  const { activeOrgId } = useActiveOrg()
  const queryClient = useQueryClient()
  const [adding, setAdding] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [params, setParams] = useSearchParams()

  const orgs = useQuery({ queryKey: ['organizations'], queryFn: fetchOrganizations })

  const candidatesKey = ['candidates', activeOrgId]

  const candidates = useQuery({
    queryKey: candidatesKey,
    queryFn: () => fetchCandidates(activeOrgId!),
    enabled: !!activeOrgId,
  })
  const jobs = useQuery({
    queryKey: ['jobs', activeOrgId],
    queryFn: () => fetchJobs(activeOrgId!),
    enabled: !!activeOrgId,
  })

  const move = useMutation({
    mutationFn: ({ id, stage, position }: { id: string; stage: Stage; position: number }) =>
      moveCandidate(id, stage, position),
    // Optimistisk uppdatering: flytta kortet direkt, ångra om sparandet misslyckas
    onMutate: async ({ id, stage, position }) => {
      await queryClient.cancelQueries({ queryKey: candidatesKey })
      const previous = queryClient.getQueryData<Candidate[]>(candidatesKey)
      queryClient.setQueryData<Candidate[]>(candidatesKey, (old) =>
        old?.map((c) => (c.id === id ? { ...c, stage, position } : c)).sort((a, b) => a.position - b.position),
      )
      return { previous }
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(candidatesKey, context.previous)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: candidatesKey }),
  })

  // Filter i URL:en. Ett jobb från en annan organisation räknas som "alla jobb".
  const query = params.get('q') ?? ''
  const jobParam = params.get('job') ?? ''
  const jobFilter = jobs.data?.some((j) => j.id === jobParam) ? jobParam : ''

  function setParam(key: string, value: string) {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (value) next.set(key, value)
        else next.delete(key)
        return next
      },
      { replace: true },
    )
  }

if (!activeOrgId) {
  return orgs.isPending ? (
    <BoardSkeleton />
  ) : (
    <p className="text-slate-500">Ingen organisation vald. Skapa en kund under Användare först.</p>
  )
}

  const needle = query.trim().toLowerCase()
  const visible = (candidates.data ?? []).filter(
    (c) => (!jobFilter || c.job_id === jobFilter) && c.full_name.toLowerCase().includes(needle),
  )
  const jobTitle = (id: string) => jobs.data?.find((j) => j.id === id)?.title ?? '–'
  const hasFilter = !!jobFilter || !!needle

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="mr-auto text-2xl font-bold">Kandidater</h1>

        <select
          aria-label="Filtrera på jobb"
          value={jobFilter}
          onChange={(e) => setParam('job', e.target.value)}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
        >
          <option value="">Alla jobb</option>
          {jobs.data?.map((j) => (
            <option key={j.id} value={j.id}>
              {j.title}
            </option>
          ))}
        </select>

        <input
          type="search"
          placeholder="Sök kandidat…"
          value={query}
          onChange={(e) => setParam('q', e.target.value)}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
        />

        {hasFilter && (
          <button onClick={() => setParams({}, { replace: true })} className="text-sm text-indigo-600 hover:underline">
            Rensa filter
          </button>
        )}

        <button
          onClick={() => setAdding(true)}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Ny kandidat
        </button>
      </div>

      {candidates.isPending && <BoardSkeleton />}
      {candidates.isError && <p className="mt-6 text-red-600">Kunde inte hämta kandidater.</p>}
      {move.isError && <p className="mt-2 text-sm text-red-600">Kunde inte flytta kandidaten. Försök igen.</p>}

      <div className="mt-4">
        <KanbanBoard
          candidates={visible}
          jobTitle={jobTitle}
          onMove={(c, stage) => move.mutate({ id: c.id, stage, position: Date.now() })}
          onOpen={(c) => setSelectedId(c.id)}
        />
      </div>

      {(() => {
        const selected = candidates.data?.find((c) => c.id === selectedId)
        return selected ? (
          <CandidateDrawer
            candidate={selected}
            jobTitle={jobTitle(selected.job_id)}
            onClose={() => setSelectedId(null)}
          />
        ) : null
      })()}
      
      {adding && <AddCandidateDialog orgId={activeOrgId} onClose={() => setAdding(false)} />}
    </div>
  )
}
