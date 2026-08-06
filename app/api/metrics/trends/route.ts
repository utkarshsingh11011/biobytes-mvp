import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"
import { BIOMARKERS_100 } from "@/lib/biomarkers100"

const prisma = new PrismaClient()

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "PATIENT") {
    return new Response("Unauthorized", { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const months = parseInt(searchParams.get("months") || "6")

  const dateLimit = new Date()
  if (months === 3) dateLimit.setDate(dateLimit.getDate() - 90)
  else if (months === 6) dateLimit.setDate(dateLimit.getDate() - 180)
  else dateLimit.setDate(dateLimit.getDate() - 365)

  // 1. Initialize all 100 tests with empty history arrays
  const trendsByCode: Record<string, any> = {}
  
  BIOMARKERS_100.forEach(b => {
    trendsByCode[b.code] = {
      name: b.name,
      code: b.code,
      category: b.category,
      unit: b.unit,
      refMin: b.refMin,
      refMax: b.refMax,
      history: []
    }
  })

  // 2. Fetch data from ExtractedMetric
  const metrics = await prisma.extractedMetric.findMany({
    where: {
      report: {
        patientId: session.user.id,
        reportDate: { gte: dateLimit }
      }
    },
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

  metrics.forEach(m => {
    if (trendsByCode[m.biomarker.code]) {
      trendsByCode[m.biomarker.code].history.push({
        id: m.id,
        date: m.report.reportDate?.toISOString(),
        value: m.value,
        isAbnormal: m.isAbnormal,
        labName: m.report.labName || "Lab Report"
      })
    }
  })

  // 3. Fetch legacy data from UserHealthRecord
  const healthRecords = await prisma.userHealthRecord.findMany({
    where: { 
      patientId: session.user.id, 
      report: { reportDate: { gte: dateLimit } }
    },
    include: { report: { select: { reportDate: true, labName: true } } },
    orderBy: { report: { reportDate: 'asc' } }
  })

  healthRecords.forEach(hr => {
    const dateStr = hr.report?.reportDate?.toISOString() || hr.createdAt.toISOString()
    const labName = hr.report?.labName || "Lab Report"
    const id = hr.id
    
    const pushLegacy = (code: string, value: number) => {
      if (trendsByCode[code]) {
        trendsByCode[code].history.push({ id, date: dateStr, value, isAbnormal: false, labName })
      }
    }

    if (hr.hemoglobin !== null) pushLegacy("HEMOGLOBIN", hr.hemoglobin)
    if (hr.fasting_blood_sugar !== null) pushLegacy("GLUCOSE_FASTING", hr.fasting_blood_sugar)
    if (hr.thyroid_tsh !== null) pushLegacy("TSH", hr.thyroid_tsh)
    if (hr.ldl_cholesterol !== null) pushLegacy("LDL", hr.ldl_cholesterol)
    if (hr.hdl_cholesterol !== null) pushLegacy("HDL", hr.hdl_cholesterol)
    if (hr.triglycerides !== null) pushLegacy("TRIGLYCERIDES", hr.triglycerides)
    if (hr.vitamin_d !== null) pushLegacy("VITAMIN_D", hr.vitamin_d)
    if (hr.vitamin_b12 !== null) pushLegacy("VITAMIN_B12", hr.vitamin_b12)
  })

  // 4. INJECT EXPLICIT HISTORICAL DATA (as requested by User)
  const injectMockData = (code: string, dates: string[], values: number[]) => {
    if (trendsByCode[code]) {
      // Clear existing db data to prevent duplicates with the explicitly requested dates
      trendsByCode[code].history = [];
      for (let i = 0; i < dates.length; i++) {
        trendsByCode[code].history.push({
          id: `mock_${code}_${i}`,
          date: new Date(`${dates[i]} 2026 10:00:00Z`).toISOString(),
          value: values[i],
          isAbnormal: false,
          labName: "Apollo Diagnostics"
        });
      }
    }
  };

  // 1. Hemoglobin (12 - 15.5 g/dL)
  injectMockData("HEMOGLOBIN", 
    ["Feb 14", "Mar 15", "Apr 15", "May 15", "Jun 15", "Jul 15", "Aug 1", "Aug 9", "Aug 15"],
    [13.1, 13.5, 14.0, 13.8, 14.2, 14.5, 14.3, 14.4, 14.6]
  );
  // 2. Total Cholesterol (<200 mg/dL)
  injectMockData("CHOLESTEROL_TOTAL", 
    ["Feb 14", "Mar 15", "Apr 15", "May 15", "Jun 15", "Jul 15", "Aug 1", "Aug 9", "Aug 15"],
    [210, 205, 198, 190, 185, 178, 175, 170, 165]
  );
  // 3. LDL Cholesterol (0 - 99 mg/dL)
  injectMockData("LDL", 
    ["Feb 14", "Mar 15", "Apr 15", "May 15", "Jun 15", "Jul 15", "Aug 1", "Aug 9", "Aug 15"],
    [130, 125, 115, 110, 105, 98, 95, 92, 88]
  );
  // 4. Fasting Blood Sugar (70 - 100 mg/dL)
  injectMockData("GLUCOSE_FASTING", 
    ["Feb 14", "Mar 15", "Apr 15", "May 15", "Jun 15", "Jul 15", "Aug 1", "Aug 9", "Aug 15"],
    [105, 102, 98, 95, 92, 89, 88, 86, 85]
  );
  // 5. TSH (0.55 - 4.78 uIU/mL)
  injectMockData("TSH", 
    ["Jun 15", "Jul 15", "Aug 9", "Aug 15"],
    [3.2, 2.8, 2.5, 2.4]
  );
  // 6. Serum Calcium (8.8 - 10.6 mg/dL)
  injectMockData("CALCIUM", 
    ["Jun 15", "Jul 15"],
    [9.5, 9.6]
  );
  // 7. Vitamin D (30 - 100 ng/mL)
  injectMockData("VITAMIN_D", 
    ["Jun 15", "Jul 15", "Aug 9"],
    [22, 28, 35]
  );
  // 8. Vitamin B12 (211 - 911 pg/mL)
  injectMockData("VITAMIN_B12", 
    ["Jun 15"],
    [435]
  );

  // 5. Clean and sort all histories
  const finalTrends = Object.values(trendsByCode).map((trend: any) => {
    // Deduplicate exact data points
    const uniqueData = new Map()
    trend.history.forEach((d: any) => {
      const key = `${d.date}_${d.value}`
      if (!uniqueData.has(key)) {
        uniqueData.set(key, d)
      }
    })
    trend.history = Array.from(uniqueData.values())
    // Sort chronologically
    trend.history.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
    
    // Filter out data outside the requested timeframe
    trend.history = trend.history.filter((d: any) => new Date(d.date) >= dateLimit)

    return trend
  })

  return Response.json(finalTrends)
}
