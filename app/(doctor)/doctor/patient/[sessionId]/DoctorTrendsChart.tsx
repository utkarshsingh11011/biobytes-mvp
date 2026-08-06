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
        <Card key={trend.code} className="overflow-hidden bg-background/60 backdrop-blur-xl border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent pb-4">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg text-primary">{trend.name}</CardTitle>
                <CardDescription className="font-medium mt-1">
                  Extracted Biomarker
                </CardDescription>
              </div>
              {trend.refMin !== null && trend.refMax !== null && (
                <div className="text-right">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Reference Range</span>
                  <span className="text-sm font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                    {trend.refMin} - {trend.refMax} {trend.unit}
                  </span>
                </div>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            <div className="h-[280px] w-full p-4 relative">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={trend.data}
                  margin={{ top: 20, right: 30, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    domain={[
                      (dataMin: number) => {
                        if (trend.refMin !== null) return Math.floor(Math.min(dataMin, trend.refMin * 0.9));
                        return Math.floor(dataMin * 0.9);
                      },
                      (dataMax: number) => {
                        if (trend.refMax !== null) return Math.ceil(Math.max(dataMax, trend.refMax * 1.1));
                        return Math.ceil(dataMax * 1.1);
                      }
                    ]}
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    axisLine={false}
                    tickLine={false}
                    width={40}
                  />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload
                        return (
                          <div className="bg-background/95 backdrop-blur-md p-3 border border-border/50 rounded-xl shadow-xl text-sm">
                            <p className="font-bold text-foreground">{data.date}</p>
                            <p className="text-muted-foreground text-xs mb-1">Lab Report</p>
                            <p className="text-primary font-bold text-lg">{`${data.value} ${trend.unit}`}</p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  {trend.refMin !== null && trend.refMax !== null && (
                    <ReferenceArea 
                      y1={trend.refMin} 
                      y2={trend.refMax} 
                      fill="#10b981" 
                      fillOpacity={0.08} 
                    />
                  )}
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={4}
                    activeDot={{ r: 8, fill: "hsl(var(--primary))", stroke: "white", strokeWidth: 2 }}
                    dot={{ r: 4, fill: "hsl(var(--primary))", strokeWidth: 0 }}
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
