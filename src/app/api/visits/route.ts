import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { visitSchema } from '@/lib/validations/visit';
import { generateVisitCode } from '@/lib/utils/generateVisitCode';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';

    const where = search
      ? {
          OR: [
            { visitCode: { contains: search, mode: 'insensitive' as const } },
            { patient: { fullName: { contains: search, mode: 'insensitive' as const } } },
          ],
        }
      : {};

    const visits = await prisma.visit.findMany({
      where,
      include: {
        patient: true,
        doctor: true,
        _count: {
          select: { visitTests: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ data: visits });
  } catch (error) {
    console.error('Error fetching visits:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = visitSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.format() }, { status: 400 });
    }

    const data = parsed.data;

    // Fetch prices of the selected tests to calculate the total
    const tests = await prisma.test.findMany({
      where: { id: { in: data.testIds } },
    });

    if (tests.length !== data.testIds.length) {
      return NextResponse.json({ error: 'One or more invalid tests selected' }, { status: 400 });
    }

    let totalAmount = 0;
    for (const t of tests) {
      totalAmount += Number(t.price);
    }

    const visitCode = await generateVisitCode();

    const visit = await prisma.$transaction(async (tx) => {
      const newVisit = await tx.visit.create({
        data: {
          visitCode,
          patientId: data.patientId,
          doctorId: data.referringDoctorId || null,
          totalAmount,
        },
      });

      // Create empty test results for the ordered tests
      const testResultsData = tests.map(t => ({
        visitId: newVisit.id,
        testId: t.id,
        resultStatus: 'PENDING' as const,
      }));

      await tx.visitTest.createMany({
        data: testResultsData,
      });

      return newVisit;
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'CREATE',
        entity: 'Visit',
        entityId: visit.id,
        details: JSON.stringify({ visitCode: visit.visitCode, tests: data.testIds.length }),
      },
    });

    return NextResponse.json({ data: visit }, { status: 201 });
  } catch (error) {
    console.error('Error creating visit:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
