'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PaymentFormValues, paymentSchema } from '@/lib/validations/billing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function NewPaymentPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [visits, setVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
  });

  const selectedVisitId = watch('visitId');

  useEffect(() => {
    async function fetchVisits() {
      try {
        // Fetch all visits to allow picking which to pay for.
        const res = await fetch('/api/visits?limit=100');
        const json = await res.json();
        if (json.data) {
          setVisits(json.data);
        }
      } catch (err) {
        console.error('Failed to load visits', err);
      } finally {
        setLoading(false);
      }
    }
    fetchVisits();
  }, []);

  // When a visit is selected, default the amount to the totalAmount of the visit
  useEffect(() => {
    if (selectedVisitId && visits.length > 0) {
      const visit = visits.find(v => v.id === selectedVisitId);
      if (visit) {
        setValue('amount', visit.totalAmount.toString());
      }
    }
  }, [selectedVisitId, visits, setValue]);

  const onSubmit = async (data: PaymentFormValues) => {
    setError('');
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Failed to record payment');
      }

      toast.success('Payment recorded successfully!');
      router.push('/dashboard/billing');
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Record Payment</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && <div className="text-sm font-medium text-destructive">{error}</div>}
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Visit</label>
              <select 
                {...register('visitId')} 
                disabled={loading}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">-- Choose a Visit --</option>
                {visits.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.visitCode} - {v.patient?.firstName} {v.patient?.lastName} (Bill: ${v.totalAmount})
                  </option>
                ))}
              </select>
              {errors.visitId && <p className="text-xs text-destructive">{errors.visitId.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Amount ($)</label>
                <Input type="number" step="0.01" {...register('amount')} placeholder="0.00" />
                {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Payment Method</label>
                <select 
                  {...register('method')} 
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">Select Method</option>
                  <option value="CASH">Cash</option>
                  <option value="CARD">Credit/Debit Card</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                </select>
                {errors.method && <p className="text-xs text-destructive">{errors.method.message}</p>}
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.push('/dashboard/billing')}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Recording...' : 'Record Payment'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
