import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { addDays, startOfDay, isBefore } from 'date-fns'

/**
 * Auto OD & Penalty Processing Cron Job
 * This API should be called daily (via cron/scheduler) to:
 * 1. Mark overdue schedules
 * 2. Apply penalties to overdue schedules
 * 3. Update token status to 'overdue' if needed
 */

export async function POST(req: NextRequest) {
  try {
    // Security: Check for cron secret or admin auth
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'your-secret-key'

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const today = startOfDay(new Date())
    let processedSchedules = 0
    let penaltiesApplied = 0
    let tokensMarkedOverdue = 0

    // Step 1: Get active penalty configuration
    const penaltyConfig = await prisma.penaltyConfig.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    })

    if (!penaltyConfig) {
      return NextResponse.json({
        success: false,
        error: 'No active penalty configuration found'
      }, { status: 400 })
    }

    // Step 2: Find all pending schedules that are overdue
    const overdueSchedules = await prisma.repaymentSchedule.findMany({
      where: {
        status: 'pending',
        scheduleDate: {
          lt: today
        },
        token: {
          status: {
            in: ['active', 'overdue']
          }
        }
      },
      include: {
        token: {
          include: {
            customer: true,
            collector: true
          }
        }
      }
    })

    // Step 3: Process each overdue schedule
    for (const schedule of overdueSchedules) {
      const scheduleDate = startOfDay(new Date(schedule.scheduleDate))
      const daysOverdue = Math.floor((today.getTime() - scheduleDate.getTime()) / (1000 * 60 * 60 * 24))

      // Check grace period
      if (daysOverdue <= penaltyConfig.graceDays) {
        continue
      }

      // Calculate penalty
      let penaltyAmount = 0
      if (penaltyConfig.penaltyType === 'fixed') {
        penaltyAmount = Number(penaltyConfig.penaltyValue)
      } else {
        // Percentage of installment amount
        penaltyAmount = (Number(schedule.installmentAmount) * Number(penaltyConfig.penaltyValue)) / 100
      }

      // Update schedule to overdue with penalty
      await prisma.repaymentSchedule.update({
        where: { id: schedule.id },
        data: {
          status: 'overdue',
          penaltyAmount: penaltyAmount,
          totalDue: Number(schedule.installmentAmount) + penaltyAmount
        }
      })

      processedSchedules++
      penaltiesApplied += penaltyAmount

      // Update token status to overdue if not already
      if (schedule.token.status === 'active') {
        await prisma.token.update({
          where: { id: schedule.tokenId },
          data: { status: 'overdue' }
        })
        tokensMarkedOverdue++
      }
    }

    // Step 4: Check for partial payments that are now overdue
    const partialSchedules = await prisma.repaymentSchedule.findMany({
      where: {
        status: 'partial',
        scheduleDate: {
          lt: today
        },
        token: {
          status: {
            in: ['active', 'overdue']
          }
        }
      }
    })

    for (const schedule of partialSchedules) {
      const scheduleDate = startOfDay(new Date(schedule.scheduleDate))
      const daysOverdue = Math.floor((today.getTime() - scheduleDate.getTime()) / (1000 * 60 * 60 * 24))

      if (daysOverdue > penaltyConfig.graceDays) {
        const remainingAmount = Number(schedule.totalDue) - Number(schedule.paidAmount)
        let penaltyAmount = Number(schedule.penaltyAmount)

        if (penaltyAmount === 0) {
          // Apply penalty for first time
          if (penaltyConfig.penaltyType === 'fixed') {
            penaltyAmount = Number(penaltyConfig.penaltyValue)
          } else {
            penaltyAmount = (remainingAmount * Number(penaltyConfig.penaltyValue)) / 100
          }

          await prisma.repaymentSchedule.update({
            where: { id: schedule.id },
            data: {
              status: 'overdue',
              penaltyAmount: penaltyAmount,
              totalDue: remainingAmount + penaltyAmount
            }
          })

          processedSchedules++
          penaltiesApplied += penaltyAmount
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Overdue processing completed',
      data: {
        processedSchedules,
        penaltiesApplied,
        tokensMarkedOverdue,
        penaltyConfig: {
          type: penaltyConfig.penaltyType,
          value: Number(penaltyConfig.penaltyValue),
          graceDays: penaltyConfig.graceDays
        }
      }
    })

  } catch (error) {
    console.error('Process Overdue Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to process overdue schedules'
    }, { status: 500 })
  }
}

// Manual trigger endpoint (for testing)
export async function GET(req: NextRequest) {
  // Only allow in development or with admin auth
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Use POST method with authorization' }, { status: 403 })
  }

  // Forward to POST handler
  return POST(req)
}
