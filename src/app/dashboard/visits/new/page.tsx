'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { VisitFormValues, visitSchema } from '@/lib/validations/visit';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function NewVisitPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  
  const [patients, setPatients] = useState<any[]>([]);
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<VisitFormValues>({
    resolver: zodResolver(visitSchema),
    defaultValues: {
      testIds: [],
    },
  });

  const selectedTestIds = watch('testIds');

  useEffect(() => {
    async function fetchData() {
      try {
        const [patientsRes, testsRes] = await Promise.all([
          fetch('/api/patients?limit=100'),
          fetch('/api/tests')
        ]);
        const pJson = await patientsRes.json();
        const tJson = await testsRes.json();
        if (pJson.data) setPatients(pJson.data);
        if (tJson.data) setTests(tJson.data);
      } catch (err) {
        console.error('Failed to load form data', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const toggleTest = (testId: string) => {
    const current = selectedTestIds || [];
    if (current.includes(testId)) {
      setValue('testIds', current.filter(id => id !== testId), { shouldValidate: true });
    } else {
      setValue('testIds', [...current, testId], { shouldValidate: true });
    }
  };

  const onSubmit = async (data: VisitFormValues) => {
    setError('');
    try {
      const res = await fetch('/api/visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Failed to create visit');
      }

      toast.success('Visit registered successfully!');
      router.push('/dashboard/visits');
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const calculatedTotal = selectedTestIds?.reduce((total, id) => {
    const test = tests.find(t => t.id === id);
    return total + (test ? Number(test.defaultPrice) : 0);
  }, 0) || 0;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Register New Visit</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Loading data...</div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {error && <div className="text-sm font-medium text-destructive">{error}</div>}
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Patient</label>
                <select 
                  {...register('patientId')} 
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">-- Choose a Patient --</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>{p.firstName} {p.lastName} ({p.patientCode})</option>
                  ))}
                </select>
                {errors.patientId && <p className="text-xs text-destructive">{errors.patientId.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Order Tests</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2 max-h-60 overflow-y-auto p-2 border rounded-md">
                  {tests.map(test => {
                    const isSelected = selectedTestIds.includes(test.id);
                    return (
                      <div 
                        key={test.id}
                        onClick={() => toggleTest(test.id)}
                        className={`cursor-pointer p-2 rounded-md border text-sm transition-colors ${isSelected ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-muted'}`}
                      >
                        <div className="font-semibold">{test.code}</div>
                        <div className="text-xs truncate">{test.name}</div>
                        <div className="text-xs mt-1 font-mono">${test.defaultPrice}</div>
                      </div>
                    )
                  })}
                </div>
                {errors.testIds && <p className="text-xs text-destructive">{errors.testIds.message}</p>}
              </div>

              <div className="flex items-center justify-between p-4 bg-muted rounded-md">
                <span className="font-semibold">Total Estimated Bill:</span>
                <span className="text-2xl font-bold">${calculatedTotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => router.push('/dashboard/visits')}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Registering...' : 'Complete Registration'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
