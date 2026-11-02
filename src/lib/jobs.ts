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
