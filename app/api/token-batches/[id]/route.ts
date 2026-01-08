import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET /api/token-batches/[id] - Get batch details with schedules and payments
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const batchId = parseInt(id)

    const batch = await prisma.tokenBatch.findUnique({
      where: { id: batchId },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            mobile: true,
            address: true,
          }
        },
        collector: {
          select: {
            id: true,
            name: true,
            collectorId: true,
            mobile: true,
          }
        },
        tokens: {
          select: {
            id: true,
            tokenNo: true,
            status: true,
          }
        },
        batchSchedules: {
          orderBy: {
            scheduleDate: 'asc'
          }
        },
        batchPayments: {
          orderBy: {
            createdAt: 'desc'
          },
          include: {
            schedule: {
              select: {
                scheduleDate: true,
              }
            }
          }
        }
      }
    })

    if (!batch) {
      return NextResponse.json({
        error: 'Token batch not found'
      }, { status: 404 })
    }

    // For collectors, verify access
    if (session.user.userType === 'collector') {
      if (batch.collectorId !== parseInt(session.user.id)) {
        return NextResponse.json({
          error: 'You can only view your own batches'
        }, { status: 403 })
      }
    }

    // Calculate summary
    const totalScheduled = batch.batchSchedules.reduce((sum, s) => sum + Number(s.totalDue), 0)
    const totalPaid = batch.batchSchedules.reduce((sum, s) => sum + Number(s.paidAmount), 0)
    const totalPenaltyWaived = batch.batchSchedules.reduce((sum, s) => sum + Number(s.penaltyWaived), 0)
    const totalOutstanding = totalScheduled - totalPaid - totalPenaltyWaived

    const pendingSchedules = batch.batchSchedules.filter(s => s.status === 'pending' || s.status === 'partial')
    const overdueSchedules = batch.batchSchedules.filter(s => s.status === 'overdue')
    const paidSchedules = batch.batchSchedules.filter(s => s.status === 'paid')

    // Get today's schedule
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todaySchedule = batch.batchSchedules.find(s => {
      const schedDate = new Date(s.scheduleDate)
      schedDate.setHours(0, 0, 0, 0)
      return schedDate.getTime() === today.getTime()
    })

    // Get next pending schedule
    const nextSchedule = batch.batchSchedules.find(s =>
      (s.status === 'pending' || s.status === 'partial') &&
      new Date(s.scheduleDate) >= today
    )

    return NextResponse.json({
      success: true,
      data: {
        batch,
        summary: {
          totalScheduled,
          totalPaid,
          totalPenaltyWaived,
          totalOutstanding,
          pendingCount: pendingSchedules.length,
          overdueCount: overdueSchedules.length,
          paidCount: paidSchedules.length,
          todaySchedule,
          nextSchedule,
        }
      }
    })

  } catch (error) {
    console.error('Batch Details Error:', error)
    return NextResponse.json({
      error: 'Failed to fetch batch details',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
