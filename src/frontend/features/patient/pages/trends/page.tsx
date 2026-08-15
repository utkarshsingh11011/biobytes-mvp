import { getServerSession } from "next-auth/next"
import { authOptions } from "@backend/config/auth"
import { PrismaClient } from "@prisma/client"
import { PatientTrendsDashboard } from "@frontend/components/PatientTrendsDashboard"

const prisma = new PrismaClient()

export default async function TrendsPage() {
  const session = await getServerSession(authOptions)
  let gender = "unknown"
  
  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { gender: true }
    })
    if (user?.gender) {
      gender = user.gender.toLowerCase()
    }
  }

  return <PatientTrendsDashboard gender={gender} />
}
