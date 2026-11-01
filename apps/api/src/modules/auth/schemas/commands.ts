import { z } from 'zod';
const email = z.string().trim().toLowerCase().max(254).email();
export const registerSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    email,
    password: z.string().min(12).max(128),
  })
  .strict();
export const loginSchema = z.object({ email, password: z.string().min(1).max(128) }).strict();
