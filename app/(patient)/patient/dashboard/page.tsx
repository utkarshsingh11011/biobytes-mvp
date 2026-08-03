import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, FileText, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ShareCodeButton } from "./ShareCodeButton"

const prisma = new PrismaClient()

export default async function PatientDashboard() {
  const session = await getServerSession(authOptions)
  const userId = session?.user.id

  if (!userId) return null

  const reports = await prisma.report.findMany({
    where: { patientId: userId },
    orderBy: { reportDate: 'desc' },
    take: 5
  })

  const alerts = await prisma.healthAlert.findMany({
    where: { patientId: userId, isRead: false },
    orderBy: { createdAt: 'desc' }
  })

  const activeCode = await prisma.doctorAccessCode.findFirst({
    where: { patientId: userId, expiresAt: { gt: new Date() }, isRevoked: false },
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, here is your health overview.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/patient/upload">
            <Button>Upload Report</Button>
          </Link>
          <ShareCodeButton initialCode={activeCode?.code} />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Alerts Panel */}
        <Card className="border-t-4 border-t-amber-500">
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2 text-amber-600 dark:text-amber-500">
              <AlertCircle className="h-5 w-5" />
              <CardTitle className="text-xl">Health Alerts</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {alerts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active alerts. You are doing great!</p>
            ) : (
              <ul className="space-y-4">
                {alerts.map((alert) => (
                  <li key={alert.id} className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-md text-sm border border-amber-100 dark:border-amber-900">
                    <span className="font-semibold text-amber-800 dark:text-amber-400">Attention needed:</span> {alert.message}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Latest Health Summary */}
        <Card className="md:col-span-2 bg-primary/5 border-primary/20">
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-primary" />
              <CardTitle className="text-xl">Latest Health Summary</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {reports[0]?.aiSummary ? (
              <p className="text-sm leading-relaxed">{reports[0].aiSummary}</p>
            ) : (
              <p className="text-sm text-muted-foreground">Upload a new report to get an AI-generated health summary.</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Reports */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-primary" />
                <CardTitle className="text-xl">Recent Reports</CardTitle>
              </div>
              <Link href="/patient/trends" className="text-sm text-primary hover:underline">
                View Trends →
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {reports.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground mb-4">You haven't uploaded any reports yet.</p>
                <Link href="/patient/upload">
                  <Button variant="outline" size="sm">Upload First Report</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {reports.map((report) => (
                  <div key={report.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium text-sm">{report.labName || "Lab Report"}</p>
                      <p className="text-xs text-muted-foreground">
                        {report.reportDate ? new Date(report.reportDate).toLocaleDateString() : 'Unknown date'}
                      </p>
                    </div>
                    <div>
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-primary/10 text-primary">
                        {report.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
