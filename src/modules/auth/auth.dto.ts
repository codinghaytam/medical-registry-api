import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    username: z.string().min(1, 'Username or email is required'),
    password: z.string().min(1, 'Password is required')
  })
});

export const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(10, 'Refresh token is required')
  })
});

export const logoutSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(10, 'Refresh token is required')
  })
});

export const signupSchema = z.object({
  body: z.object({
    username: z.string().min(3),
    email: z.string().email(),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    password: z.string().min(6),
    phone: z.string().optional()
  })
});

export type LoginBody = z.infer<typeof loginSchema>['body'];
export type RefreshBody = z.infer<typeof refreshSchema>['body'];
export type LogoutBody = z.infer<typeof logoutSchema>['body'];
export type SignupBody = z.infer<typeof signupSchema>['body'];
