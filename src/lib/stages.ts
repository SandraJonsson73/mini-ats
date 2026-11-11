export const STAGES = [
  { key: 'new', label: 'Ny', dot: 'bg-slate-400' },
  { key: 'screening', label: 'Screening', dot: 'bg-sky-500' },
  { key: 'interview', label: 'Intervju', dot: 'bg-violet-500' },
  { key: 'offer', label: 'Erbjudande', dot: 'bg-amber-500' },
  { key: 'hired', label: 'Anställd', dot: 'bg-green-500' },
  { key: 'closed', label: 'Avslutad', dot: 'bg-red-400' },
] as const

export type Stage = (typeof STAGES)[number]['key']
