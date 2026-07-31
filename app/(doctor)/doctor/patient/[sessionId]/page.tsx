import { PrismaClient } from "@prisma/client"
import { notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, User, FileText } from "lucide-react"

const prisma = new PrismaClient()

export default async function DoctorPatientView({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId: code } = await params

  // Validate the code
  const accessCode = await prisma.doctorAccessCode.findUnique({
    where: { code },
    include: { patient: true }
  })

  if (!accessCode || accessCode.isRevoked || accessCode.expiresAt < new Date()) {
    notFound()
  }

  const patientId = accessCode.patientId
  const patient = accessCode.patient

  // Fetch 6 months of reports
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  const reports = await prisma.report.findMany({
    where: { patientId, reportDate: { gte: sixMonthsAgo } },
    orderBy: { reportDate: 'desc' }
  })

  const metrics = await prisma.extractedMetric.findMany({
    where: {
      report: { patientId, reportDate: { gte: sixMonthsAgo } }
    },
    include: { biomarker: true, report: true },
    orderBy: { report: { reportDate: 'desc' } }
  })

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center bg-emerald-50 dark:bg-emerald-950/30 p-4 rounded-lg border border-emerald-100 dark:border-emerald-900">
        <div className="flex items-center space-x-4">
          <div className="bg-emerald-100 dark:bg-emerald-800 p-3 rounded-full">
            <User className="h-8 w-8 text-emerald-600 dark:text-emerald-300" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{patient.name}</h1>
            <p className="text-muted-foreground text-sm">{patient.email} | Shared via Access Code</p>
          </div>
        </div>
        <div className="text-right text-sm text-emerald-700 dark:text-emerald-400 font-medium">
          Session expires: {new Date(accessCode.expiresAt).toLocaleString()}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center">
              <AlertCircle className="mr-2 h-5 w-5 text-destructive" /> Abnormal Flags (Last 6 Months)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.filter(m => m.isAbnormal).length === 0 ? (
              <p className="text-muted-foreground">No abnormal biomarkers found.</p>
            ) : (
              <ul className="space-y-3">
                {metrics.filter(m => m.isAbnormal).map(m => (
                  <li key={m.id} className="flex justify-between items-center border-b pb-2 last:border-0">
                    <div>
                      <span className="font-medium">{m.biomarker.displayName}</span>
                      <p className="text-xs text-muted-foreground">{new Date(m.report.reportDate!).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-destructive">{m.value} {m.unit}</span>
                      <p className="text-xs text-muted-foreground">Ref: {m.refMin}-{m.refMax}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center">
              <FileText className="mr-2 h-5 w-5 text-primary" /> Reports History
            </CardTitle>
          </CardHeader>
          <CardContent>
             {reports.length === 0 ? (
              <p className="text-muted-foreground">No reports found.</p>
            ) : (
              <ul className="space-y-3">
                {reports.map(r => (
                  <li key={r.id} className="flex justify-between items-center border-b pb-2 last:border-0">
                    <div>
                      <span className="font-medium">{r.labName || "Lab Report"}</span>
                      <p className="text-xs text-muted-foreground">{new Date(r.reportDate!).toLocaleDateString()}</p>
                    </div>
                    <div className="text-sm font-medium text-emerald-600 bg-emerald-100 px-2 py-1 rounded">
                      Available
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Basic Trend Table View for Doctor */}
      <Card>
        <CardHeader>
          <CardTitle>Biomarker Trends Overview</CardTitle>
          <CardDescription>Latest values compared to previous tests.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                <tr>
                  <th className="px-4 py-3 rounded-tl-lg">Biomarker</th>
                  <th className="px-4 py-3">Latest Value</th>
                  <th className="px-4 py-3">Previous Value</th>
                  <th className="px-4 py-3">Reference Range</th>
                  <th className="px-4 py-3 rounded-tr-lg">Status</th>
                </tr>
              </thead>
              <tbody>
                {Array.from(new Set(metrics.map(m => m.biomarker.code))).map(code => {
                  const bMetrics = metrics.filter(m => m.biomarker.code === code)
                  const latest = bMetrics[0]
                  const previous = bMetrics[1]

                  return (
                    <tr key={code} className="border-b last:border-0">
                      <td className="px-4 py-3 font-medium">{latest.biomarker.displayName}</td>
                      <td className={`px-4 py-3 font-bold ${latest.isAbnormal ? 'text-destructive' : ''}`}>
                        {latest.value} {latest.unit}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {previous ? `${previous.value} ${previous.unit}` : '-'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {latest.refMin} - {latest.refMax}
                      </td>
                      <td className="px-4 py-3">
                        {latest.isAbnormal ? (
                          <span className="text-destructive bg-destructive/10 px-2 py-1 rounded text-xs font-semibold">OUT OF RANGE</span>
                        ) : (
                          <span className="text-emerald-600 bg-emerald-100 px-2 py-1 rounded text-xs font-semibold">NORMAL</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
