import prisma from '@/lib/prisma';

export async function generatePatientCode(): Promise<string> {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
  
  // Find the last patient created today
  const lastPatient = await prisma.patient.findFirst({
    where: {
      patientCode: {
        startsWith: `MLDC-${dateStr}-`,
      },
    },
    orderBy: {
      patientCode: 'desc',
    },
  });

  let sequenceNumber = 1;
  if (lastPatient) {
    const lastSequenceStr = lastPatient.patientCode.split('-').pop();
    if (lastSequenceStr) {
      sequenceNumber = parseInt(lastSequenceStr, 10) + 1;
    }
  }

  const sequenceStr = sequenceNumber.toString().padStart(4, '0');
  return `MLDC-${dateStr}-${sequenceStr}`;
}
