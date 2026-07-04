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

export default function TestsPage() {
  const [tests, setTests] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTests() {
      setLoading(true);
      try {
        const res = await fetch(`/api/tests?search=${encodeURIComponent(search)}`);
        const json = await res.json();
        if (json.data) {
          setTests(json.data);
        }
      } catch (err) {
        console.error('Error fetching tests', err);
      } finally {
        setLoading(false);
      }
    }
    const debounce = setTimeout(fetchTests, 300);
    return () => clearTimeout(debounce);
  }, [search]);

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Test Catalog</h2>
        <div className="flex items-center space-x-2">
          <Link href="/dashboard/categories/new">
            <Button variant="outline">Add Category</Button>
          </Link>
          <Link href="/dashboard/tests/new">
            <Button>Add Test</Button>
          </Link>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Input
          placeholder="Search by code or name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Default Price</TableHead>
              <TableHead>Reference Range</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : tests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No tests found.
                </TableCell>
              </TableRow>
            ) : (
              tests.map((test) => (
                <TableRow key={test.id}>
                  <TableCell className="font-medium">{test.code}</TableCell>
                  <TableCell>{test.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{test.category?.name}</Badge>
                  </TableCell>
                  <TableCell>${test.defaultPrice}</TableCell>
                  <TableCell>
                    {test.normalRange ? `${test.normalRange} ${test.unit || ''}` : 'N/A'}
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
