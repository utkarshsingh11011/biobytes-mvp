import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting seed...')

  // Clean up existing data
  await prisma.healthAlert.deleteMany()
  await prisma.extractedMetric.deleteMany()
  await prisma.report.deleteMany()
  await prisma.accessCodeUsage.deleteMany()
  await prisma.doctorAccessCode.deleteMany()
  await prisma.labBooking.deleteMany()
  await prisma.labPartner.deleteMany()
  await prisma.biomarkerDefinition.deleteMany()
  await prisma.doctorProfile.deleteMany()
  await prisma.user.deleteMany()

  console.log('Seeding Biomarkers...')
  const biomarkersData = [
    { code: 'HEMOGLOBIN', displayName: 'Hemoglobin', unit: 'g/dL', refMin: 12.0, refMax: 15.5, category: 'CBC' },
    { code: 'RBC', displayName: 'Red Blood Cells', unit: 'mill/µL', refMin: 4.1, refMax: 5.1, category: 'CBC' },
    { code: 'WBC', displayName: 'White Blood Cells', unit: 'thou/µL', refMin: 4.5, refMax: 11.0, category: 'CBC' },
    { code: 'PLATELETS', displayName: 'Platelets', unit: 'thou/µL', refMin: 150, refMax: 450, category: 'CBC' },
    { code: 'GLUCOSE_FASTING', displayName: 'Fasting Glucose', unit: 'mg/dL', refMin: 70, refMax: 99, category: 'Diabetes' },
    { code: 'HBA1C', displayName: 'HbA1c', unit: '%', refMin: 4.0, refMax: 5.6, category: 'Diabetes' },
    { code: 'CHOLESTEROL_TOTAL', displayName: 'Total Cholesterol', unit: 'mg/dL', refMin: 125, refMax: 200, category: 'Lipid' },
    { code: 'LDL', displayName: 'LDL Cholesterol', unit: 'mg/dL', refMin: 0, refMax: 99, category: 'Lipid' },
    { code: 'HDL', displayName: 'HDL Cholesterol', unit: 'mg/dL', refMin: 40, refMax: 60, category: 'Lipid' },
    { code: 'TRIGLYCERIDES', displayName: 'Triglycerides', unit: 'mg/dL', refMin: 0, refMax: 149, category: 'Lipid' },
  ]
  const biomarkers = []
  for (const b of biomarkersData) {
    biomarkers.push(await prisma.biomarkerDefinition.create({ data: b }))
  }

  console.log('Seeding Users...')
  const patientHash = await hash('demo1234', 10)
  const patient = await prisma.user.create({
    data: {
      email: 'priya@demo.com',
      passwordHash: patientHash,
      name: 'Priya Sharma',
      role: 'PATIENT',
    }
  })

  const adminHash = await hash('admin1234', 10)
  const admin = await prisma.user.create({
    data: {
      email: 'admin@biobytes.in',
      passwordHash: adminHash,
      name: 'Admin User',
      role: 'ADMIN',
    }
  })

  console.log('Seeding Lab Partners...')
  const labs = await Promise.all([
    prisma.labPartner.create({ data: { name: 'Dr. Lal PathLabs', commissionPct: 15.0, bookingUrl: 'https://www.lalpathlabs.com' } }),
    prisma.labPartner.create({ data: { name: 'SRL Diagnostics', commissionPct: 12.0, bookingUrl: 'https://www.srlworld.com' } }),
    prisma.labPartner.create({ data: { name: 'Thyrocare', commissionPct: 18.0, bookingUrl: 'https://www.thyrocare.com' } }),
  ])

  console.log('Seeding Reports & Metrics...')
  const now = new Date()
  const threeMonthsAgo = new Date(now)
  threeMonthsAgo.setMonth(now.getMonth() - 3)
  
  const sixMonthsAgo = new Date(now)
  sixMonthsAgo.setMonth(now.getMonth() - 6)

  // Older report (6 months ago) - Good health
  const report1 = await prisma.report.create({
    data: {
      patientId: patient.id,
      fileName: 'health_check_jan.pdf',
      fileUrl: '/uploads/health_check_jan.pdf',
      status: 'PARSED',
      reportDate: sixMonthsAgo,
      labName: 'SRL Diagnostics',
    }
  })

  // Recent report (now) - High cholesterol
  const report2 = await prisma.report.create({
    data: {
      patientId: patient.id,
      fileName: 'health_check_july.pdf',
      fileUrl: '/uploads/health_check_july.pdf',
      status: 'PARSED',
      reportDate: now,
      labName: 'Dr. Lal PathLabs',
    }
  })

  // Add metrics for report 1
  const hdl = biomarkers.find(b => b.code === 'HDL')!
  const ldl = biomarkers.find(b => b.code === 'LDL')!
  const chol = biomarkers.find(b => b.code === 'CHOLESTEROL_TOTAL')!
  const hba1c = biomarkers.find(b => b.code === 'HBA1C')!

  await prisma.extractedMetric.createMany({
    data: [
      { reportId: report1.id, biomarkerId: hdl.id, value: 55, unit: hdl.unit, refMin: hdl.refMin, refMax: hdl.refMax, isAbnormal: false },
      { reportId: report1.id, biomarkerId: ldl.id, value: 95, unit: ldl.unit, refMin: ldl.refMin, refMax: ldl.refMax, isAbnormal: false },
      { reportId: report1.id, biomarkerId: chol.id, value: 180, unit: chol.unit, refMin: chol.refMin, refMax: chol.refMax, isAbnormal: false },
      { reportId: report1.id, biomarkerId: hba1c.id, value: 5.2, unit: hba1c.unit, refMin: hba1c.refMin, refMax: hba1c.refMax, isAbnormal: false },
    ]
  })

  // Add metrics for report 2 (Abnormal)
  await prisma.extractedMetric.createMany({
    data: [
      { reportId: report2.id, biomarkerId: hdl.id, value: 45, unit: hdl.unit, refMin: hdl.refMin, refMax: hdl.refMax, isAbnormal: false },
      { reportId: report2.id, biomarkerId: ldl.id, value: 140, unit: ldl.unit, refMin: ldl.refMin, refMax: ldl.refMax, isAbnormal: true }, // High LDL
      { reportId: report2.id, biomarkerId: chol.id, value: 220, unit: chol.unit, refMin: chol.refMin, refMax: chol.refMax, isAbnormal: true }, // High Total
      { reportId: report2.id, biomarkerId: hba1c.id, value: 5.8, unit: hba1c.unit, refMin: hba1c.refMin, refMax: hba1c.refMax, isAbnormal: true }, // High HbA1c
    ]
  })

  console.log('Seeding Alerts...')
  await prisma.healthAlert.create({
    data: {
      patientId: patient.id,
      severity: 'WARNING',
      message: 'Your recent blood reports show abnormalities in LDL Cholesterol (140 mg/dL). Please connect with a doctor.',
    }
  })

  console.log('Seeding Access Codes...')
  const expiry = new Date(now)
  expiry.setDate(now.getDate() + 7) // Valid for 7 days
  
  await prisma.doctorAccessCode.create({
    data: {
      patientId: patient.id,
      code: 'BIO-DEMO-1234',
      expiresAt: expiry,
      maxUses: 10,
    }
  })

  console.log('Seed completed successfully.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
