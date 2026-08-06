import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"
import Tesseract from "tesseract.js"
import { extractText } from "unpdf"

const prisma = new PrismaClient()

export const maxDuration = 60 

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File
    
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const mimeType = file.type

    let extractedText = ""

    // 1. TESSERACT EXTRACTION (100% Free OCR)
    if (mimeType === "application/pdf") {
      try {
        const uint8Array = new Uint8Array(buffer)
        const pdfData = await extractText(uint8Array)
        extractedText = typeof pdfData.text === "string" ? pdfData.text : (Array.isArray(pdfData.text) ? pdfData.text.join("\n") : String(pdfData.text))
      } catch (err) {
        console.warn("unpdf failed, trying Tesseract fallback", err)
        const result = await Tesseract.recognize(buffer, "eng")
        extractedText = result.data.text
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

    // Save initial report to DB
    const report = await prisma.report.create({
      data: {
        patientId: session.user.id,
        fileName: file.name,
        fileUrl: "/uploads/" + file.name,
        status: "PARSED",
        rawText: extractedText.substring(0, 5000), // Trim for DB limit
        aiSummary: "Automated extraction using deterministic Regex Engine.",
        reportDate: new Date(),
        labName: "BioBytes Automated Lab",
        parsedJson: "{}"
      }
    })

    // 2. DYNAMIC REGEX PARSER (100% Free AI Alternative)
    // Fetch all 100 available biomarker definitions
    const allDefinitions = await prisma.biomarkerDefinition.findMany()
    const metricsToCreate = []
    const parsedDataForDB: any[] = []
    
    // Normalize text to handle newlines easily
    const normalizedText = extractedText.replace(/\n/g, ' ')

    for (const biomarkerDef of allDefinitions) {
      // Build a dynamic Regex that looks for the test name, ignores up to 40 characters of junk (like ":" or spaces), and grabs the next number
      const regex = new RegExp(escapeRegExp(biomarkerDef.displayName) + "[^\\d]{0,40}?([\\d\\.]+)", "i")
      
      const match = normalizedText.match(regex)
      
      if (match && match[1]) {
        const numValue = parseFloat(match[1])
        if (!isNaN(numValue)) {
          
          // Determine abnormality algorithmically
          let isAbnormal = false
          if (biomarkerDef.refMin !== null && numValue < biomarkerDef.refMin) isAbnormal = true
          if (biomarkerDef.refMax !== null && numValue > biomarkerDef.refMax) isAbnormal = true

          metricsToCreate.push({
            reportId: report.id,
            biomarkerId: biomarkerDef.id,
            value: numValue,
            unit: biomarkerDef.unit,
            isAbnormal: isAbnormal
          })

          parsedDataForDB.push({
            test_key: biomarkerDef.displayName,
            value: numValue,
            unit: biomarkerDef.unit,
            isAbnormal: isAbnormal
          })
        }
      }
    }

    if (metricsToCreate.length > 0) {
      await prisma.extractedMetric.createMany({
        data: metricsToCreate
      })

      // Update the report with the parsed JSON data for history
      await prisma.report.update({
        where: { id: report.id },
        data: {
          parsedJson: JSON.stringify({ extracted_data: parsedDataForDB })
        }
      })
    }

    return NextResponse.json({ success: true, reportId: report.id })
  } catch (error: any) {
    console.error("Extraction error:", error)
    return NextResponse.json({ error: error.message || "Failed to process the report" }, { status: 500 })
  }
}
