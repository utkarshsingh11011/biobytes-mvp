import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"
import Tesseract from "tesseract.js"

// Polyfill DOMMatrix for pdf-parse in Next.js Serverless environments
if (typeof global !== "undefined" && !(global as any).DOMMatrix) {
  (global as any).DOMMatrix = class DOMMatrix {
    constructor() {}
  }
}

const pdfParse = require("pdf-parse")

const prisma = new PrismaClient()

export const maxDuration = 60 // Allow longer execution time for Vercel Serverless

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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
      const pdfData = await pdfParse(buffer)
      extractedText = pdfData.text
    } else if (mimeType.startsWith("image/")) {
      const result = await Tesseract.recognize(buffer, "eng")
      extractedText = result.data.text
    } else {
      return NextResponse.json({ error: "Unsupported file type. Please upload a PDF, JPG, or PNG." }, { status: 400 })
    }

    if (!extractedText.trim()) {
      throw new Error("Could not extract any text from the document.")
    }

    // REGEX PARSING LOGIC
    const parsedData: any = {
      patient_name: null,
      lab_name: "BioBytes Automated Lab",
      report_date: new Date().toISOString().split('T')[0],
      overall_summary: "Automated extraction using Tesseract.js and PDF-Parse.",
      biomarkers: []
    }

    // Try to extract patient name
    const nameMatch = extractedText.match(/(?:name|patient name|patient)\s*[:\-]?\s*([A-Za-z\s]+)/i)
    if (nameMatch && nameMatch[1]) {
      // Take only the first 30 chars in case it over-matched
      parsedData.patient_name = nameMatch[1].trim().substring(0, 30)
    }

    const extractBiomarker = (regexes: RegExp[], name: string, unit: string) => {
      for (const regex of regexes) {
        const match = extractedText.match(regex)
        if (match && match[1]) {
          const value = parseFloat(match[1])
          if (!isNaN(value)) {
            parsedData.biomarkers.push({
              name,
              value,
              unit,
              isAbnormal: false // Can't easily regex ref ranges, we will let default db schema handle or default to false
            })
            break
          }
        }
      }
    }

    // HEMOGLOBIN
    extractBiomarker([
      /(?:hemoglobin|hb|haemoglobin)[\s\:]+([\d\.]+)/i,
    ], "Hemoglobin", "g/dL")

    // FASTING SUGAR
    extractBiomarker([
      /(?:fasting blood sugar|fbs|fasting plasma glucose|fpg)[\s\:]+([\d\.]+)/i,
    ], "Fasting Blood Sugar", "mg/dL")

    // CHOLESTEROL
    extractBiomarker([
      /(?:total cholesterol|cholesterol total|cholesterol)[\s\:]+([\d\.]+)/i,
    ], "Total Cholesterol", "mg/dL")

    // TSH
    extractBiomarker([
      /(?:tsh|thyroid stimulating hormone)[\s\:]+([\d\.]+)/i,
    ], "Thyroid TSH", "uIU/mL")

    // VITAMIN D
    extractBiomarker([
      /(?:vitamin d|vit d|25-oh vitamin d)[\s\:]+([\d\.]+)/i,
    ], "Vitamin D", "ng/mL")

    // VITAMIN B12
    extractBiomarker([
      /(?:vitamin b12|vit b12)[\s\:]+([\d\.]+)/i,
    ], "Vitamin B12", "pg/mL")

    // CALCIUM
    extractBiomarker([
      /(?:calcium|total calcium)[\s\:]+([\d\.]+)/i,
    ], "Calcium", "mg/dL")

    // Identity Verification
    const reportPatientName = (parsedData.patient_name || "").toLowerCase()
    const accountPatientName = (session.user.name || "").toLowerCase()
    
    // Check if there is any overlap in the names (e.g. "Sankalp Verma" vs "Sankalp")
    if (reportPatientName && accountPatientName) {
      const reportNameParts = reportPatientName.split(" ").filter(Boolean)
      const isMatch = reportNameParts.some((part: string) => accountPatientName.includes(part))
      
      if (!isMatch) {
        return NextResponse.json({ 
          error: `Identity mismatch. The report belongs to "${parsedData.patient_name}", but this account belongs to "${session.user.name}". For security, this upload was blocked.` 
        }, { status: 403 })
      }
    }

    // Hardcoded Database Routing (Strict Schema Mapping)
    const report = await prisma.report.create({
      data: {
        patientId: session.user.id,
        fileName: file.name,
        fileUrl: "/placeholder.pdf", // Normally would be uploaded to S3/Cloudinary
        status: "PARSED",
        parsedJson: JSON.stringify(parsedData), // Save parsed JSON string instead of raw text
        aiSummary: parsedData.overall_summary || null,
        labName: parsedData.lab_name,
        reportDate: parsedData.report_date ? new Date(parsedData.report_date) : new Date(),
      },
    })

    // Dynamic Biomarker Routing
    if (parsedData.biomarkers && Array.isArray(parsedData.biomarkers)) {
      for (const b of parsedData.biomarkers) {
        if (!b.name || b.value === null || b.value === undefined) continue;

        const BIOMARKER_MAP: Record<string, { code: string, displayName: string }> = {
          "hemoglobin": { code: "HEMOGLOBIN", displayName: "Hemoglobin" },
          "fasting blood sugar": { code: "FASTING_SUGAR", displayName: "Fasting Blood Sugar" },
          "total cholesterol": { code: "CHOLESTEROL", displayName: "Total Cholesterol" },
          "thyroid tsh": { code: "TSH", displayName: "Thyroid TSH" },
          "calcium": { code: "CALCIUM", displayName: "Calcium" },
          "vitamin d": { code: "VITAMIN_D", displayName: "Vitamin D" },
          "vitamin b12": { code: "VITAMIN_B12", displayName: "Vitamin B12" }
        };

        const cleanName = b.name.toLowerCase().trim();
        
        let code = b.name.toUpperCase().replace(/[^A-Z0-9]/g, '_');
        let finalDisplayName = b.name;

        for (const [key, mapping] of Object.entries(BIOMARKER_MAP)) {
          if (cleanName.includes(key)) {
            code = mapping.code;
            finalDisplayName = mapping.displayName;
            break;
          }
        }

        let biomarkerDef = await prisma.biomarkerDefinition.findFirst({
          where: { code }
        });

        if (!biomarkerDef) {
          biomarkerDef = await prisma.biomarkerDefinition.create({
            data: {
              code,
              displayName: finalDisplayName,
              unit: b.unit || "",
              category: "Extracted",
            }
          });
        }

        await prisma.extractedMetric.create({
          data: {
            reportId: report.id,
            biomarkerId: biomarkerDef.id,
            value: b.value,
            unit: b.unit || biomarkerDef.unit,
            refMin: biomarkerDef.refMin,
            refMax: biomarkerDef.refMax,
            isAbnormal: b.isAbnormal || false,
          }
        });
      }
    }

    const healthRecord = await prisma.userHealthRecord.create({
      data: {
        reportId: report.id,
        patientId: session.user.id,
      },
    })

    return NextResponse.json({ success: true, report, healthRecord })
  } catch (error: any) {
    console.error("Extraction error:", error)
    return NextResponse.json({ error: error?.message || "Failed to process report" }, { status: 500 })
  }
}
