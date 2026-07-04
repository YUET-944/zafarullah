import { z } from 'zod';

export const paymentSchema = z.object({
  visitId: z.string().min(1, 'Visit is required'),
  amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: 'Valid positive amount is required',
  }),
  method: z.string().min(1, 'Payment method is required'),
});

export type PaymentFormValues = z.infer<typeof paymentSchema>;

export const expenditureSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: 'Valid positive amount is required',
  }),
  description: z.string().optional(),
});

export type ExpenditureFormValues = z.infer<typeof expenditureSchema>;
