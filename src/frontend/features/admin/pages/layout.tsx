import { getServerSession } from "next-auth/next"
import { authOptions } from "@backend/config/auth"
import { notFound } from "next/navigation"
import AdminSidebar from "@frontend/layouts/AdminSidebar"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "ADMIN") {
    notFound() // Completely hides the route from non-admins
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <AdminSidebar />
      <main className="flex-1 p-8 overflow-y-auto h-screen">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
