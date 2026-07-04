import Link from 'next/link';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="container flex h-16 items-center justify-between py-4">
          <div className="flex gap-6 md:gap-10">
            <Link href="/dashboard" className="hidden items-center space-x-2 md:flex">
              <span className="hidden font-bold sm:inline-block">
                Moon Light Diagnostic Center
              </span>
            </Link>
            <nav className="hidden gap-6 md:flex">
              <Link
                href="/dashboard/patients"
                className="flex items-center text-lg font-medium transition-colors hover:text-foreground/80 sm:text-sm"
              >
                Patients
              </Link>
              <Link
                href="/dashboard/tests"
                className="flex items-center text-lg font-medium transition-colors hover:text-foreground/80 sm:text-sm"
              >
                Tests Catalog
              </Link>
              <Link
                href="/dashboard/visits"
                className="flex items-center text-lg font-medium transition-colors hover:text-foreground/80 sm:text-sm"
              >
                Visits
              </Link>
              <Link
                href="/dashboard/billing"
                className="flex items-center text-lg font-medium transition-colors hover:text-foreground/80 sm:text-sm"
              >
                Billing
              </Link>
              <Link
                href="/dashboard/doctors"
                className="flex items-center text-lg font-medium transition-colors hover:text-foreground/80 sm:text-sm"
              >
                Referrals
              </Link>
              {session?.user?.role === 'ADMIN' && (
                <>
                  <Link
                    href="/dashboard/settings/users"
                    className="flex items-center text-lg font-medium transition-colors hover:text-foreground/80 sm:text-sm text-amber-600"
                  >
                    Staff Admin
                  </Link>
                  <Link
                    href="/dashboard/settings/audit-logs"
                    className="flex items-center text-lg font-medium transition-colors hover:text-foreground/80 sm:text-sm text-amber-600"
                  >
                    Audit Logs
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>
      <main className="flex-1 space-y-4 p-8 pt-6">
        {children}
      </main>
    </div>
  );
}
