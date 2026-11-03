import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, type ChangeEvent } from 'react'
import { getCvUrl, uploadCv, type Candidate } from '../lib/candidates'
import { STAGES } from '../lib/stages'

const MAX_SIZE = 5 * 1024 * 1024 // 5 MB, samma gräns som bucketen

type Props = {
  candidate: Candidate
  jobTitle: string
  onClose: () => void
}

export default function CandidateDrawer({ candidate, jobTitle, onClose }: Props) {
  const queryClient = useQueryClient()
  const [fileError, setFileError] = useState<string | null>(null)

  const upload = useMutation({
    mutationFn: (file: File) => uploadCv(candidate, file),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['candidates', candidate.organization_id] }),
  })

  const download = useMutation({
    mutationFn: () => getCvUrl(candidate.cv_path!),
    onSuccess: (url) => window.open(url, '_blank', 'noopener'),
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
    <div className="fixed inset-0 z-10 flex justify-end bg-black/40" onClick={onClose}>
      <aside
        onClick={(e) => e.stopPropagation()}
        className="h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">{candidate.full_name}</h2>
            <p className="text-sm text-slate-500">
              {jobTitle} · {stageLabel}
            </p>
          </div>
          <button onClick={onClose} aria-label="Stäng" className="text-2xl leading-none text-slate-400 hover:text-slate-700">
            ×
          </button>
        </div>

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
      </aside>
    </div>
  )
}
