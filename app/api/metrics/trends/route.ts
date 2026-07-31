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

  return Response.json(Object.values(trendsByBiomarker))
}
