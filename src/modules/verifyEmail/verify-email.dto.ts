import { z } from 'zod';

export const emailParamSchema = z.object({
  params: z.object({ email: z.string().email() })
});

export const verifyEmailBodySchema = z.object({
  body: z.object({
    redirectUri: z.string().url().optional(),
    clientId: z.string().optional()
  })
});
