"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea } from 'recharts'

export default function TrendsPage() {
  const [trends, setTrends] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [months, setMonths] = useState(6)

  useEffect(() => {
    async function fetchTrends() {
      setLoading(true)
      const res = await fetch(`/api/metrics/trends?months=${months}`)
      if (res.ok) {
        const data = await res.json()
        setTrends(data)
      }
      setLoading(false)
    }
    fetchTrends()
  }, [months])

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Health Trends</h1>
          <p className="text-muted-foreground">Visualize your biomarker changes over time.</p>
        </div>
        <div>
          <select 
            value={months} 
            onChange={(e) => setMonths(Number(e.target.value))}
            className="flex h-10 w-[180px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value={3}>Last 3 Months</option>
            <option value={6}>Last 6 Months</option>
            <option value={12}>Last 12 Months</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20">Loading trends...</div>
      ) : trends.filter(t => t.data && t.data.length > 0).length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">No trend data available for this period.</div>
      ) : (
        <div className="grid gap-6">
          {trends.filter(t => t.data && t.data.length > 0).map((trend) => (
            <Card key={trend.code}>
              <CardHeader>
                <CardTitle>{trend.name}</CardTitle>
                <CardDescription>
                  Reference Range: {trend.refMin} - {trend.refMax} {trend.unit}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={trend.data}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={formatDate}
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis 
                        domain={['auto', 'auto']}
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip 
                        labelFormatter={(label: any) => formatDate(label as string)}
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
                        stroke="#0d9488" 
                        strokeWidth={3}
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
