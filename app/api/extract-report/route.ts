import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"
import Tesseract from "tesseract.js"
import { extractText } from "unpdf"
import { GoogleGenAI } from "@google/genai"

const prisma = new PrismaClient()
const apiKey = process.env.GEMINI_API_KEY
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null

export const maxDuration = 60 

const SYSTEM_PROMPT = `Role: You are a high-precision medical data parser. Your only job is to extract medical test results from raw OCR text and map them STRICTLY to a predefined list of allowed test keys.

CORE DIRECTIVES (CRITICAL):
1. ZERO HALLUCINATION: You must never guess, infer, or combine tests. 
2. STRICT MAPPING: You are only allowed to output tests that exist in the "ALLOWED_TEST_KEYS" array below. 
3. EXACT DISTINCTION: Pay absolute attention to prefixes and suffixes. "Total Cholesterol" is strictly different from "LDL Cholesterol". "Direct Bilirubin" is strictly different from "Total Bilirubin". Do not mix them up.
4. UNMAPPED DATA: If a test in the OCR text does not perfectly match the clinical intent of a key in the allowed list, completely ignore it. Do not invent new keys.

ALLOWED_TEST_KEYS (100 Common Indian Lab Tests):
"Hemoglobin", "RBC Count", "WBC Count (Total Leukocyte Count)", "Platelet Count", "Hematocrit (PCV)", "MCV (Mean Corpuscular Volume)", "MCH (Mean Corpuscular Hemoglobin)", "MCHC", "Neutrophils", "Lymphocytes", "Monocytes", "Eosinophils", "Basophils", "ESR (Erythrocyte Sedimentation Rate)",
"Total Cholesterol", "HDL Cholesterol", "LDL Cholesterol", "VLDL Cholesterol", "Triglycerides", "Total Cholesterol / HDL Ratio",
"Total Bilirubin", "Direct Bilirubin", "Indirect Bilirubin", "SGOT (AST)", "SGPT (ALT)", "Alkaline Phosphatase (ALP)", "Total Protein", "Albumin", "Globulin", "A/G Ratio", "Gamma GT (GGT)",
"Blood Urea Nitrogen (BUN)", "Blood Urea", "Serum Creatinine", "Uric Acid", "Serum Sodium", "Serum Potassium", "Serum Chloride", "Serum Calcium", "Serum Phosphorus",
"Fasting Blood Sugar (FBS)", "Post Prandial Blood Sugar (PPBS)", "Random Blood Sugar (RBS)", "HbA1c (Glycosylated Hemoglobin)", "Average Blood Glucose", "Fasting Insulin",
"Total T3", "Total T4", "Free T3 (FT3)", "Free T4 (FT4)", "TSH (Thyroid Stimulating Hormone)",
"Vitamin D (25-OH)", "Vitamin B12", "Serum Iron", "Total Iron Binding Capacity (TIBC)", "Ferritin", "Transferrin Saturation", "Folic Acid (Folate)", "Magnesium", "Zinc",
"Widal Test (Typhoid)", "Dengue NS1 Antigen", "Dengue IgG", "Dengue IgM", "Malaria Parasite (MP)", "Chikungunya IgM", "HBsAg (Hepatitis B)", "Anti-HCV (Hepatitis C)", "HIV 1 & 2 Antibodies", "VDRL (Syphilis)", "CRP (C-Reactive Protein)", "hs-CRP (High Sensitivity CRP)", "Procalcitonin",
"Urine pH", "Urine Specific Gravity", "Urine Protein / Albumin", "Urine Glucose / Sugar", "Urine Ketones", "Urine Bilirubin", "Urine Urobilinogen", "Urine Blood", "Urine Pus Cells", "Urine RBC", "Urine Epithelial Cells", "Urine Casts", "Urine Crystals",
"Troponin I", "Troponin T", "CPK-MB", "CPK Total", "D-Dimer", "PT (Prothrombin Time)", "INR", "APTT",
"Prolactin", "FSH (Follicle Stimulating Hormone)", "LH (Luteinizing Hormone)", "Testosterone (Total)", "Estradiol (E2)",
"PSA (Prostate Specific Antigen)", "CA-125 (Ovarian)", "CEA (Carcinoembryonic Antigen)", "Rheumatoid Factor (RA Test)", "Anti-CCP", "ANA (Anti-Nuclear Antibody)", "IgE Total", "Serum Amylase", "Serum Lipase"

Task: Review the provided OCR text. Extract the values and units only for the tests that map directly to the ALLOWED_TEST_KEYS.

Required JSON Output Format:
{
  "report_date": "YYYY-MM-DD",
  "lab_name": "String",
  "patient_name": "String",
  "extracted_data": [
    {
      "test_key": "MUST EXACTLY MATCH A STRING FROM ALLOWED_TEST_KEYS",
      "value": "Number",
      "unit": "String"
    }
  ]
}`

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userExists = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!userExists) {
      return NextResponse.json({ error: "Your session is invalid or the account was deleted. Please log out and log back in." }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const mimeType = file.type

    let extractedText = ""

    if (mimeType === "application/pdf") {
      const uint8Array = new Uint8Array(buffer)
      const pdfData = await extractText(uint8Array)
      if (typeof pdfData === 'string') {
        extractedText = pdfData
      } else if (pdfData && typeof pdfData === 'object' && 'text' in pdfData) {
        const textObj = (pdfData as any).text
        extractedText = Array.isArray(textObj) ? textObj.join('\n') : (textObj || "")
      } else if (Array.isArray(pdfData as any)) {
        extractedText = (pdfData as any).join('\n')
      }
    } else if (mimeType.startsWith("image/")) {
      const result = await Tesseract.recognize(buffer, "eng")
      extractedText = result.data.text
    } else {
      return NextResponse.json({ error: "Unsupported file type. Please upload a PDF, JPG, or PNG." }, { status: 400 })
    }

    if (typeof extractedText !== 'string') {
      extractedText = String(extractedText)
    }

    if (!extractedText.trim()) {
      throw new Error("Could not extract any text from the document.")
    }

    // HYBRID PRE-FILTER: Token Optimization
    const rawLines = extractedText.split('\n')
    const cleanedLines = rawLines.map(line => line.trim()).filter(line => {
      if (!line) return false
      if (!/\d/.test(line)) return false // Must contain a number
      const l = line.toLowerCase()
      if (l.includes("address") || l.includes("ph:") || l.includes("phone") || l.includes("email") || l.includes("www.") || l.includes("signature") || l.includes("not for medico") || l.includes("end of report") || l.includes("page ")) {
        return false
      }
      return true
    })
    const microPromptText = cleanedLines.join(' | ')

    // Call Gemini with the strict prompt
    if (!ai) {
      throw new Error("Missing GEMINI_API_KEY environment variable. Please add your Gemini API key in your Vercel settings.")
    }

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: [
        { role: 'user', parts: [{ text: `OCR TEXT TO PROCESS:\n\n${microPromptText}` }] }
      ],
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.1,
        responseMimeType: "application/json"
      }
    })

    const responseText = response.text
    if (!responseText) {
      throw new Error("AI returned empty response")
    }

    let parsedData
    try {
      parsedData = JSON.parse(responseText)
    } catch (e) {
      throw new Error("AI returned invalid JSON")
    }

    // Save to Database
    const reportDate = parsedData.report_date ? new Date(parsedData.report_date) : new Date()

    const report = await prisma.report.create({
      data: {
        patientId: session.user.id,
        fileName: file.name,
        fileUrl: "/uploads/" + file.name,
        status: "PARSED",
        rawText: extractedText.substring(0, 5000), // Trim for DB limit
        parsedJson: JSON.stringify(parsedData),
        aiSummary: "Automated extraction using AI Data Parser.",
        reportDate: isNaN(reportDate.getTime()) ? new Date() : reportDate,
        labName: parsedData.lab_name || "BioBytes Automated Lab",
      }
    })

    if (parsedData.extracted_data && Array.isArray(parsedData.extracted_data)) {
      // Fetch all available biomarker definitions to match
      const allDefinitions = await prisma.biomarkerDefinition.findMany()
      const defMap = new Map()
      allDefinitions.forEach(def => {
        defMap.set(def.displayName, def)
      })

      const metricsToCreate = []
      
      for (const item of parsedData.extracted_data) {
        if (!item.test_key || item.value === null || item.value === undefined) continue;
        
        // Exact match required by the prompt
        const biomarkerDef = defMap.get(item.test_key)
        
        if (biomarkerDef) {
          const numValue = parseFloat(String(item.value).replace(/[^0-9.]/g, ''))
          if (isNaN(numValue)) continue;

          // Determine abnormality
          let isAbnormal = false
          if (biomarkerDef.refMin !== null && numValue < biomarkerDef.refMin) isAbnormal = true
          if (biomarkerDef.refMax !== null && numValue > biomarkerDef.refMax) isAbnormal = true

          metricsToCreate.push({
            reportId: report.id,
            biomarkerId: biomarkerDef.id,
            value: numValue,
            unit: item.unit || biomarkerDef.unit,
            isAbnormal: isAbnormal
          })
        }
      }

      if (metricsToCreate.length > 0) {
        await prisma.extractedMetric.createMany({
          data: metricsToCreate
        })
      }
    }

    return NextResponse.json({ success: true, reportId: report.id })
  } catch (error: any) {
    console.error("Extraction error:", error)
    return NextResponse.json({ error: error.message || "Failed to process the report" }, { status: 500 })
  }
}
