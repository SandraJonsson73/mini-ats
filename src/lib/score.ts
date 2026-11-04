export function scoreColor(score: number) {
  if (score >= 7) return 'bg-green-100 text-green-700'
  if (score >= 4) return 'bg-amber-100 text-amber-700'
  return 'bg-red-100 text-red-700'
}
