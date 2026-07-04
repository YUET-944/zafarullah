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
import { Badge } from '@/components/ui/badge';

export default function VisitsPage() {
  const [visits, setVisits] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchVisits() {
      setLoading(true);
      try {
        const res = await fetch(`/api/visits?search=${encodeURIComponent(search)}`);
        const json = await res.json();
        if (json.data) {
          setVisits(json.data);
        }
      } catch (err) {
        console.error('Error fetching visits', err);
      } finally {
        setLoading(false);
      }
    }
    const debounce = setTimeout(fetchVisits, 300);
    return () => clearTimeout(debounce);
  }, [search]);

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Visits</h2>
        <div className="flex items-center space-x-2">
          <Link href="/dashboard/visits/new">
            <Button>Register Visit</Button>
          </Link>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Input
          placeholder="Search by visit code or patient name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Visit Code</TableHead>
              <TableHead>Patient</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Tests Ordered</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : visits.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No visits found.
                </TableCell>
              </TableRow>
            ) : (
              visits.map((visit) => (
                <TableRow key={visit.id}>
                  <TableCell className="font-medium">{visit.visitCode}</TableCell>
                  <TableCell>{visit.patient?.firstName} {visit.patient?.lastName}</TableCell>
                  <TableCell>{new Date(visit.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>{visit._count?.testResults}</TableCell>
                  <TableCell>
                    <Badge variant={visit.status === 'COMPLETED' ? 'default' : 'secondary'}>
                      {visit.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Link href={`/dashboard/visits/${visit.id}/results`}>
                        <Button variant="outline" size="sm">
                          Enter Results
                        </Button>
                      </Link>
                      {visit.status === 'COMPLETED' && (
                        <a href={`/api/visits/${visit.id}/report`} target="_blank" rel="noreferrer">
                          <Button variant="default" size="sm">
                            Download Report
                          </Button>
                        </a>
                      )}
                    </div>
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
