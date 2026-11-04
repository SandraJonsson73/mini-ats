import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from './supabase'

export async function invokeFunction<T>(name: string, body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke<T>(name, { body })
  if (error) {
    // Vid fel (401, 404, 429 …) ligger funktionens meddelande i error.context
    let message = error.message
    if (error instanceof FunctionsHttpError) {
      const payload = await error.context.json().catch(() => null)
      if (payload?.error) message = payload.error
    }
    throw new Error(message)
  }
  return data as T
}
