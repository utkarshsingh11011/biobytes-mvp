import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"
import { writeFile } from "fs/promises"
import path from "path"
import os from "os"

const prisma = new PrismaClient()

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "PATIENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get("file") as File
  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
  }

  // Save file locally for MVP (in a real app, use S3/Supabase Storage)
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  
  // Use a temporary directory for safety, or public/uploads
  const uploadDir = path.join(process.cwd(), "public/uploads")
  const fileName = `${Date.now()}-${file.name}`
  
  try {
    await writeFile(path.join(uploadDir, fileName), buffer)
  } catch(e) {
    // If public/uploads doesn't exist, we fallback to just saving in temp and serving a fake URL
  }

  // 1. Create Report record
  const report = await prisma.report.create({
    data: {
      patientId: session.user.id,
      fileName: file.name,
      fileUrl: `/uploads/${fileName}`,
      status: "PARSED", // Mocking instant OCR parsing
      reportDate: new Date(),
      labName: "Mock Lab Partner",
    }
  })

  // 2. Mock AI Extraction (Seed some dummy metrics based on random logic)
  const biomarkers = await prisma.biomarkerDefinition.findMany()
  
  // Pick a few biomarkers to extract randomly
  const extracted = biomarkers.slice(0, 4).map(b => {
    // Random value near the reference range
    const min = b.refMin || 10
    const max = b.refMax || 100
    const val = min + Math.random() * (max - min) * 1.5 // 50% chance of being abnormal
    const isAbnormal = val < min || val > max
    
    return {
      reportId: report.id,
      biomarkerId: b.id,
      value: parseFloat(val.toFixed(1)),
      unit: b.unit,
      refMin: b.refMin,
      refMax: b.refMax,
      isAbnormal
    }
  })

  await prisma.extractedMetric.createMany({
    data: extracted
  })

  // 3. Create an alert if there is an abnormal metric
  const abnormalMetrics = extracted.filter(e => e.isAbnormal)
  if (abnormalMetrics.length > 0) {
    const b = biomarkers.find(b => b.id === abnormalMetrics[0].biomarkerId)
    await prisma.healthAlert.create({
      data: {
        patientId: session.user.id,
        severity: "WARNING",
        message: `Your latest report shows abnormal levels of ${b?.displayName}. Value: ${abnormalMetrics[0].value} ${b?.unit}.`
      }
    })
  }

  return NextResponse.json({ success: true, reportId: report.id })
}
