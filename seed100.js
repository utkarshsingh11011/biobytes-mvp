const fs = require('fs');
const keys = [
  'Hemoglobin', 'RBC Count', 'WBC Count (Total Leukocyte Count)', 'Platelet Count', 'Hematocrit (PCV)', 'MCV (Mean Corpuscular Volume)', 'MCH (Mean Corpuscular Hemoglobin)', 'MCHC', 'Neutrophils', 'Lymphocytes', 'Monocytes', 'Eosinophils', 'Basophils', 'ESR (Erythrocyte Sedimentation Rate)',
  'Total Cholesterol', 'HDL Cholesterol', 'LDL Cholesterol', 'VLDL Cholesterol', 'Triglycerides', 'Total Cholesterol / HDL Ratio',
  'Total Bilirubin', 'Direct Bilirubin', 'Indirect Bilirubin', 'SGOT (AST)', 'SGPT (ALT)', 'Alkaline Phosphatase (ALP)', 'Total Protein', 'Albumin', 'Globulin', 'A/G Ratio', 'Gamma GT (GGT)',
  'Blood Urea Nitrogen (BUN)', 'Blood Urea', 'Serum Creatinine', 'Uric Acid', 'Serum Sodium', 'Serum Potassium', 'Serum Chloride', 'Serum Calcium', 'Serum Phosphorus',
  'Fasting Blood Sugar (FBS)', 'Post Prandial Blood Sugar (PPBS)', 'Random Blood Sugar (RBS)', 'HbA1c (Glycosylated Hemoglobin)', 'Average Blood Glucose', 'Fasting Insulin',
  'Total T3', 'Total T4', 'Free T3 (FT3)', 'Free T4 (FT4)', 'TSH (Thyroid Stimulating Hormone)',
  'Vitamin D (25-OH)', 'Vitamin B12', 'Serum Iron', 'Total Iron Binding Capacity (TIBC)', 'Ferritin', 'Transferrin Saturation', 'Folic Acid (Folate)', 'Magnesium', 'Zinc',
  'Widal Test (Typhoid)', 'Dengue NS1 Antigen', 'Dengue IgG', 'Dengue IgM', 'Malaria Parasite (MP)', 'Chikungunya IgM', 'HBsAg (Hepatitis B)', 'Anti-HCV (Hepatitis C)', 'HIV 1 & 2 Antibodies', 'VDRL (Syphilis)', 'CRP (C-Reactive Protein)', 'hs-CRP (High Sensitivity CRP)', 'Procalcitonin',
  'Urine pH', 'Urine Specific Gravity', 'Urine Protein / Albumin', 'Urine Glucose / Sugar', 'Urine Ketones', 'Urine Bilirubin', 'Urine Urobilinogen', 'Urine Blood', 'Urine Pus Cells', 'Urine RBC', 'Urine Epithelial Cells', 'Urine Casts', 'Urine Crystals',
  'Troponin I', 'Troponin T', 'CPK-MB', 'CPK Total', 'D-Dimer', 'PT (Prothrombin Time)', 'INR', 'APTT',
  'Prolactin', 'FSH (Follicle Stimulating Hormone)', 'LH (Luteinizing Hormone)', 'Testosterone (Total)', 'Estradiol (E2)',
  'PSA (Prostate Specific Antigen)', 'CA-125 (Ovarian)', 'CEA (Carcinoembryonic Antigen)', 'Rheumatoid Factor (RA Test)', 'Anti-CCP', 'ANA (Anti-Nuclear Antibody)', 'IgE Total', 'Serum Amylase', 'Serum Lipase'
];

let seedContent = fs.readFileSync('prisma/seed.ts', 'utf8');

const biomarkerObjs = keys.map((key) => {
  // Try to preserve existing codes/refs if they match roughly
  let code = key.toUpperCase().replace(/[^A-Z0-9]/g, '_').replace(/_+/g, '_').replace(/_$/, '');
  let refMin = 'null', refMax = 'null', unit = "''";
  
  if (key === 'Hemoglobin') { code = 'HEMOGLOBIN'; refMin = 12.0; refMax = 15.5; unit = "'g/dL'"; }
  else if (key === 'RBC Count') { code = 'RBC'; refMin = 4.1; refMax = 5.1; unit = "'mill/µL'"; }
  else if (key.includes('WBC')) { code = 'WBC'; refMin = 4.5; refMax = 11.0; unit = "'thou/µL'"; }
  else if (key === 'Platelet Count') { code = 'PLATELETS'; refMin = 150; refMax = 450; unit = "'thou/µL'"; }
  else if (key.includes('Fasting Blood Sugar')) { code = 'GLUCOSE_FASTING'; refMin = 70; refMax = 99; unit = "'mg/dL'"; }
  else if (key.includes('HbA1c')) { code = 'HBA1C'; refMin = 4.0; refMax = 5.6; unit = "'%'"; }
  else if (key === 'Total Cholesterol') { code = 'CHOLESTEROL_TOTAL'; refMin = 125; refMax = 200; unit = "'mg/dL'"; }
  else if (key === 'LDL Cholesterol') { code = 'LDL'; refMin = 0; refMax = 99; unit = "'mg/dL'"; }
  else if (key === 'HDL Cholesterol') { code = 'HDL'; refMin = 40; refMax = 60; unit = "'mg/dL'"; }
  else if (key === 'Triglycerides') { code = 'TRIGLYCERIDES'; refMin = 0; refMax = 149; unit = "'mg/dL'"; }
  else if (key.includes('Vitamin D')) { code = 'VITAMIN_D'; refMin = 20; refMax = 50; unit = "'ng/mL'"; }
  else if (key === 'Vitamin B12') { code = 'VITAMIN_B12'; refMin = 200; refMax = 900; unit = "'pg/mL'"; }

  return `    { code: '${code}', displayName: '${key}', unit: ${unit}, refMin: ${refMin}, refMax: ${refMax} }`;
});

const arrayString = '  const biomarkersData = [\n' + biomarkerObjs.join(',\n') + '\n  ]';
seedContent = seedContent.replace(/const biomarkersData = \[\s*[\s\S]*?\s*\]/, arrayString);

seedContent = seedContent.replace(/const vitD = await prisma.biomarkerDefinition.create.*/, '');
seedContent = seedContent.replace(/const vitB12 = await prisma.biomarkerDefinition.create.*/, '');

fs.writeFileSync('prisma/seed.ts', seedContent);
