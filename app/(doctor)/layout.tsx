import Link from "next/link"
import { Activity } from "lucide-react"

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-900/50">
      <header className="sticky top-0 z-30 flex h-16 items-center border-b bg-background px-4 md:px-6">
        <Link href="/" className="flex items-center space-x-2">
          <Activity className="h-6 w-6 text-emerald-600" />
          <span className="font-bold text-xl tracking-tight">BioBytes <span className="text-emerald-600 font-medium">Doctor Portal</span></span>
        </Link>
      </header>
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        {children}
      </main>
    </div>
  )
}
