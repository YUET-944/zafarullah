import { z } from 'zod';

export const visitSchema = z.object({
  patientId: z.string().min(1, 'Patient is required'),
  referringDoctorId: z.string().optional().or(z.literal('')),
  testIds: z.array(z.string()).min(1, 'At least one test must be ordered'),
});

export type VisitFormValues = z.infer<typeof visitSchema>;

export const testResultSchema = z.object({
  results: z.array(z.object({
    id: z.string(),
    value: z.string().optional().or(z.literal('')),
    remarks: z.string().optional().or(z.literal('')),
  })),
});

export type TestResultFormValues = z.infer<typeof testResultSchema>;
