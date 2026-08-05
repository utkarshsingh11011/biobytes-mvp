import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return new Response("Unauthorized", { status: 401 })
  }

  const resolvedParams = await params
  const id = resolvedParams.id
  
  if (!id) {
    return NextResponse.json({ error: "Missing appointment ID" }, { status: 400 })
  }

  try {
    // Get the target appointment
    const targetAppointment = await prisma.appointment.findUnique({
      where: { id }
    })

    if (!targetAppointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 })
    }

    // Only ACCEPTED appointments count in the active queue
    if (targetAppointment.status !== "ACCEPTED") {
      return NextResponse.json({ position: 0, status: targetAppointment.status })
    }

    // Calculate queue position by counting ACCEPTED appointments for the same doctor, 
    // on the same day, with an earlier time.
    // For simplicity, we just count all ACCEPTED appointments scheduled before this one
    // since past un-checked appointments still count as active in the queue.
    const position = await prisma.appointment.count({
      where: {
        doctorId: targetAppointment.doctorId,
        status: "ACCEPTED",
        scheduledTime: {
          lt: targetAppointment.scheduledTime
        }
      }
    })

    // Queue position is the count of people ahead of you + 1 (you)
    return NextResponse.json({ 
      position: position + 1,
      status: targetAppointment.status 
    })

  } catch (error) {
    console.error("Queue API Error:", error)
    return NextResponse.json({ error: "Failed to fetch queue status" }, { status: 500 })
  }
}
