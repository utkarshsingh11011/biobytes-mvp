"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea } from 'recharts'

export default function DoctorTrendsChart({ metrics }: { metrics: any[] }) {
  // Group metrics by biomarker
  const trendsByBiomarker: Record<string, any> = {}

  // Sort metrics chronologically ascending so graph goes left to right
  const sortedMetrics = [...metrics].sort((a, b) => new Date(a.report.reportDate).getTime() - new Date(b.report.reportDate).getTime())

  sortedMetrics.forEach(m => {
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
      date: new Date(m.report.reportDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }),
      value: m.value,
      isAbnormal: m.isAbnormal
    })
  })

  const trends = Object.values(trendsByBiomarker).filter((t: any) => t.data.length > 0)

  if (trends.length === 0) {
    return <p className="text-muted-foreground">No trend data available.</p>
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {trends.map((trend: any) => (
        <Card key={trend.code} className="border-emerald-100 dark:border-emerald-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">{trend.name}</CardTitle>
            <CardDescription>
              Range: {trend.refMin} - {trend.refMax} {trend.unit}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={trend.data}
                  margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 10, fill: '#6b7280' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    domain={['auto', 'auto']}
                    tick={{ fontSize: 10, fill: '#6b7280' }}
                    axisLine={false}
                    tickLine={false}
                    width={40}
                  />
                  <Tooltip 
                    formatter={(value: any) => [`${value} ${trend.unit}`, trend.name]}
                  />
                  {trend.refMin !== null && trend.refMax !== null && (
                    <ReferenceArea 
                      y1={trend.refMin} 
                      y2={trend.refMax} 
                      fill="#10b981" 
                      fillOpacity={0.1} 
                    />
                  )}
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#059669" 
                    strokeWidth={2}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
