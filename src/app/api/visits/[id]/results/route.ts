import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { testResultSchema } from '@/lib/validations/visit';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const visitId = params.id;
    const visit = await prisma.visit.findUnique({
      where: { id: visitId },
      include: {
        patient: true,
        testResults: {
          include: {
            test: true,
          }
        }
      }
    });

    if (!visit) {
      return NextResponse.json({ error: 'Visit not found' }, { status: 404 });
    }

    return NextResponse.json({ data: visit });
  } catch (error) {
    console.error('Error fetching visit results:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const visitId = params.id;
    const body = await req.json();
    const parsed = testResultSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.format() }, { status: 400 });
    }

    const { results } = parsed.data;

    await prisma.$transaction(async (tx) => {
      for (const res of results) {
        await tx.testResult.update({
          where: { id: res.id },
          data: {
            value: res.value || null,
            remarks: res.remarks || null,
            status: res.value ? 'COMPLETED' : 'PENDING',
          }
        });
      }

      // Check if all results are completed to update visit status
      const remainingPending = await tx.testResult.count({
        where: {
          visitId,
          status: 'PENDING',
        }
      });

      if (remainingPending === 0) {
        await tx.visit.update({
          where: { id: visitId },
          data: { status: 'COMPLETED' }
        });
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE',
        entity: 'TestResult',
        entityId: visitId, // using visitId as the grouping context
        details: JSON.stringify({ updatedResults: results.length }),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating results:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
