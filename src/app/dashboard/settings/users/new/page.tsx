'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UserFormValues, userSchema } from '@/lib/validations/user';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function NewUserPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      role: 'RECEPTIONIST',
    }
  });

  const onSubmit = async (data: UserFormValues) => {
    setError('');
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Failed to register user');
      }

      toast.success('User registered successfully!');
      router.push('/dashboard/settings/users');
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Register Staff Account</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && <div className="text-sm font-medium text-destructive">{error}</div>}
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Full Name</label>
              <Input {...register('name')} placeholder="e.g. Jane Doe" />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Email Address</label>
              <Input type="email" {...register('email')} placeholder="jane@example.com" />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Temporary Password</label>
              <Input type="password" {...register('password')} />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">System Role</label>
              <select 
                {...register('role')} 
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="RECEPTIONIST">Receptionist</option>
                <option value="TECHNOLOGIST">Technologist</option>
                <option value="ADMIN">Administrator (Full Access)</option>
              </select>
              {errors.role && <p className="text-xs text-destructive">{errors.role.message}</p>}
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.push('/dashboard/settings/users')}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Registering...' : 'Register Account'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
