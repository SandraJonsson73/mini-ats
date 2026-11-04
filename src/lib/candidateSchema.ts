import { z } from 'zod'

export const candidateSchema = z.object({
  full_name: z.string().trim().min(1, 'Namn krävs'),
  job_id: z.string().min(1, 'Välj ett jobb'),
  email: z
    .string()
    .trim()
    .refine((v) => v === '' || /^\S+@\S+\.\S+$/.test(v), 'Ogiltig e-postadress'),
  phone: z.string().trim(),
  linkedin_url: z
    .string()
    .trim()
    .refine(
      (v) => v === '' || /^https?:\/\/([\w-]+\.)?linkedin\.com\/\S+$/i.test(v),
      'Ange en länk som börjar med https:// och innehåller linkedin.com/',
    ),
  notes: z.string().trim(),
})

export type CandidateForm = z.infer<typeof candidateSchema>
