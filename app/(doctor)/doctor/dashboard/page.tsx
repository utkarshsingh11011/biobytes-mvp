"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar as CalendarIcon, Clock, User, QrCode } from "lucide-react"
import Link from "next/link"

export default function DoctorDashboardPage() {
  const [appointments, setAppointments] = useState<any[]>([])
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const res = await fetch("/api/appointments")
      if (res.ok) {
        setAppointments(await res.json())
      }
    } catch (e) {
      console.error(e)
    } finally {
      setFetching(false)
    }
  }

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      })
      if (res.ok) fetchData()
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Doctor Dashboard</h1>
          <p className="text-muted-foreground">Manage your upcoming patient appointments.</p>
        </div>
        <Link href="/doctor/access">
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            <QrCode className="mr-2 h-4 w-4" /> Scan Patient Access Code
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Appointments</CardTitle>
            <CardDescription>Your schedule for today and beyond.</CardDescription>
          </CardHeader>
          <CardContent>
            {fetching ? (
              <div className="flex justify-center p-4"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div></div>
            ) : appointments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                No upcoming appointments.
              </div>
            ) : (
              <div className="space-y-4">
                {appointments.map(appt => (
                  <div key={appt.id} className="flex flex-col space-y-3 p-4 border rounded-lg bg-card">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-2">
                        <div className="bg-emerald-100 p-2 rounded-full">
                          <User className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div>
                          <p className="font-medium">{appt.patient?.name}</p>
                          <p className="text-xs text-muted-foreground">Status: <span className="text-emerald-600 font-medium">{appt.status}</span></p>
                        </div>
                      </div>
                      
                      {appt.status === "PENDING" && (
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline" className="h-8" onClick={() => handleUpdateStatus(appt.id, "REJECTED")}>Decline</Button>
                          <Button size="sm" className="h-8 bg-emerald-600 hover:bg-emerald-700" onClick={() => handleUpdateStatus(appt.id, "ACCEPTED")}>Accept</Button>
                        </div>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground pt-2 border-t">
                      <div className="flex items-center">
                        <CalendarIcon className="mr-2 h-3 w-3" />
                        {new Date(appt.scheduledTime).toLocaleDateString()}
                      </div>
                      <div className="flex items-center">
                        <Clock className="mr-2 h-3 w-3" />
                        {new Date(appt.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    
                    {appt.accessCode && appt.status === "ACCEPTED" && (
                      <div className="mt-2 bg-slate-50 text-slate-700 text-xs px-3 py-2 rounded flex items-center justify-between border">
                        <div className="flex items-center">
                          PIN provided: <strong className="ml-1 tracking-widest">{appt.accessCode}</strong>
                        </div>
                        <Link href={`/doctor/access?code=${appt.accessCode}`}>
                          <Button variant="link" size="sm" className="h-auto p-0">
                            Access File
                          </Button>
                        </Link>
                      </div>
                    )}
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
