import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { expenditureSchema } from '@/lib/validations/billing';
import { Prisma } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const expenditures = await prisma.expenditure.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ data: expenditures });
  } catch (error) {
    console.error('Error fetching expenditures:', error);
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
    const parsed = expenditureSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.format() }, { status: 400 });
    }

    const data = parsed.data;

    const expenditure = await prisma.expenditure.create({
      data: {
        category: data.category,
        amount: new Prisma.Decimal(data.amount),
        description: data.description || '',
        recordedById: session.user.id,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'CREATE',
        entity: 'Expenditure',
        entityId: expenditure.id,
        details: JSON.stringify({ amount: data.amount, category: data.category }),
      },
    });

    return NextResponse.json({ data: expenditure }, { status: 201 });
  } catch (error) {
    console.error('Error creating expenditure:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
