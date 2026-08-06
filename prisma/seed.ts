import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting seed...')

  // Clean up existing data
  await prisma.appointment.deleteMany()
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
    { code: 'HEMOGLOBIN', displayName: 'Hemoglobin', unit: 'g/dL', refMin: 12, refMax: 15.5 },
    { code: 'RBC', displayName: 'RBC Count', unit: 'mill/µL', refMin: 4.1, refMax: 5.1 },
    { code: 'WBC', displayName: 'WBC Count (Total Leukocyte Count)', unit: 'thou/µL', refMin: 4.5, refMax: 11 },
    { code: 'PLATELETS', displayName: 'Platelet Count', unit: 'thou/µL', refMin: 150, refMax: 450 },
    { code: 'HEMATOCRIT_PCV', displayName: 'Hematocrit (PCV)', unit: '', refMin: null, refMax: null },
    { code: 'MCV_MEAN_CORPUSCULAR_VOLUME', displayName: 'MCV (Mean Corpuscular Volume)', unit: '', refMin: null, refMax: null },
    { code: 'MCH_MEAN_CORPUSCULAR_HEMOGLOBIN', displayName: 'MCH (Mean Corpuscular Hemoglobin)', unit: '', refMin: null, refMax: null },
    { code: 'MCHC', displayName: 'MCHC', unit: '', refMin: null, refMax: null },
    { code: 'NEUTROPHILS', displayName: 'Neutrophils', unit: '', refMin: null, refMax: null },
    { code: 'LYMPHOCYTES', displayName: 'Lymphocytes', unit: '', refMin: null, refMax: null },
    { code: 'MONOCYTES', displayName: 'Monocytes', unit: '', refMin: null, refMax: null },
    { code: 'EOSINOPHILS', displayName: 'Eosinophils', unit: '', refMin: null, refMax: null },
    { code: 'BASOPHILS', displayName: 'Basophils', unit: '', refMin: null, refMax: null },
    { code: 'ESR_ERYTHROCYTE_SEDIMENTATION_RATE', displayName: 'ESR (Erythrocyte Sedimentation Rate)', unit: '', refMin: null, refMax: null },
    { code: 'CHOLESTEROL_TOTAL', displayName: 'Total Cholesterol', unit: 'mg/dL', refMin: 125, refMax: 200 },
    { code: 'HDL', displayName: 'HDL Cholesterol', unit: 'mg/dL', refMin: 40, refMax: 60 },
    { code: 'LDL', displayName: 'LDL Cholesterol', unit: 'mg/dL', refMin: 0, refMax: 99 },
    { code: 'VLDL_CHOLESTEROL', displayName: 'VLDL Cholesterol', unit: '', refMin: null, refMax: null },
    { code: 'TRIGLYCERIDES', displayName: 'Triglycerides', unit: 'mg/dL', refMin: 0, refMax: 149 },
    { code: 'TOTAL_CHOLESTEROL_HDL_RATIO', displayName: 'Total Cholesterol / HDL Ratio', unit: '', refMin: null, refMax: null },
    { code: 'TOTAL_BILIRUBIN', displayName: 'Total Bilirubin', unit: '', refMin: null, refMax: null },
    { code: 'DIRECT_BILIRUBIN', displayName: 'Direct Bilirubin', unit: '', refMin: null, refMax: null },
    { code: 'INDIRECT_BILIRUBIN', displayName: 'Indirect Bilirubin', unit: '', refMin: null, refMax: null },
    { code: 'SGOT_AST', displayName: 'SGOT (AST)', unit: '', refMin: null, refMax: null },
    { code: 'SGPT_ALT', displayName: 'SGPT (ALT)', unit: '', refMin: null, refMax: null },
    { code: 'ALKALINE_PHOSPHATASE_ALP', displayName: 'Alkaline Phosphatase (ALP)', unit: '', refMin: null, refMax: null },
    { code: 'TOTAL_PROTEIN', displayName: 'Total Protein', unit: '', refMin: null, refMax: null },
    { code: 'ALBUMIN', displayName: 'Albumin', unit: '', refMin: null, refMax: null },
    { code: 'GLOBULIN', displayName: 'Globulin', unit: '', refMin: null, refMax: null },
    { code: 'A_G_RATIO', displayName: 'A/G Ratio', unit: '', refMin: null, refMax: null },
    { code: 'GAMMA_GT_GGT', displayName: 'Gamma GT (GGT)', unit: '', refMin: null, refMax: null },
    { code: 'BLOOD_UREA_NITROGEN_BUN', displayName: 'Blood Urea Nitrogen (BUN)', unit: '', refMin: null, refMax: null },
    { code: 'BLOOD_UREA', displayName: 'Blood Urea', unit: '', refMin: null, refMax: null },
    { code: 'SERUM_CREATININE', displayName: 'Serum Creatinine', unit: '', refMin: null, refMax: null },
    { code: 'URIC_ACID', displayName: 'Uric Acid', unit: '', refMin: null, refMax: null },
    { code: 'SERUM_SODIUM', displayName: 'Serum Sodium', unit: '', refMin: null, refMax: null },
    { code: 'SERUM_POTASSIUM', displayName: 'Serum Potassium', unit: '', refMin: null, refMax: null },
    { code: 'SERUM_CHLORIDE', displayName: 'Serum Chloride', unit: '', refMin: null, refMax: null },
    { code: 'SERUM_CALCIUM', displayName: 'Serum Calcium', unit: '', refMin: null, refMax: null },
    { code: 'SERUM_PHOSPHORUS', displayName: 'Serum Phosphorus', unit: '', refMin: null, refMax: null },
    { code: 'GLUCOSE_FASTING', displayName: 'Fasting Blood Sugar (FBS)', unit: 'mg/dL', refMin: 70, refMax: 99 },
    { code: 'POST_PRANDIAL_BLOOD_SUGAR_PPBS', displayName: 'Post Prandial Blood Sugar (PPBS)', unit: '', refMin: null, refMax: null },
    { code: 'RANDOM_BLOOD_SUGAR_RBS', displayName: 'Random Blood Sugar (RBS)', unit: '', refMin: null, refMax: null },
    { code: 'HBA1C', displayName: 'HbA1c (Glycosylated Hemoglobin)', unit: '%', refMin: 4, refMax: 5.6 },
    { code: 'AVERAGE_BLOOD_GLUCOSE', displayName: 'Average Blood Glucose', unit: '', refMin: null, refMax: null },
    { code: 'FASTING_INSULIN', displayName: 'Fasting Insulin', unit: '', refMin: null, refMax: null },
    { code: 'TOTAL_T3', displayName: 'Total T3', unit: '', refMin: null, refMax: null },
    { code: 'TOTAL_T4', displayName: 'Total T4', unit: '', refMin: null, refMax: null },
    { code: 'FREE_T3_FT3', displayName: 'Free T3 (FT3)', unit: '', refMin: null, refMax: null },
    { code: 'FREE_T4_FT4', displayName: 'Free T4 (FT4)', unit: '', refMin: null, refMax: null },
    { code: 'TSH_THYROID_STIMULATING_HORMONE', displayName: 'TSH (Thyroid Stimulating Hormone)', unit: '', refMin: null, refMax: null },
    { code: 'VITAMIN_D', displayName: 'Vitamin D (25-OH)', unit: 'ng/mL', refMin: 20, refMax: 50 },
    { code: 'VITAMIN_B12', displayName: 'Vitamin B12', unit: 'pg/mL', refMin: 200, refMax: 900 },
    { code: 'SERUM_IRON', displayName: 'Serum Iron', unit: '', refMin: null, refMax: null },
    { code: 'TOTAL_IRON_BINDING_CAPACITY_TIBC', displayName: 'Total Iron Binding Capacity (TIBC)', unit: '', refMin: null, refMax: null },
    { code: 'FERRITIN', displayName: 'Ferritin', unit: '', refMin: null, refMax: null },
    { code: 'TRANSFERRIN_SATURATION', displayName: 'Transferrin Saturation', unit: '', refMin: null, refMax: null },
    { code: 'FOLIC_ACID_FOLATE', displayName: 'Folic Acid (Folate)', unit: '', refMin: null, refMax: null },
    { code: 'MAGNESIUM', displayName: 'Magnesium', unit: '', refMin: null, refMax: null },
    { code: 'ZINC', displayName: 'Zinc', unit: '', refMin: null, refMax: null },
    { code: 'WIDAL_TEST_TYPHOID', displayName: 'Widal Test (Typhoid)', unit: '', refMin: null, refMax: null },
    { code: 'DENGUE_NS1_ANTIGEN', displayName: 'Dengue NS1 Antigen', unit: '', refMin: null, refMax: null },
    { code: 'DENGUE_IGG', displayName: 'Dengue IgG', unit: '', refMin: null, refMax: null },
    { code: 'DENGUE_IGM', displayName: 'Dengue IgM', unit: '', refMin: null, refMax: null },
    { code: 'MALARIA_PARASITE_MP', displayName: 'Malaria Parasite (MP)', unit: '', refMin: null, refMax: null },
    { code: 'CHIKUNGUNYA_IGM', displayName: 'Chikungunya IgM', unit: '', refMin: null, refMax: null },
    { code: 'HBSAG_HEPATITIS_B', displayName: 'HBsAg (Hepatitis B)', unit: '', refMin: null, refMax: null },
    { code: 'ANTI_HCV_HEPATITIS_C', displayName: 'Anti-HCV (Hepatitis C)', unit: '', refMin: null, refMax: null },
    { code: 'HIV_1_2_ANTIBODIES', displayName: 'HIV 1 & 2 Antibodies', unit: '', refMin: null, refMax: null },
    { code: 'VDRL_SYPHILIS', displayName: 'VDRL (Syphilis)', unit: '', refMin: null, refMax: null },
    { code: 'CRP_C_REACTIVE_PROTEIN', displayName: 'CRP (C-Reactive Protein)', unit: '', refMin: null, refMax: null },
    { code: 'HS_CRP_HIGH_SENSITIVITY_CRP', displayName: 'hs-CRP (High Sensitivity CRP)', unit: '', refMin: null, refMax: null },
    { code: 'PROCALCITONIN', displayName: 'Procalcitonin', unit: '', refMin: null, refMax: null },
    { code: 'URINE_PH', displayName: 'Urine pH', unit: '', refMin: null, refMax: null },
    { code: 'URINE_SPECIFIC_GRAVITY', displayName: 'Urine Specific Gravity', unit: '', refMin: null, refMax: null },
    { code: 'URINE_PROTEIN_ALBUMIN', displayName: 'Urine Protein / Albumin', unit: '', refMin: null, refMax: null },
    { code: 'URINE_GLUCOSE_SUGAR', displayName: 'Urine Glucose / Sugar', unit: '', refMin: null, refMax: null },
    { code: 'URINE_KETONES', displayName: 'Urine Ketones', unit: '', refMin: null, refMax: null },
    { code: 'URINE_BILIRUBIN', displayName: 'Urine Bilirubin', unit: '', refMin: null, refMax: null },
    { code: 'URINE_UROBILINOGEN', displayName: 'Urine Urobilinogen', unit: '', refMin: null, refMax: null },
    { code: 'URINE_BLOOD', displayName: 'Urine Blood', unit: '', refMin: null, refMax: null },
    { code: 'URINE_PUS_CELLS', displayName: 'Urine Pus Cells', unit: '', refMin: null, refMax: null },
    { code: 'URINE_RBC', displayName: 'Urine RBC', unit: '', refMin: null, refMax: null },
    { code: 'URINE_EPITHELIAL_CELLS', displayName: 'Urine Epithelial Cells', unit: '', refMin: null, refMax: null },
    { code: 'URINE_CASTS', displayName: 'Urine Casts', unit: '', refMin: null, refMax: null },
    { code: 'URINE_CRYSTALS', displayName: 'Urine Crystals', unit: '', refMin: null, refMax: null },
    { code: 'TROPONIN_I', displayName: 'Troponin I', unit: '', refMin: null, refMax: null },
    { code: 'TROPONIN_T', displayName: 'Troponin T', unit: '', refMin: null, refMax: null },
    { code: 'CPK_MB', displayName: 'CPK-MB', unit: '', refMin: null, refMax: null },
    { code: 'CPK_TOTAL', displayName: 'CPK Total', unit: '', refMin: null, refMax: null },
    { code: 'D_DIMER', displayName: 'D-Dimer', unit: '', refMin: null, refMax: null },
    { code: 'PT_PROTHROMBIN_TIME', displayName: 'PT (Prothrombin Time)', unit: '', refMin: null, refMax: null },
    { code: 'INR', displayName: 'INR', unit: '', refMin: null, refMax: null },
    { code: 'APTT', displayName: 'APTT', unit: '', refMin: null, refMax: null },
    { code: 'PROLACTIN', displayName: 'Prolactin', unit: '', refMin: null, refMax: null },
    { code: 'FSH_FOLLICLE_STIMULATING_HORMONE', displayName: 'FSH (Follicle Stimulating Hormone)', unit: '', refMin: null, refMax: null },
    { code: 'LH_LUTEINIZING_HORMONE', displayName: 'LH (Luteinizing Hormone)', unit: '', refMin: null, refMax: null },
    { code: 'TESTOSTERONE_TOTAL', displayName: 'Testosterone (Total)', unit: '', refMin: null, refMax: null },
    { code: 'ESTRADIOL_E2', displayName: 'Estradiol (E2)', unit: '', refMin: null, refMax: null },
    { code: 'PSA_PROSTATE_SPECIFIC_ANTIGEN', displayName: 'PSA (Prostate Specific Antigen)', unit: '', refMin: null, refMax: null },
    { code: 'CA_125_OVARIAN', displayName: 'CA-125 (Ovarian)', unit: '', refMin: null, refMax: null },
    { code: 'CEA_CARCINOEMBRYONIC_ANTIGEN', displayName: 'CEA (Carcinoembryonic Antigen)', unit: '', refMin: null, refMax: null },
    { code: 'RHEUMATOID_FACTOR_RA_TEST', displayName: 'Rheumatoid Factor (RA Test)', unit: '', refMin: null, refMax: null },
    { code: 'ANTI_CCP', displayName: 'Anti-CCP', unit: '', refMin: null, refMax: null },
    { code: 'ANA_ANTI_NUCLEAR_ANTIBODY', displayName: 'ANA (Anti-Nuclear Antibody)', unit: '', refMin: null, refMax: null },
    { code: 'IGE_TOTAL', displayName: 'IgE Total', unit: '', refMin: null, refMax: null },
    { code: 'SERUM_AMYLASE', displayName: 'Serum Amylase', unit: '', refMin: null, refMax: null },
    { code: 'SERUM_LIPASE', displayName: 'Serum Lipase', unit: '', refMin: null, refMax: null }
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

  const sankalpHash = await hash('demo1234', 10)
  const sankalp = await prisma.user.create({
    data: {
      email: 'sankalp@demo.com',
      passwordHash: sankalpHash,
      name: 'Sankalp Verma',
      role: 'PATIENT',
    }
  })

  const utkarshHash = await hash('demo1234', 10)
  const utkarsh = await prisma.user.create({
    data: {
      email: 'utkarsh@demo.com',
      passwordHash: utkarshHash,
      name: 'Utkarsh Singh',
      role: 'PATIENT',
    }
  })

  const tejasHash = await hash('demo1234', 10)
  const tejas = await prisma.user.create({
    data: {
      email: 'tejas@demo.com',
      passwordHash: tejasHash,
      name: 'Tejas Vishwakarma',
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

  const doctorHash = await hash('demo1234', 10)
  const doctor = await prisma.user.create({
    data: {
      email: 'doctor@demo.com',
      passwordHash: doctorHash,
      name: 'Dr. Rahul Verma',
      role: 'DOCTOR',
    }
  })

  await prisma.doctorProfile.create({
    data: {
      userId: doctor.id,
      licenseNumber: 'MCI-98765',
      specialization: 'General Physician',
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

  // === SANKALP VERMA DATA ===
  const twelveMonthsAgo = new Date(now)
  twelveMonthsAgo.setMonth(now.getMonth() - 12)

  const sankalpReport1 = await prisma.report.create({
    data: {
      patientId: sankalp.id,
      fileName: 'sankalp_2025_jan.pdf',
      fileUrl: '/uploads/sankalp_2025_jan.pdf',
      status: 'PARSED',
      aiSummary: 'Patient exhibits healthy baseline metrics across lipid and glycemic profiles. No immediate interventions required.',
      reportDate: twelveMonthsAgo,
      labName: 'Thyrocare',
    }
  })

  const sankalpReport2 = await prisma.report.create({
    data: {
      patientId: sankalp.id,
      fileName: 'sankalp_2025_july.pdf',
      fileUrl: '/uploads/sankalp_2025_july.pdf',
      status: 'PARSED',
      aiSummary: 'Slight elevation in LDL Cholesterol observed. Fasting blood sugar remains stable. Advised dietary modifications.',
      reportDate: sixMonthsAgo,
      labName: 'Thyrocare',
    }
  })

  const sankalpReport3 = await prisma.report.create({
    data: {
      patientId: sankalp.id,
      fileName: 'sankalp_2026_jan.pdf',
      fileUrl: '/uploads/sankalp_2026_jan.pdf',
      status: 'PARSED',
      aiSummary: 'Significant improvement in lipid profile following dietary changes. LDL has decreased to normal levels. Vitamin D is slightly deficient, supplementation recommended.',
      reportDate: now,
      labName: 'SRL Diagnostics',
    }
  })

  
  
  const trig = biomarkers.find(b => b.code === 'TRIGLYCERIDES')!

  // Sankalp Report 1 (12 months ago)
  await prisma.userHealthRecord.create({
    data: {
      patientId: sankalp.id,
      reportId: sankalpReport1.id,
      hemoglobin: 14.5,
      fasting_blood_sugar: 85,
      thyroid_tsh: 2.1,
      ldl_cholesterol: 90,
      hdl_cholesterol: 60,
      triglycerides: 110,
      vitamin_d: 35,
      vitamin_b12: 450,
      createdAt: twelveMonthsAgo,
    }
  })

  // Sankalp Report 2 (6 months ago)
  await prisma.userHealthRecord.create({
    data: {
      patientId: sankalp.id,
      reportId: sankalpReport2.id,
      hemoglobin: 14.2,
      fasting_blood_sugar: 88,
      thyroid_tsh: 2.3,
      ldl_cholesterol: 135,
      hdl_cholesterol: 55,
      triglycerides: 140,
      vitamin_d: 28,
      vitamin_b12: 400,
      createdAt: sixMonthsAgo,
    }
  })

  // Sankalp Report 3 (Now)
  await prisma.userHealthRecord.create({
    data: {
      patientId: sankalp.id,
      reportId: sankalpReport3.id,
      hemoglobin: 14.8,
      fasting_blood_sugar: 82,
      thyroid_tsh: 1.9,
      ldl_cholesterol: 95,
      hdl_cholesterol: 65,
      triglycerides: 90,
      vitamin_d: 18,
      vitamin_b12: 350,
      createdAt: now,
    }
  })

  // === UTKARSH SINGH DATA ===
  const utkarshReport1 = await prisma.report.create({
    data: {
      patientId: utkarsh.id,
      fileName: 'utkarsh_blood_test.pdf',
      fileUrl: '/uploads/utkarsh_blood_test.pdf',
      status: 'PARSED',
      aiSummary: 'Hemoglobin levels are within the healthy normal range. No other tests were provided in this report.',
      reportDate: now,
      labName: 'SRL Diagnostics',
    }
  })

  // Utkarsh Report - Only Hemoglobin
  await prisma.userHealthRecord.create({
    data: {
      patientId: utkarsh.id,
      reportId: utkarshReport1.id,
      hemoglobin: 15.2,
      createdAt: now,
    }
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
      code: '123456',
      expiresAt: expiry,
      maxUses: 10,
    }
  })

  console.log('Seeding Appointments...')
  await prisma.appointment.create({
    data: {
      patientId: patient.id,
      doctorId: doctor.id,
      scheduledTime: new Date(now.getTime() + 24 * 60 * 60 * 1000), // Tomorrow
      status: 'PENDING',
      accessCode: '123456',
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
