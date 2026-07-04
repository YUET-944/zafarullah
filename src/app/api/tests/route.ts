import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { testSchema } from '@/lib/validations/test';
import { Prisma } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const categoryId = searchParams.get('categoryId');

    const where: any = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            // Test 'code' is not in DB, so we remove it from the OR query
          ],
        }
      : {};

    if (categoryId) {
      where.categoryId = categoryId;
    }

    const tests = await prisma.test.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ data: tests });
  } catch (error) {
    console.error('Error fetching tests:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = testSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.format() }, { status: 400 });
    }

    const data = parsed.data;

    const test = await prisma.test.create({
      data: {
        name: data.name,
        price: new Prisma.Decimal(data.defaultPrice),
        refRangeText: data.normalRange,
        unit: data.unit,
        categoryId: data.categoryId,
        turnaroundHours: 24,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'CREATE',
        entity: 'Test',
        entityId: test.id,
        details: JSON.stringify({ name: test.name, price: data.defaultPrice }),
      },
    });

    return NextResponse.json({ data: test }, { status: 201 });
  } catch (error) {
    console.error('Error creating test:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
