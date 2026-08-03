import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "PATIENT") {
    return new Response("Unauthorized", { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const biomarkerId = searchParams.get("biomarkerId")
  const months = parseInt(searchParams.get("months") || "6")

  const dateLimit = new Date()
  dateLimit.setMonth(dateLimit.getMonth() - months)

  const whereClause: any = {
    report: {
      patientId: session.user.id,
      reportDate: { gte: dateLimit }
    }
  }

  if (biomarkerId) {
    whereClause.biomarkerId = biomarkerId
  }

  const metrics = await prisma.extractedMetric.findMany({
    where: whereClause,
    include: {
      biomarker: true,
      report: {
        select: { reportDate: true }
      }
    },
    orderBy: {
      report: { reportDate: 'asc' }
    }
  })

  // Group by biomarker
  const trendsByBiomarker: Record<string, any> = {}

  metrics.forEach(m => {
    if (!trendsByBiomarker[m.biomarker.code]) {
      trendsByBiomarker[m.biomarker.code] = {
        name: m.biomarker.displayName,
        code: m.biomarker.code,
        unit: m.unit,
        refMin: m.refMin,
        refMax: m.refMax,
        data: []
      }
    }
    trendsByBiomarker[m.biomarker.code].data.push({
      date: m.report.reportDate?.toISOString(),
      value: m.value,
      isAbnormal: m.isAbnormal
    })
  })

  // Append new AI Extracted data from UserHealthRecord
  const healthRecords = await prisma.userHealthRecord.findMany({
    where: { patientId: session.user.id, createdAt: { gte: dateLimit } },
    include: { report: { select: { reportDate: true } } },
    orderBy: { createdAt: 'asc' }
  })

  healthRecords.forEach(hr => {
    const dateStr = hr.report.reportDate?.toISOString() || hr.createdAt.toISOString()
    if (hr.hemoglobin !== null) {
      if (!trendsByBiomarker["HEMOGLOBIN"]) trendsByBiomarker["HEMOGLOBIN"] = { name: "Hemoglobin", code: "HEMOGLOBIN", unit: "g/dL", refMin: 13, refMax: 17, data: [] }
      trendsByBiomarker["HEMOGLOBIN"].data.push({ date: dateStr, value: hr.hemoglobin, isAbnormal: false })
    }
    if (hr.fasting_blood_sugar !== null) {
      if (!trendsByBiomarker["FASTING_SUGAR"]) trendsByBiomarker["FASTING_SUGAR"] = { name: "Fasting Sugar", code: "FASTING_SUGAR", unit: "mg/dL", refMin: 70, refMax: 100, data: [] }
      trendsByBiomarker["FASTING_SUGAR"].data.push({ date: dateStr, value: hr.fasting_blood_sugar, isAbnormal: false })
    }
    if (hr.thyroid_tsh !== null) {
      if (!trendsByBiomarker["TSH"]) trendsByBiomarker["TSH"] = { name: "Thyroid TSH", code: "TSH", unit: "mIU/L", refMin: 0.4, refMax: 4.0, data: [] }
      trendsByBiomarker["TSH"].data.push({ date: dateStr, value: hr.thyroid_tsh, isAbnormal: false })
    }
  })

  return Response.json(Object.values(trendsByBiomarker))
}
