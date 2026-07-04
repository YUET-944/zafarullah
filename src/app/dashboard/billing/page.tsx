'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
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
import { Badge } from '@/components/ui/badge';
import { useSession } from 'next-auth/react';

export default function BillingPage() {
  const { data: session } = useSession();
  const [payments, setPayments] = useState<any[]>([]);
  const [expenditures, setExpenditures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [payRes, expRes] = await Promise.all([
          fetch('/api/payments'),
          session?.user?.role === 'ADMIN' ? fetch('/api/expenditures') : Promise.resolve(null),
        ]);
        
        const payJson = await payRes.json();
        if (payJson.data) setPayments(payJson.data);

        if (expRes) {
          const expJson = await expRes.json();
          if (expJson.data) setExpenditures(expJson.data);
        }
      } catch (err) {
        console.error('Error fetching billing data', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [session]);

  const totalRevenue = payments.reduce((acc, curr) => acc + Number(curr.amount), 0);
  const totalExpenses = expenditures.reduce((acc, curr) => acc + Number(curr.amount), 0);

  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Billing Dashboard</h2>
        <div className="flex items-center space-x-2">
          {session?.user?.role === 'ADMIN' && (
            <Link href="/dashboard/billing/expenditures/new">
              <Button variant="outline">Log Expenditure</Button>
            </Link>
          )}
          <Link href="/dashboard/billing/payments/new">
            <Button>Record Payment</Button>
          </Link>
        </div>
      </div>

      {session?.user?.role === 'ADMIN' && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">+${totalRevenue.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Expenditures</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">-${totalExpenses.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Income</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${totalRevenue - totalExpenses >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${(totalRevenue - totalExpenses).toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Payments</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-sm">Loading...</div>
            ) : payments.length === 0 ? (
              <div className="text-sm">No recent payments.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Visit Code</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map(payment => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">{payment.visit?.visitCode}</TableCell>
                      <TableCell>${payment.amount}</TableCell>
                      <TableCell><Badge variant="secondary">{payment.method}</Badge></TableCell>
                      <TableCell>{new Date(payment.createdAt).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {session?.user?.role === 'ADMIN' && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Expenditures</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-sm">Loading...</div>
              ) : expenditures.length === 0 ? (
                <div className="text-sm">No recent expenditures.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenditures.map(exp => (
                      <TableRow key={exp.id}>
                        <TableCell className="font-medium">{exp.category}</TableCell>
                        <TableCell>{exp.description || '-'}</TableCell>
                        <TableCell className="text-red-600">-${exp.amount}</TableCell>
                        <TableCell>{new Date(exp.createdAt).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
