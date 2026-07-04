import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create ADMIN user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@moonlight.com' },
    update: {},
    create: {
      email: 'admin@moonlight.com',
      name: 'System Admin',
      passwordHash: adminPassword,
      role: Role.ADMIN,
    },
  });
  console.log(`Admin user created: ${admin.email}`);

  // Test Categories and Tests
  const categoriesData = [
    {
      name: 'Hematology',
      tests: [
        { name: 'Complete Blood Count (CBC)', price: 50, turnaroundHours: 4, unit: 'various' },
        { name: 'Hemoglobin (Hb)', price: 15, turnaroundHours: 2, unit: 'g/dL', refRangeLow: 13.5, refRangeHigh: 17.5 },
        { name: 'Erythrocyte Sedimentation Rate (ESR)', price: 20, turnaroundHours: 3, unit: 'mm/hr', refRangeLow: 0, refRangeHigh: 15 },
      ]
    },
    {
      name: 'Microbiology',
      tests: [
        { name: 'Urine Culture', price: 60, turnaroundHours: 48, unit: 'CFU/mL', refRangeText: 'No growth' },
        { name: 'Blood Culture', price: 100, turnaroundHours: 72, unit: 'N/A', refRangeText: 'Sterile' },
        { name: 'Stool Routine Examination', price: 30, turnaroundHours: 4, unit: 'N/A' },
      ]
    },
    {
      name: 'Biochemistry',
      tests: [
        { name: 'Fasting Blood Sugar (FBS)', price: 20, turnaroundHours: 2, unit: 'mg/dL', refRangeLow: 70, refRangeHigh: 100 },
        { name: 'Serum Creatinine', price: 25, turnaroundHours: 2, unit: 'mg/dL', refRangeLow: 0.6, refRangeHigh: 1.2 },
        { name: 'Lipid Profile', price: 80, turnaroundHours: 6, unit: 'mg/dL' },
      ]
    },
    {
      name: 'Serology',
      tests: [
        { name: 'Widal Test', price: 35, turnaroundHours: 6, unit: 'Titer', refRangeText: '< 1:80' },
        { name: 'Dengue NS1 Antigen', price: 50, turnaroundHours: 4, unit: 'N/A', refRangeText: 'Negative' },
      ]
    },
    {
      name: 'Clinical Pathology',
      tests: [
        { name: 'Urine Routine Examination', price: 20, turnaroundHours: 2, unit: 'N/A' },
        { name: 'Semen Analysis', price: 40, turnaroundHours: 4, unit: 'millions/mL', refRangeLow: 15, refRangeHigh: 200 },
      ]
    }
  ];

  for (const catData of categoriesData) {
    const category = await prisma.testCategory.upsert({
      where: { name: catData.name },
      update: {},
      create: {
        name: catData.name,
      },
    });

    for (const testData of catData.tests) {
      await prisma.test.create({
        data: {
          ...testData,
          categoryId: category.id,
        }
      });
    }
    console.log(`Created category: ${category.name} with ${catData.tests.length} tests`);
  }

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
