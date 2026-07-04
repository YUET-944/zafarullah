import prisma from '@/lib/prisma';

export async function generateVisitCode(): Promise<string> {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
  
  // Find the last visit created today
  const lastVisit = await prisma.visit.findFirst({
    where: {
      visitCode: {
        startsWith: `VST-${dateStr}-`,
      },
    },
    orderBy: {
      visitCode: 'desc',
    },
  });

  let sequenceNumber = 1;
  if (lastVisit) {
    const lastSequenceStr = lastVisit.visitCode.split('-').pop();
    if (lastSequenceStr) {
      sequenceNumber = parseInt(lastSequenceStr, 10) + 1;
    }
  }

  const sequenceStr = sequenceNumber.toString().padStart(4, '0');
  return `VST-${dateStr}-${sequenceStr}`;
}
