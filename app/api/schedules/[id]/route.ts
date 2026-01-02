import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// PUT /api/schedules/[id] - Admin override to manually mark schedule status
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.userType !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const scheduleId = parseInt(id)
    const body = await req.json()

    // Check if schedule exists
    const existingSchedule = await prisma.repaymentSchedule.findUnique({
      where: { id: scheduleId },
      include: {
        token: true
      }
    })

    if (!existingSchedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 })
    }

    // Prepare update data
    const updateData: any = {}

    // Handle status change
    if (body.status) {
      if (!['pending', 'paid', 'partial', 'overdue'].includes(body.status)) {
        return NextResponse.json({ error: 'Invalid status value' }, { status: 400 })
      }
      updateData.status = body.status

      // If marking as paid, set paid amount to total due
      if (body.status === 'paid') {
        updateData.paidAmount = existingSchedule.totalDue
        updateData.paymentDate = new Date()
      }
    }

    // Handle manual paid amount update
    if (body.paidAmount !== undefined) {
      const paidAmount = parseFloat(body.paidAmount)
      if (paidAmount < 0) {
        return NextResponse.json({ error: 'Paid amount cannot be negative' }, { status: 400 })
      }

      updateData.paidAmount = paidAmount

      // Auto-update status based on payment
      const totalDue = Number(existingSchedule.totalDue)
      if (paidAmount >= totalDue) {
        updateData.status = 'paid'
        updateData.paymentDate = new Date()
      } else if (paidAmount > 0) {
        updateData.status = 'partial'
      } else {
        updateData.status = 'pending'
      }
    }

    // Handle penalty amount update
    if (body.penaltyAmount !== undefined) {
      const penaltyAmount = parseFloat(body.penaltyAmount)
      if (penaltyAmount < 0) {
        return NextResponse.json({ error: 'Penalty amount cannot be negative' }, { status: 400 })
      }
      updateData.penaltyAmount = penaltyAmount
      updateData.totalDue = Number(existingSchedule.installmentAmount) + penaltyAmount
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    // Update schedule
    const updatedSchedule = await prisma.repaymentSchedule.update({
      where: { id: scheduleId },
      data: updateData,
      include: {
        token: {
          include: {
            customer: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedSchedule,
      message: 'Schedule updated successfully'
    })

  } catch (error) {
    console.error('Schedule PUT Error:', error)
    return NextResponse.json({ error: 'Failed to update schedule' }, { status: 500 })
  }
}
