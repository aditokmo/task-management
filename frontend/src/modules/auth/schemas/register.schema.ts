import { z } from 'zod';

export const registerSchema = z
    .object({
        name: z.string().min(2, 'Name must be at least 2 characters'),
        email: z.email('Please enter a valid email address'),
        password: z.string().min(8, 'Password must be at least 8 characters'),
        confirmPassword: z.string().min(8, 'Confirm your password'),
    })
    .refine((values) => values.password === values.confirmPassword, {
        path: ['confirmPassword'],
        message: 'Passwords do not match',
    });

export type RegisterFormValues = z.infer<typeof registerSchema>;
