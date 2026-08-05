"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Activity } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { BackButton } from "@/components/BackButton"

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const formData = new FormData(e.currentTarget)
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const role = formData.get("role") as string

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password, role }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Registration failed")
      }

      // Automatically redirect to login page after successful registration
      router.push("/login?registered=true")
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-950">
      <div className="w-full max-w-md absolute top-4 left-4">
        <BackButton />
      </div>
      <div className="w-full max-w-md space-y-8">
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center space-x-2">
            <Activity className="h-8 w-8 text-primary" />
            <span className="font-bold text-2xl tracking-tight">E-Health Tracker</span>
          </Link>
        </div>
        
        <Card>
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold tracking-tight">
              Create an Account
            </CardTitle>
            <CardDescription>
              Enter your details to register for a new account
            </CardDescription>
          </CardHeader>
          <form onSubmit={onSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none" htmlFor="name">Full Name</label>
                <Input id="name" name="name" type="text" placeholder="John Doe" required disabled={loading} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none" htmlFor="email">Email</label>
                <Input id="email" name="email" type="email" placeholder="name@example.com" required disabled={loading} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none" htmlFor="password">Password</label>
                <Input id="password" name="password" type="password" required disabled={loading} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none" htmlFor="role">Account Type</label>
                <select 
                  id="role" 
                  name="role" 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={loading}
                >
                  <option value="PATIENT">Patient</option>
                  <option value="DOCTOR">Doctor</option>
                </select>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating account..." : "Sign Up"}
              </Button>
              <div className="text-sm text-center text-muted-foreground mt-4">
                Already have an account?{" "}
                <Link href="/login" className="text-primary hover:underline">
                  Sign In
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
