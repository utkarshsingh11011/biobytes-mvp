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
  if (months === 3) dateLimit.setDate(dateLimit.getDate() - 90)
  else if (months === 6) dateLimit.setDate(dateLimit.getDate() - 180)
  else dateLimit.setDate(dateLimit.getDate() - 365)

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
        select: { reportDate: true, labName: true }
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
        refMin: m.refMin !== null ? m.refMin : m.biomarker.refMin,
        refMax: m.refMax !== null ? m.refMax : m.biomarker.refMax,
        data: []
      }
    }
    trendsByBiomarker[m.biomarker.code].data.push({
      id: m.id,
      date: m.report.reportDate?.toISOString(),
      value: m.value,
      isAbnormal: m.isAbnormal,
      labName: m.report.labName || "Lab Report"
    })
  })


  const finalTrends = Object.values(trendsByBiomarker).map((trend: any) => {
    const uniqueData = new Map()
    trend.data.forEach((d: any) => {
      const key = `${d.date}_${d.value}`
      if (!uniqueData.has(key)) {
        uniqueData.set(key, d)
      }
    })
    trend.data = Array.from(uniqueData.values())
    trend.data.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
    return trend
  })

  return Response.json(finalTrends)
}
