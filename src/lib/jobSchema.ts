import { z } from 'zod'

export const jobSchema = z.object({
  title: z.string().trim().min(1, 'Titel krävs'),
  location: z.string().trim(),
  description: z.string().trim(),
})
export type JobForm = z.infer<typeof jobSchema>
