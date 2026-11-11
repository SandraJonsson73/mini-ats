export function BoardSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Laddar kandidater"
      className="mt-6 grid animate-pulse grid-flow-col auto-cols-[minmax(10rem,1fr)] gap-3"
    >
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="min-h-48 rounded-xl bg-slate-100 p-2">
          <div className="mb-3 h-4 w-24 rounded bg-slate-200" />
          <div className="space-y-2">
            <div className="h-16 rounded-lg bg-slate-200" />
            {i % 2 === 0 && <div className="h-16 rounded-lg bg-slate-200" />}
          </div>
        </div>
      ))}
    </div>
  )
}

export function ListSkeleton() {
  return (
    <div aria-busy="true" aria-label="Laddar" className="mt-6 animate-pulse space-y-3">
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="h-4 w-1/3 rounded bg-slate-200" />
          <div className="mt-2 h-3 w-1/4 rounded bg-slate-100" />
        </div>
      ))}
    </div>
  )
}
