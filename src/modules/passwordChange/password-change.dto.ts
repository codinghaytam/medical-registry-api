import { z } from 'zod';

export const passwordChangeSchema = z.object({
  params: z.object({ email: z.string().email() }),
  body: z.object({
    newPassword: z.string().min(6)
  })
});
