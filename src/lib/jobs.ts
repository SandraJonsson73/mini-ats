import { supabase } from './supabase'

export type Job = {
  id: string
  organization_id: string
  title: string
  description: string | null
  location: string | null
  status: 'open' | 'closed'
  created_at: string
}

export type CreateJobInput = {
  organization_id: string
  title: string
  description: string
  location: string
}

export async function fetchJobs(organizationId: string) {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as Job[]
}

export async function createJob(input: CreateJobInput) {
  const { error } = await supabase.from('jobs').insert({
    organization_id: input.organization_id,
    title: input.title,
    description: input.description || null,
    location: input.location || null,
  })
  if (error) throw error
}

export async function setJobStatus(id: string, status: Job['status']) {
  const { error } = await supabase.from('jobs').update({ status }).eq('id', id)
  if (error) throw error
}

export type UpdateJobInput = {
  title: string
  description: string
  location: string
}

export async function updateJob(id: string, input: UpdateJobInput) {
  const { error } = await supabase
    .from('jobs')
    .update({
      title: input.title,
      description: input.description || null,
      location: input.location || null,
    })
    .eq('id', id)
  if (error) throw error
}

export async function deleteJob(jobId: string) {
  // Hämta CV-filerna först. De försvinner inte automatiskt när kandidaterna tas bort.
  const { data: candidates, error: fetchError } = await supabase
    .from('candidates')
    .select('cv_path')
    .eq('job_id', jobId)
  if (fetchError) throw fetchError

  // Kandidaterna följer med automatiskt (on delete cascade)
  const { error } = await supabase.from('jobs').delete().eq('id', jobId)
  if (error) throw error

  const paths = (candidates ?? []).map((c) => c.cv_path).filter((p): p is string => !!p)
  if (paths.length > 0) await supabase.storage.from('cvs').remove(paths)
}
