import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import puppeteer from 'puppeteer';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const visit = await prisma.visit.findUnique({
      where: { id: params.id },
      include: {
        patient: true,
        referringDoctor: true,
        testResults: {
          include: {
            test: {
              include: {
                category: true,
              }
            }
          }
        }
      }
    });

    if (!visit) {
      return NextResponse.json({ error: 'Visit not found' }, { status: 404 });
    }

    // Group test results by category
    const categorizedResults: Record<string, any[]> = {};
    visit.testResults.forEach(tr => {
      const catName = tr.test.category?.name || 'Other Tests';
      if (!categorizedResults[catName]) {
        categorizedResults[catName] = [];
      }
      categorizedResults[catName].push(tr);
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Report - ${visit.visitCode}</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; }
          .header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
          .header h1 { margin: 0; color: #2563eb; font-size: 28px; }
          .header p { margin: 5px 0 0; color: #666; font-size: 14px; }
          
          .patient-info { display: flex; justify-content: space-between; margin-bottom: 40px; background: #f8fafc; padding: 20px; border-radius: 8px; }
          .info-col { flex: 1; }
          .info-row { margin-bottom: 8px; font-size: 14px; }
          .info-label { font-weight: bold; width: 120px; display: inline-block; color: #64748b; }
          
          .category { margin-bottom: 30px; }
          .category-title { background: #e2e8f0; padding: 8px 12px; font-size: 16px; font-weight: bold; margin-bottom: 10px; border-radius: 4px; }
          
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { padding: 12px 8px; text-align: left; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
          th { font-weight: bold; color: #475569; border-bottom: 2px solid #cbd5e1; }
          .value-col { font-weight: bold; color: #0f172a; }
          
          .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; }
          .signature-area { display: flex; justify-content: flex-end; margin-top: 60px; }
          .signature-box { text-align: center; width: 200px; border-top: 1px solid #333; padding-top: 10px; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Moon Light Diagnostic Center</h1>
          <p>123 Medical Avenue, Healthcare City | Tel: (555) 123-4567 | Email: info@moonlightdiag.com</p>
        </div>

        <div class="patient-info">
          <div class="info-col">
            <div class="info-row"><span class="info-label">Patient Name:</span> ${visit.patient.firstName} ${visit.patient.lastName}</div>
            <div class="info-row"><span class="info-label">Patient ID:</span> ${visit.patient.patientCode}</div>
            <div class="info-row"><span class="info-label">Age / Gender:</span> ${visit.patient.age} / ${visit.patient.gender}</div>
          </div>
          <div class="info-col">
            <div class="info-row"><span class="info-label">Visit Code:</span> ${visit.visitCode}</div>
            <div class="info-row"><span class="info-label">Date:</span> ${new Date(visit.createdAt).toLocaleDateString()}</div>
            <div class="info-row"><span class="info-label">Ref. Doctor:</span> ${visit.referringDoctor ? `Dr. ${visit.referringDoctor.name}` : 'Self'}</div>
          </div>
        </div>

        <div class="results">
          ${Object.keys(categorizedResults).map(category => `
            <div class="category">
              <div class="category-title">${category}</div>
              <table>
                <thead>
                  <tr>
                    <th style="width: 30%">Test Name</th>
                    <th style="width: 20%">Result</th>
                    <th style="width: 15%">Unit</th>
                    <th style="width: 20%">Reference Range</th>
                    <th style="width: 15%">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  ${categorizedResults[category].map(tr => `
                    <tr>
                      <td>${tr.test.name}</td>
                      <td class="value-col">${tr.value || '-'}</td>
                      <td>${tr.test.unit || ''}</td>
                      <td>${tr.test.normalRange || ''}</td>
                      <td>${tr.remarks || ''}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `).join('')}
        </div>

        <div class="signature-area">
          <div class="signature-box">
            Authorized Signatory<br>
            <strong>Moon Light Diagnostic Center</strong>
          </div>
        </div>

        <div class="footer">
          This is an electronically generated report. End of Report.
        </div>
      </body>
      </html>
    `;

    const browser = await puppeteer.launch({ 
      args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    const page = await browser.newPage();
    
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' }
    });

    await browser.close();

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="Report_${visit.visitCode}.pdf"`,
      },
    });

  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
