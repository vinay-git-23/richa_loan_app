import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// PUT /api/batch-schedules/[id] - Update batch schedule (penalty, status, etc.)
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
    const existingSchedule = await prisma.batchRepaymentSchedule.findUnique({
      where: { id: scheduleId },
      include: {
        batch: {
          select: {
            id: true,
            quantity: true,
            batchNo: true,
          },
        },
      },
    })

    if (!existingSchedule) {
      return NextResponse.json({ error: 'Batch schedule not found' }, { status: 404 })
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

    // Handle penalty updates
    if (body.penaltyPerToken !== undefined || body.totalPenalty !== undefined) {
      let penaltyPerToken = Number(body.penaltyPerToken || existingSchedule.penaltyPerToken)
      let totalPenalty = Number(body.totalPenalty || existingSchedule.totalPenalty)

      // If only one is provided, calculate the other
      if (body.penaltyPerToken !== undefined && body.totalPenalty === undefined) {
        totalPenalty = penaltyPerToken * existingSchedule.batch.quantity
      } else if (body.totalPenalty !== undefined && body.penaltyPerToken === undefined) {
        penaltyPerToken = totalPenalty / existingSchedule.batch.quantity
      }

      if (penaltyPerToken < 0 || totalPenalty < 0) {
        return NextResponse.json({ error: 'Penalty amounts cannot be negative' }, { status: 400 })
      }

      updateData.penaltyPerToken = penaltyPerToken
      updateData.totalPenalty = totalPenalty
      updateData.totalDue = Number(existingSchedule.installmentAmount) + totalPenalty
    }

    // Handle penalty waived
    if (body.penaltyWaived !== undefined) {
      const penaltyWaived = parseFloat(body.penaltyWaived)
      if (penaltyWaived < 0) {
        return NextResponse.json({ error: 'Penalty waived cannot be negative' }, { status: 400 })
      }
      if (penaltyWaived > Number(existingSchedule.totalPenalty)) {
        return NextResponse.json({ error: 'Penalty waived cannot exceed total penalty' }, { status: 400 })
      }
      updateData.penaltyWaived = penaltyWaived
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
      const penaltyWaived = Number(updateData.penaltyWaived ?? existingSchedule.penaltyWaived)
      const totalReceived = paidAmount + penaltyWaived

      if (totalReceived >= totalDue) {
        updateData.status = 'paid'
        updateData.paymentDate = new Date()
      } else if (paidAmount > 0) {
        updateData.status = 'partial'
      } else {
        updateData.status = 'pending'
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    // Update schedule
    const updatedSchedule = await prisma.batchRepaymentSchedule.update({
      where: { id: scheduleId },
      data: updateData,
      include: {
        batch: {
          include: {
            customer: {
              select: {
                name: true,
                mobile: true,
              },
            },
            collector: {
              select: {
                name: true,
                collectorId: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: updatedSchedule,
      message: 'Batch schedule updated successfully',
    })
  } catch (error) {
    console.error('Batch Schedule PUT Error:', error)
    return NextResponse.json({ error: 'Failed to update batch schedule' }, { status: 500 })
  }
}

