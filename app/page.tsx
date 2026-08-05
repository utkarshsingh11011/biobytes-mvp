import { Navbar } from "@/components/Navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ActivitySquare, FileText, LineChart, ShieldCheck, Stethoscope, UploadCloud, TestTube } from "lucide-react"
import Link from "next/link"

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center">
        {/* Hero Section */}
        <section className="w-full py-24 lg:py-32 bg-gradient-to-b from-teal-50/50 to-white dark:from-teal-950/20 dark:to-background">
          <div className="container px-4 md:px-6 max-w-6xl mx-auto text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter sm:text-5xl">
                Your health history, <br className="hidden sm:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-emerald-500">
                  digitized and shared in seconds.
                </span>
              </h1>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                Upload lab reports, track biomarkers over time, and give your doctor instant context with a secure access code.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
              <Link href="/login">
                <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-lg rounded-full shadow-lg hover:shadow-xl transition-all">
                  <UploadCloud className="mr-2 h-5 w-5" />
                  Upload First Report — Free
                </Button>
              </Link>
              <Link href="/doctor/access">
                <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-lg rounded-full border-2">
                  <Stethoscope className="mr-2 h-5 w-5" />
                  Doctor Access Code
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="w-full py-20 bg-slate-50 dark:bg-slate-900/50">
          <div className="container px-4 md:px-6 max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">How E-Health Tracker Works</h2>
              <p className="text-muted-foreground">Four simple steps to take control of your health data.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {[
                { icon: FileText, title: "1. Upload", desc: "Upload your physical or PDF lab reports." },
                { icon: ActivitySquare, title: "2. Extract", desc: "Our AI instantly parses key biomarkers." },
                { icon: LineChart, title: "3. Track", desc: "Visualize trends over 3, 6, or 12 months." },
                { icon: ShieldCheck, title: "4. Share", desc: "Generate a secure code for your doctor." },
              ].map((step, i) => (
                <div key={i} className="flex flex-col items-center text-center space-y-3">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-100 dark:bg-teal-900/50 text-teal-600 dark:text-teal-400">
                    <step.icon className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-bold">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Personas Section */}
        <section className="w-full py-20">
          <div className="container px-4 md:px-6 max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="border-t-4 border-t-blue-500 hover:shadow-md transition-shadow">
                <CardHeader>
                  <ActivitySquare className="h-8 w-8 text-blue-500 mb-2" />
                  <CardTitle>For Patients</CardTitle>
                  <CardDescription>Never lose a medical record again.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p>• Centralized health history</p>
                  <p>• Proactive health alerts</p>
                  <p>• Beautiful trend graphs</p>
                </CardContent>
              </Card>

              <Card className="border-t-4 border-t-emerald-500 hover:shadow-md transition-shadow">
                <CardHeader>
                  <Stethoscope className="h-8 w-8 text-emerald-500 mb-2" />
                  <CardTitle>For Doctors</CardTitle>
                  <CardDescription>Instant context without the friction.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p>• Access via temporary codes</p>
                  <p>• Zero registration required</p>
                  <p>• View 12-month patient history instantly</p>
                </CardContent>
              </Card>

              <Card className="border-t-4 border-t-purple-500 hover:shadow-md transition-shadow">
                <CardHeader>
                  <TestTube className="h-8 w-8 text-purple-500 mb-2" />
                  <CardTitle>For Lab Partners</CardTitle>
                  <CardDescription>Grow your diagnostic business.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p>• Integrated booking links</p>
                  <p>• Commission-based tracking</p>
                  <p>• Direct patient referrals</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
      
      <footer className="w-full border-t bg-muted/40 py-8">
        <div className="container flex flex-col md:flex-row justify-between items-center max-w-6xl mx-auto px-4 gap-4 text-sm text-muted-foreground">
          <p>© 2026 E-Health Tracker and Doctor Appointments. SIH Prototype.</p>
          <div className="flex space-x-6">
            <span className="flex items-center"><ShieldCheck className="h-4 w-4 mr-1" /> Secure & Encrypted</span>
            <span>ABHA-ready Architecture</span>
          </div>
        </div>
      </footer>
    </>
  )
}
