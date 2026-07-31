"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Stethoscope } from "lucide-react"

export default function DoctorAccessPage() {
  const router = useRouter()
  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/doctor/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code })
      })

      if (res.ok) {
        const data = await res.json()
        router.push(`/doctor/patient/${data.sessionId}`)
      } else {
        setError("Invalid or expired code")
      }
    } catch (e) {
      setError("An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-20">
      <Card className="border-t-4 border-t-emerald-500 shadow-lg">
        <CardHeader className="text-center">
          <Stethoscope className="mx-auto h-10 w-10 text-emerald-500 mb-2" />
          <CardTitle className="text-2xl">Patient Access</CardTitle>
          <CardDescription>Enter the temporary access code provided by your patient.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && <div className="text-sm font-medium text-destructive text-center bg-destructive/10 py-2 rounded">{error}</div>}
            <div className="space-y-2">
              <label htmlFor="code" className="text-sm font-medium">Access Code</label>
              <Input
                id="code"
                placeholder="BIO-XXXX-XXXX"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                required
                className="text-center font-mono text-lg tracking-widest uppercase h-14"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full h-12 text-lg bg-emerald-600 hover:bg-emerald-700" disabled={loading || !code}>
              {loading ? "Validating..." : "View Patient History"}
            </Button>
          </CardFooter>
        </form>
      </Card>
      <div className="mt-6 text-center text-sm text-muted-foreground">
        Demo tip: Try using code <strong>BIO-DEMO-1234</strong>
      </div>
    </div>
  )
}
