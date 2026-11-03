export const STAGES = [
  { key: 'new', label: 'Ny' },
  { key: 'screening', label: 'Screening' },
  { key: 'interview', label: 'Intervju' },
  { key: 'offer', label: 'Erbjudande' },
  { key: 'hired', label: 'Anställd' },
  { key: 'closed', label: 'Avslutad' },
] as const

export type Stage = (typeof STAGES)[number]['key']
