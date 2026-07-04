import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { doctorSchema } from '@/lib/validations/doctor';

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
            { fullName: { contains: search, mode: 'insensitive' as const } },
            { clinicName: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    // Get all doctors with their visit count
    const doctors = await prisma.doctor.findMany({
      where,
      include: {
        _count: {
          select: { visits: true }
        }
      },
      orderBy: { fullName: 'asc' },
    });

    // We also need the sum of totalAmount for their visits.
    // Since Prisma aggregate doesn't easily group by doctorId within a simple findMany relation,
    // we'll fetch the grouping and map it.
    const revenueGroups = await prisma.visit.groupBy({
      by: ['doctorId'],
      _sum: {
        totalAmount: true,
      },
      where: {
        doctorId: { not: null }
      }
    });

    const revenueMap = new Map();
    for (const group of revenueGroups) {
      if (group.doctorId) {
        revenueMap.set(group.doctorId, group._sum.totalAmount || 0);
      }
    }

    const doctorsWithAnalytics = doctors.map(doc => ({
      ...doc,
      totalRevenue: revenueMap.get(doc.id) || 0,
    }));

    return NextResponse.json({ data: doctorsWithAnalytics });
  } catch (error) {
    console.error('Error fetching doctors:', error);
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
    const parsed = doctorSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.format() }, { status: 400 });
    }

    const data = parsed.data;
    const doctor = await prisma.doctor.create({
      data: {
        fullName: data.name,
        phone: data.contactInfo,
        clinicName: data.clinicName,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'CREATE',
        entity: 'ReferringDoctor',
        entityId: doctor.id,
        details: JSON.stringify({ name: doctor.fullName }),
      },
    });

    return NextResponse.json({ data: doctor }, { status: 201 });
  } catch (error) {
    console.error('Error creating doctor:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
