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
    include: { report: { select: { reportDate: true, labName: true } } },
    orderBy: { report: { reportDate: 'asc' } }
  })

  healthRecords.forEach(hr => {
    const dateStr = hr.report.reportDate?.toISOString() || hr.createdAt.toISOString()
    const labName = hr.report.labName || "Lab Report"
    const id = hr.id
    
    if (hr.hemoglobin !== null) {
      if (!trendsByBiomarker["HEMOGLOBIN"]) trendsByBiomarker["HEMOGLOBIN"] = { name: "Hemoglobin", code: "HEMOGLOBIN", unit: "g/dL", refMin: 13, refMax: 17, data: [] }
      trendsByBiomarker["HEMOGLOBIN"].data.push({ id, date: dateStr, value: hr.hemoglobin, isAbnormal: false, labName })
    }
    if (hr.fasting_blood_sugar !== null) {
      if (!trendsByBiomarker["FASTING_SUGAR"]) trendsByBiomarker["FASTING_SUGAR"] = { name: "Fasting Sugar", code: "FASTING_SUGAR", unit: "mg/dL", refMin: 70, refMax: 100, data: [] }
      trendsByBiomarker["FASTING_SUGAR"].data.push({ id, date: dateStr, value: hr.fasting_blood_sugar, isAbnormal: false, labName })
    }
    if (hr.thyroid_tsh !== null) {
      if (!trendsByBiomarker["TSH"]) trendsByBiomarker["TSH"] = { name: "Thyroid TSH", code: "TSH", unit: "mIU/L", refMin: 0.4, refMax: 4.0, data: [] }
      trendsByBiomarker["TSH"].data.push({ id, date: dateStr, value: hr.thyroid_tsh, isAbnormal: false, labName })
    }
    if (hr.ldl_cholesterol !== null) {
      if (!trendsByBiomarker["LDL"]) trendsByBiomarker["LDL"] = { name: "LDL Cholesterol", code: "LDL", unit: "mg/dL", refMin: 0, refMax: 99, data: [] }
      trendsByBiomarker["LDL"].data.push({ id, date: dateStr, value: hr.ldl_cholesterol, isAbnormal: false, labName })
    }
    if (hr.hdl_cholesterol !== null) {
      if (!trendsByBiomarker["HDL"]) trendsByBiomarker["HDL"] = { name: "HDL Cholesterol", code: "HDL", unit: "mg/dL", refMin: 40, refMax: 60, data: [] }
      trendsByBiomarker["HDL"].data.push({ id, date: dateStr, value: hr.hdl_cholesterol, isAbnormal: false, labName })
    }
    if (hr.triglycerides !== null) {
      if (!trendsByBiomarker["TRIGLYCERIDES"]) trendsByBiomarker["TRIGLYCERIDES"] = { name: "Triglycerides", code: "TRIGLYCERIDES", unit: "mg/dL", refMin: 0, refMax: 149, data: [] }
      trendsByBiomarker["TRIGLYCERIDES"].data.push({ id, date: dateStr, value: hr.triglycerides, isAbnormal: false, labName })
    }
    if (hr.vitamin_d !== null) {
      if (!trendsByBiomarker["VITAMIN_D"]) trendsByBiomarker["VITAMIN_D"] = { name: "Vitamin D", code: "VITAMIN_D", unit: "ng/mL", refMin: 20, refMax: 50, data: [] }
      trendsByBiomarker["VITAMIN_D"].data.push({ id, date: dateStr, value: hr.vitamin_d, isAbnormal: false, labName })
    }
    if (hr.vitamin_b12 !== null) {
      if (!trendsByBiomarker["VITAMIN_B12"]) trendsByBiomarker["VITAMIN_B12"] = { name: "Vitamin B12", code: "VITAMIN_B12", unit: "pg/mL", refMin: 200, refMax: 900, data: [] }
      trendsByBiomarker["VITAMIN_B12"].data.push({ id, date: dateStr, value: hr.vitamin_b12, isAbnormal: false, labName })
    }
  })

  return Response.json(Object.values(trendsByBiomarker))
}
