'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDoctors() {
      setLoading(true);
      try {
        const res = await fetch(`/api/doctors?search=${encodeURIComponent(search)}`);
        const json = await res.json();
        if (json.data) {
          setDoctors(json.data);
        }
      } catch (err) {
        console.error('Error fetching doctors', err);
      } finally {
        setLoading(false);
      }
    }
    const debounce = setTimeout(fetchDoctors, 300);
    return () => clearTimeout(debounce);
  }, [search]);

  // Aggregate totals
  const totalVisits = doctors.reduce((acc, doc) => acc + (doc._count?.visits || 0), 0);
  const totalRevenue = doctors.reduce((acc, doc) => acc + Number(doc.totalRevenue), 0);

  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Referral Analytics</h2>
        <Link href="/dashboard/doctors/new">
          <Button>Register Doctor</Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Referred Visits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalVisits}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue Generated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${totalRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center space-x-2">
        <Input
          placeholder="Search by name or clinic..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Doctor Name</TableHead>
              <TableHead>Clinic</TableHead>
              <TableHead>Contact Info</TableHead>
              <TableHead>Referred Visits</TableHead>
              <TableHead>Revenue Generated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : doctors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No referring doctors found.
                </TableCell>
              </TableRow>
            ) : (
              doctors.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium">Dr. {doc.fullName}</TableCell>
                  <TableCell>{doc.clinicName || '-'}</TableCell>
                  <TableCell>{doc.phone || '-'}</TableCell>
                  <TableCell>{doc._count?.visits}</TableCell>
                  <TableCell className="text-green-600 font-semibold">
                    ${Number(doc.totalRevenue).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
