'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TestResultFormValues, testResultSchema } from '@/lib/validations/visit';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function ResultEntryPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [visit, setVisit] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TestResultFormValues>({
    resolver: zodResolver(testResultSchema),
    defaultValues: { results: [] }
  });

  useEffect(() => {
    async function fetchVisit() {
      try {
        const res = await fetch(`/api/visits/${params.id}/results`);
        const json = await res.json();
        if (json.data) {
          setVisit(json.data);
          reset({
            results: json.data.testResults.map((tr: any) => ({
              id: tr.id,
              value: tr.value || '',
              remarks: tr.remarks || '',
            }))
          });
        }
      } catch (err) {
        console.error('Error fetching visit', err);
      } finally {
        setLoading(false);
      }
    }
    fetchVisit();
  }, [params.id, reset]);

  const onSubmit = async (data: TestResultFormValues) => {
    setError('');
    try {
      const res = await fetch(`/api/visits/${params.id}/results`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Failed to update results');
      }

      router.push('/dashboard/visits');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!visit) return <div>Visit not found.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Enter Results</h2>
        <Button variant="outline" onClick={() => router.push('/dashboard/visits')}>Back to Visits</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Patient: {visit.patient.firstName} {visit.patient.lastName} ({visit.visitCode})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && <div className="text-sm font-medium text-destructive">{error}</div>}
            
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Test Code</TableHead>
                    <TableHead>Test Name</TableHead>
                    <TableHead>Result Value</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Reference Range</TableHead>
                    <TableHead>Remarks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visit.testResults.map((tr: any, index: number) => (
                    <TableRow key={tr.id}>
                      <TableCell className="font-medium">{tr.test.code}</TableCell>
                      <TableCell>{tr.test.name}</TableCell>
                      <TableCell>
                        <input type="hidden" {...register(`results.${index}.id`)} />
                        <Input 
                          {...register(`results.${index}.value`)} 
                          placeholder="Enter value" 
                          className="w-32"
                        />
                        {errors?.results?.[index]?.value && (
                          <span className="text-xs text-destructive">Error</span>
                        )}
                      </TableCell>
                      <TableCell>{tr.test.unit || '-'}</TableCell>
                      <TableCell>{tr.test.normalRange || '-'}</TableCell>
                      <TableCell>
                        <Input 
                          {...register(`results.${index}.remarks`)} 
                          placeholder="Optional remarks" 
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Results'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
