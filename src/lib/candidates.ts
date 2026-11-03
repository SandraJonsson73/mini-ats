import { supabase } from './supabase'
import type { Stage } from './stages'

export type Candidate = {
  id: string
  organization_id: string
  job_id: string
  full_name: string
  email: string | null
  phone: string | null
  linkedin_url: string | null
  cv_path: string | null
  notes: string | null
  stage: Stage
  position: number
  ai_score: number | null
  created_at: string
}

export type CreateCandidateInput = {
  organization_id: string
  job_id: string
  full_name: string
  email: string
  phone: string
  linkedin_url: string
  notes: string
}

export async function fetchCandidates(organizationId: string) {
  const { data, error } = await supabase
    .from('candidates')
    .select('*')
    .eq('organization_id', organizationId)
    .order('position')
  if (error) throw error
  return data as Candidate[]
}

export async function createCandidate(input: CreateCandidateInput) {
  const { error } = await supabase.from('candidates').insert({
    organization_id: input.organization_id,
    job_id: input.job_id,
    full_name: input.full_name,
    email: input.email || null,
    phone: input.phone || null,
    linkedin_url: input.linkedin_url || null,
    notes: input.notes || null,
    stage: 'new',
    // Tidsstämpel som startposition: nya kandidater hamnar sist i kolumnen
    position: Date.now(),
  })
  if (error) throw error
}

export async function moveCandidate(id: string, stage: Stage, position: number) {
  const { error } = await supabase.from('candidates').update({ stage, position }).eq('id', id)
  if (error) throw error
}

export async function uploadCv(candidate: Candidate, file: File) {
  // Mappen är organisationens id. Storage-policyn i 0002 kontrollerar det.
  const path = `${candidate.organization_id}/${candidate.id}.pdf`

  const { error } = await supabase.storage
    .from('cvs')
    .upload(path, file, { upsert: true, contentType: 'application/pdf' })
  if (error) throw error

  // Ett nytt CV gör en tidigare AI-bedömning inaktuell, så den rensas
  const { error: updateError } = await supabase
    .from('candidates')
    .update({ cv_path: path, ai_score: null, ai_assessment: null, ai_scored_at: null })
    .eq('id', candidate.id)
  if (updateError) throw updateError
}

// Privat bucket: nedladdning sker via en tillfällig länk (giltig i 60 sekunder)
export async function getCvUrl(path: string) {
  const { data, error } = await supabase.storage.from('cvs').createSignedUrl(path, 60)
  if (error) throw error
  return data.signedUrl
}
