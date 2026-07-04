'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function PatientDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPatient() {
      try {
        const res = await fetch(`/api/patients/${params.id}`);
        const json = await res.json();
        if (json.data) {
          setPatient(json.data);
        }
      } catch (err) {
        console.error('Error fetching patient:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchPatient();
  }, [params.id]);

  if (loading) {
    return <div>Loading patient details...</div>;
  }

  if (!patient) {
    return <div>Patient not found.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">
          {patient.firstName} {patient.lastName}
        </h2>
        <Button onClick={() => router.push('/dashboard/patients')}>Back to List</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Patient Code</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{patient.patientCode}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contact Info</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              Phone: {patient.phone || 'N/A'}<br/>
              Email: {patient.email || 'N/A'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Demographics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              DOB: {new Date(patient.dateOfBirth).toLocaleDateString()}<br/>
              Gender: {patient.gender}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Visit History</CardTitle>
        </CardHeader>
        <CardContent>
          {patient.visits && patient.visits.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Visit Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patient.visits.map((visit: any) => (
                  <TableRow key={visit.id}>
                    <TableCell>{new Date(visit.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>{visit.status}</TableCell>
                    <TableCell>${visit.totalAmount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-sm text-muted-foreground">No visits recorded yet.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
