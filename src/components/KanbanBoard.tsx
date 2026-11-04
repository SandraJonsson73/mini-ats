import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { useState } from 'react'
import type { Candidate } from '../lib/candidates'
import { STAGES, type Stage } from '../lib/stages'
import { scoreColor } from '../lib/score'

type Props = {
  candidates: Candidate[]
  jobTitle: (jobId: string) => string
  onMove: (candidate: Candidate, stage: Stage) => void
  onOpen: (candidate: Candidate) => void
}

function CardBody({ candidate, jobTitle }: { candidate: Candidate; jobTitle: string }) {
  return (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 break-words font-medium">{candidate.full_name}</p>
        {candidate.ai_score !== null && (
          <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-xs font-semibold ${scoreColor(candidate.ai_score)}`}>
            {candidate.ai_score}
          </span>
        )}
      </div>
      <p className="truncate text-xs text-slate-500">{jobTitle}</p>
      {candidate.linkedin_url && (
        <a
          href={candidate.linkedin_url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-xs text-indigo-600 hover:underline"
        >
          LinkedIn
        </a>
      )}
    </>
  )
}

function DraggableCard({
  candidate,
  jobTitle,
  onOpen,
}: {
  candidate: Candidate
  jobTitle: string
  onOpen: () => void
}) {

const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: candidate.id })

  return (
    <div
      ref={setNodeRef}
      onClick={onOpen}
      {...listeners}
      {...attributes}
      className={`cursor-grab rounded-lg bg-white p-2.5 text-sm shadow-sm ${isDragging ? 'opacity-40' : ''}`}
    >
      <CardBody candidate={candidate} jobTitle={jobTitle} />
    </div>
  )
}

function Column({ label, stage, count, children }: { label: string; stage: Stage; count: number; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage })

  return (
    <section
      ref={setNodeRef}
      className={`min-h-48 min-w-0 rounded-xl p-2 transition-colors ${isOver ? 'bg-indigo-100' : 'bg-slate-100'}`}
    >
      <h2 className="px-1 pb-2 text-sm font-semibold text-slate-600">
        {label} <span className="font-normal text-slate-400">{count}</span>
      </h2>
      <div className="space-y-2">{children}</div>
    </section>
  )
}

export default function KanbanBoard({ candidates, jobTitle, onMove, onOpen }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null)
  // Dra först efter 6 px, så att vanliga klick (t.ex. på LinkedIn-länken) fungerar
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))
  const active = candidates.find((c) => c.id === activeId) ?? null

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null)
    const candidate = candidates.find((c) => c.id === event.active.id)
    const target = event.over?.id as Stage | undefined
    if (candidate && target && target !== candidate.stage) onMove(candidate, target)
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={(e) => setActiveId(String(e.active.id))}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="grid grid-flow-col auto-cols-[minmax(10rem,1fr)] gap-3 overflow-x-auto pb-4">
        {STAGES.map((stage) => {
          const items = candidates.filter((c) => c.stage === stage.key)
          return (
            <Column key={stage.key} stage={stage.key} label={stage.label} count={items.length}>
              {items.map((c) => (
                <DraggableCard 
                key={c.id} 
                candidate={c} 
                jobTitle={jobTitle(c.job_id)} 
                onOpen={() => onOpen(c)} 
                />
              ))}
            </Column>
          )
        })}
      </div>

      <DragOverlay>
        {active && (
          <div className="cursor-grabbing rounded-lg bg-white p-2.5 text-sm shadow-lg">
            <CardBody candidate={active} jobTitle={jobTitle(active.job_id)} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
