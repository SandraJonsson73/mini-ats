import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, type ChangeEvent } from 'react'
import { deleteCandidate, getCvUrl, scoreCandidate, uploadCv, type Candidate } from '../lib/candidates'
import CandidateEditForm from './CandidateEditForm'
import { scoreColor } from '../lib/score'
import { STAGES } from '../lib/stages'
import Avatar from './Avatar'

const MAX_SIZE = 5 * 1024 * 1024 // 5 MB, samma gräns som bucketen

type Props = {
  candidate: Candidate
  jobTitle: string
  onClose: () => void
}

const CONFIDENCE = { low: 'låg', medium: 'medel', high: 'hög' } as const

function AssessmentList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null
  return (
    <div>
      <h4 className="font-medium">{title}</h4>
      <ul className="mt-1 list-disc space-y-1 pl-5 text-slate-700">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  )
}

export default function CandidateDrawer({ candidate, jobTitle, onClose }: Props) {
  const queryClient = useQueryClient()
  const [fileError, setFileError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)

  const upload = useMutation({
    mutationFn: (file: File) => uploadCv(candidate, file),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['candidates', candidate.organization_id] }),
  })

  const download = useMutation({
    mutationFn: () => getCvUrl(candidate.cv_path!),
    onSuccess: (url) => window.open(url, '_blank', 'noopener'),
  })

    const score = useMutation({
    mutationFn: () => scoreCandidate(candidate.id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['candidates', candidate.organization_id] }),
  })
  const a = candidate.ai_assessment

  const remove = useMutation({
    mutationFn: () => deleteCandidate(candidate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates', candidate.organization_id] })
      onClose()
    },
  })

  function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // gör att samma fil kan väljas igen
    if (!file) return
    if (file.type !== 'application/pdf') return setFileError('Bara PDF-filer stöds.')
    if (file.size > MAX_SIZE) return setFileError('Filen är för stor (max 5 MB).')
    setFileError(null)
    upload.mutate(file)
  }

  const stageLabel = STAGES.find((s) => s.key === candidate.stage)?.label

  return (
    <div className="fixed inset-0 z-10 flex animate-fade-in items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <aside
        onClick={(e) => e.stopPropagation()}
      className="max-h-full w-full max-w-lg animate-pop-in overflow-y-auto rounded-xl bg-white p-6 shadow-xl motion-reduce:animate-none"
      >
          <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
            <div className="min-w-0">
            <Avatar name={candidate.full_name} size="lg" />
            <div>
              <h2 className="text-xl font-semibold">{candidate.full_name}</h2>
              <p className="text-sm text-slate-500">
                {jobTitle} · {stageLabel}
              </p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Stäng" className="text-2xl leading-none text-slate-400 hover:text-slate-700">
            ×
          </button>
        </div>

        {editing ? (
          <div className="mt-6">
            <CandidateEditForm candidate={candidate} onDone={() => setEditing(false)} />
          </div>
        ) : (
          <>
            <dl className="mt-6 space-y-3 text-sm">
              <div>
                <dt className="text-slate-500">E-post</dt>
                <dd>{candidate.email ?? '–'}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Telefon</dt>
                <dd>{candidate.phone ?? '–'}</dd>
              </div>
              <div>
                <dt className="text-slate-500">LinkedIn</dt>
                <dd>
                  {candidate.linkedin_url ? (
                    <a href={candidate.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                      {candidate.linkedin_url}
                    </a>
                  ) : (
                    '–'
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Anteckningar</dt>
                <dd className="whitespace-pre-line">{candidate.notes ?? '–'}</dd>
              </div>
            </dl>
            <button onClick={() => setEditing(true)} className="mt-4 text-sm text-indigo-600 hover:underline">
              Redigera uppgifter
            </button>
          </>
        )}

        <section className="mt-8 border-t border-slate-200 pt-6">
          <h3 className="font-semibold">CV</h3>

          {candidate.cv_path ? (
            <button
              onClick={() => download.mutate()}
              disabled={download.isPending}
              className="mt-2 text-sm text-indigo-600 hover:underline disabled:opacity-50"
            >
              {download.isPending ? 'Öppnar…' : 'Öppna CV (PDF)'}
            </button>
          ) : (
            <p className="mt-2 text-sm text-slate-500">Inget CV uppladdat.</p>
          )}

          <label className="mt-3 block">
            <span className="inline-block cursor-pointer rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100">
              {upload.isPending ? 'Laddar upp…' : candidate.cv_path ? 'Ersätt CV' : 'Ladda upp CV'}
            </span>
            <input type="file" accept="application/pdf" onChange={handleFile} disabled={upload.isPending} className="hidden" />
          </label>

          {fileError && <p className="mt-2 text-sm text-red-600">{fileError}</p>}
          {upload.isError && <p className="mt-2 text-sm text-red-600">{upload.error.message}</p>}
          {download.isError && <p className="mt-2 text-sm text-red-600">Kunde inte öppna CV:t.</p>}
        </section>
        
                <section className="mt-8 border-t border-slate-200 pt-6">
          <h3 className="font-semibold">AI-bedömning</h3>

          <button
            onClick={() => score.mutate()}
            disabled={!candidate.cv_path || score.isPending}
            className="mt-2 rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {score.isPending ? 'Bedömer… (kan ta en halv minut)' : a ? 'Bedöm igen' : 'Bedöm CV'}
          </button>
          {!candidate.cv_path && <p className="mt-2 text-sm text-slate-500">Ladda upp ett CV först.</p>}
          {score.isError && <p className="mt-2 text-sm text-red-600">{score.error.message}</p>}

          {a && (
            <div className="mt-4 space-y-4 text-sm">
              <div className="flex items-center gap-3">
                <span className={`rounded-full px-3 py-1 text-lg font-semibold ${scoreColor(a.score)}`}>
                  {a.score}/10
                </span>
                <span className="text-slate-500">Säkerhet: {CONFIDENCE[a.confidence]}</span>
              </div>
              <p>{a.summary}</p>
              <AssessmentList title="Styrkor" items={a.strengths} />
              <AssessmentList title="Luckor" items={a.gaps} />
              <AssessmentList title="Frågor till intervjun" items={a.interview_questions} />
              <p className="text-xs text-slate-400">
                AI-genererat beslutsstöd, inte ett beslut. Modell: {a.model}, mall {a.prompt_version}.
              </p>
            </div>
          )}
        </section>

        <section className="mt-8 border-t border-slate-200 pt-6">
          <button
            onClick={() => {
              if (window.confirm(`Ta bort ${candidate.full_name}? Det går inte att ångra.`)) remove.mutate()
            }}
            disabled={remove.isPending}
            className="text-sm text-red-600 hover:underline disabled:opacity-50"
          >
            {remove.isPending ? 'Tar bort…' : 'Ta bort kandidat'}
          </button>
          {remove.isError && <p className="mt-2 text-sm text-red-600">Kunde inte ta bort kandidaten.</p>}
        </section>

      </aside>
    </div>
  )
}
