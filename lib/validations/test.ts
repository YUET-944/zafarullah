import { z } from 'zod';

export const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  description: z.string().optional(),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;

export const testSchema = z.object({
  categoryId: z.string().min(1, 'Category is required'),
  name: z.string().min(1, 'Test name is required'),
  code: z.string().min(1, 'Test code is required'),
  defaultPrice: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
    message: 'Valid default price is required',
  }),
  normalRange: z.string().optional(),
  unit: z.string().optional(),
});

export type TestFormValues = z.infer<typeof testSchema>;
