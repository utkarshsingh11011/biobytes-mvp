import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"
import { GoogleGenAI, Type } from "@google/genai"

const prisma = new PrismaClient()

// Note: Ensure GEMINI_API_KEY is available in your .env
const ai = new GoogleGenAI({})

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

    // Convert file to base64 buffer for Gemini
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const mimeType = file.type

    // Call Gemini 1.5 Flash using strict JSON schema output
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [
        {
          inlineData: {
            data: buffer.toString("base64"),
            mimeType: mimeType,
          },
        },
        "Extract the lab report details according to the schema.",
      ],
      config: {
        systemInstruction: "You are an expert medical data extractor. Extract the requested fields from the provided lab report.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            lab_name: { type: Type.STRING },
            report_date: { type: Type.STRING, description: "YYYY-MM-DD" },
            biomarkers: {
              type: Type.OBJECT,
              properties: {
                hemoglobin: {
                  type: Type.OBJECT,
                  properties: { value: { type: Type.NUMBER }, unit: { type: Type.STRING } },
                },
                fasting_blood_sugar: {
                  type: Type.OBJECT,
                  properties: { value: { type: Type.NUMBER }, unit: { type: Type.STRING } },
                },
                thyroid_tsh: {
                  type: Type.OBJECT,
                  properties: { value: { type: Type.NUMBER }, unit: { type: Type.STRING } },
                },
              },
            },
          },
          required: ["lab_name", "report_date", "biomarkers"],
        },
      },
    })

    const resultText = response.text
    if (!resultText) {
      throw new Error("Failed to extract data from the AI vision model.")
    }

    const parsedData = JSON.parse(resultText)

    // Hardcoded Database Routing (Strict Schema Mapping)
    // Create the base report record
    const report = await prisma.report.create({
      data: {
        patientId: session.user.id,
        fileName: file.name,
        fileUrl: "/placeholder.pdf", // Normally would be uploaded to S3/Cloudinary
        status: "PARSED",
        parsedJson: resultText,
        labName: parsedData.lab_name,
        reportDate: parsedData.report_date ? new Date(parsedData.report_date) : new Date(),
      },
    })

    // Explicitly write extracted values into designated, locked columns to prevent leakage
    const healthRecord = await prisma.userHealthRecord.create({
      data: {
        reportId: report.id,
        patientId: session.user.id,
        hemoglobin: parsedData.biomarkers?.hemoglobin?.value || null,
        fasting_blood_sugar: parsedData.biomarkers?.fasting_blood_sugar?.value || null,
        thyroid_tsh: parsedData.biomarkers?.thyroid_tsh?.value || null,
      },
    })

    return NextResponse.json({ success: true, report, healthRecord })
  } catch (error) {
    console.error("Extraction error:", error)
    return NextResponse.json({ error: "Failed to process report" }, { status: 500 })
  }
}
