'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { DoctorFormValues, doctorSchema } from '@/lib/validations/doctor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function NewDoctorPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DoctorFormValues>({
    resolver: zodResolver(doctorSchema),
  });

  const onSubmit = async (data: DoctorFormValues) => {
    setError('');
    try {
      const res = await fetch('/api/doctors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Failed to register doctor');
      }

      router.push('/dashboard/doctors');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Register Referring Doctor</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && <div className="text-sm font-medium text-destructive">{error}</div>}
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Doctor Name</label>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground font-semibold">Dr.</span>
                <Input {...register('name')} placeholder="e.g. John Doe" />
              </div>
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Clinic Name (Optional)</label>
              <Input {...register('clinicName')} placeholder="e.g. City Hospital" />
              {errors.clinicName && <p className="text-xs text-destructive">{errors.clinicName.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Contact Info (Optional)</label>
              <Input {...register('contactInfo')} placeholder="e.g. 555-0199" />
              {errors.contactInfo && <p className="text-xs text-destructive">{errors.contactInfo.message}</p>}
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.push('/dashboard/doctors')}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Registering...' : 'Register Doctor'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
