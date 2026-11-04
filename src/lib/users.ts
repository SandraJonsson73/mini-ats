import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { invokeFunction } from './functions'

export type Organization = { id: string; name: string }

export type UserRow = {
  id: string
  email: string
  full_name: string | null
  role: 'admin' | 'customer'
  organization_id: string | null
}

export type CreateUserInput = {
  email: string
  full_name: string
  role: 'admin' | 'customer'
  organization_id?: string
  new_organization_name?: string
}

export type CreateUserResult = {
  user_id: string
  email: string
  password: string
  organization_id: string | null
}

export async function fetchOrganizations() {
  const { data, error } = await supabase.from('organizations').select('id, name').order('name')
  if (error) throw error
  return data as Organization[]
}

export async function fetchUsers() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, organization_id')
    .order('email')
  if (error) throw error
  return data as UserRow[]
}

export async function createUser(input: CreateUserInput) {
  const { data, error } = await supabase.functions.invoke<CreateUserResult>('admin-create-user', {
    body: input,
  })
  if (error) {
    // Vid fel (403, 400 …) ligger funktionens meddelande i error.context
    let message = error.message
    if (error instanceof FunctionsHttpError) {
      const body = await error.context.json().catch(() => null)
      if (body?.error) message = body.error
    }
    throw new Error(message)
  }
  return data!
}

export async function deleteUser(userId: string) {
  await invokeFunction<{ ok: boolean }>('admin-delete-user', { user_id: userId })
}

