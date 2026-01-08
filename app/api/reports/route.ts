import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { startOfDay, startOfWeek, startOfMonth, endOfDay, subDays } from 'date-fns'

// GET /api/reports - Get comprehensive batch-based reports
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.userType !== 'admin' && session.user.role !== 'director')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()

    // 1. Collection Summary (from batch payments)
    const todayPayments = await prisma.batchPayment.aggregate({
      where: {
        paymentDate: {
          gte: startOfDay(now),
          lte: endOfDay(now),
        },
      },
      _sum: { amount: true },
      _count: true,
    })

    const weekPayments = await prisma.batchPayment.aggregate({
      where: {
        paymentDate: {
          gte: startOfWeek(now),
          lte: endOfDay(now),
        },
      },
      _sum: { amount: true },
      _count: true,
    })

    const monthPayments = await prisma.batchPayment.aggregate({
      where: {
        paymentDate: {
          gte: startOfMonth(now),
          lte: endOfDay(now),
        },
      },
      _sum: { amount: true },
      _count: true,
    })

    // 2. Last 7 Days Collection Trend
    const last7Days = []
    for (let i = 6; i >= 0; i--) {
      const date = subDays(now, i)
      const dayStart = startOfDay(date)
      const dayEnd = endOfDay(date)

      const dayPayments = await prisma.batchPayment.aggregate({
        where: {
          paymentDate: {
            gte: dayStart,
            lte: dayEnd,
          },
        },
        _sum: { amount: true },
      })

      last7Days.push({
        date: dayStart.toISOString(),
        amount: Number(dayPayments._sum.amount || 0),
      })
    }

    // 3. Overdue Batches with Details
    const today = startOfDay(now)
    const overdueBatches = await prisma.tokenBatch.findMany({
      where: {
        status: { in: ['active', 'overdue'] },
        batchSchedules: {
          some: {
            status: 'overdue',
            scheduleDate: { lt: today },
          },
        },
      },
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
        batchSchedules: {
          where: {
            status: 'overdue',
            scheduleDate: { lt: today },
          },
          orderBy: {
            scheduleDate: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: 50, // Limit to top 50 overdue
    })

    // Calculate overdue details for batches
    const overdueWithDetails = overdueBatches.map((batch) => {
      const totalOverdue = batch.batchSchedules.reduce(
        (sum, s) => sum + Number(s.totalDue) - Number(s.paidAmount) - Number(s.penaltyWaived),
        0
      )
      const oldestSchedule = batch.batchSchedules[0]
      const daysOverdue = oldestSchedule
        ? Math.floor((now.getTime() - new Date(oldestSchedule.scheduleDate).getTime()) / (1000 * 60 * 60 * 24))
        : 0

      return {
        batchId: batch.id,
        batchNo: batch.batchNo,
        quantity: batch.quantity,
        customer: batch.customer,
        collector: batch.collector,
        totalOverdue,
        overdueSchedules: batch.batchSchedules.length,
        daysOverdue,
        totalAmount: Number(batch.totalBatchAmount),
      }
    })

    // 4. Collector Performance (based on batches)
    const collectors = await prisma.collector.findMany({
      where: { isActive: true },
      include: {
        tokenBatches: {
          where: { status: 'active' },
          select: {
            id: true,
            quantity: true,
          },
        },
      },
    })

    // Get batch payments for this month grouped by collector
    const monthlyBatchPayments = await prisma.batchPayment.findMany({
      where: {
        paymentDate: {
          gte: startOfMonth(now),
          lte: endOfDay(now),
        },
      },
      select: {
        collectorId: true,
        amount: true,
      },
    })

    // Aggregate payments by collector
    const paymentsByCollector = monthlyBatchPayments.reduce((acc, payment) => {
      const collectorId = payment.collectorId
      if (!acc[collectorId]) {
        acc[collectorId] = 0
      }
      acc[collectorId] += Number(payment.amount)
      return acc
    }, {} as Record<number, number>)

    const collectorPerformance = collectors.map((collector) => {
      const activeTokens = collector.tokenBatches.reduce((sum, b) => sum + b.quantity, 0)
      const monthlyCollection = paymentsByCollector[collector.id] || 0

      return {
        id: collector.id,
        name: collector.name,
        collectorId: collector.collectorId,
        activeTokens,
        monthlyCollection,
      }
    })

    // Sort by monthly collection
    collectorPerformance.sort((a, b) => b.monthlyCollection - a.monthlyCollection)

    // 5. Batch Status Summary
    const batchStats = await prisma.tokenBatch.groupBy({
      by: ['status'],
      _count: true,
      _sum: {
        loanAmount: true,
        totalBatchAmount: true,
      },
    })

    const batchSummary = batchStats.map((stat) => ({
      status: stat.status,
      count: stat._count,
      totalDisbursed: Number(stat._sum.loanAmount || 0) * (stat._count || 1), // Approximate
      totalAmount: Number(stat._sum.totalBatchAmount || 0),
    }))

    // 6. Overall Stats (batch-based)
    const totalDisbursed = await prisma.tokenBatch.aggregate({
      _sum: { totalBatchAmount: true },
    })

    const totalCollected = await prisma.batchPayment.aggregate({
      _sum: { amount: true },
    })

    // Calculate total outstanding from batch schedules
    const allBatches = await prisma.tokenBatch.findMany({
      include: {
        batchSchedules: {
          select: {
            totalDue: true,
            paidAmount: true,
            penaltyWaived: true,
          },
        },
      },
    })

    const totalOutstanding = allBatches.reduce((sum, batch) => {
      const batchOutstanding = batch.batchSchedules.reduce(
        (s, schedule) =>
          s + Number(schedule.totalDue) - Number(schedule.paidAmount) - Number(schedule.penaltyWaived),
        0
      )
      return sum + batchOutstanding
    }, 0)

    return NextResponse.json({
      success: true,
      data: {
        collectionSummary: {
          today: {
            amount: Number(todayPayments._sum.amount || 0),
            count: todayPayments._count,
          },
          week: {
            amount: Number(weekPayments._sum.amount || 0),
            count: weekPayments._count,
          },
          month: {
            amount: Number(monthPayments._sum.amount || 0),
            count: monthPayments._count,
          },
        },
        collectionTrend: last7Days,
        overdueBatches: overdueWithDetails,
        collectorPerformance,
        batchSummary,
        overallStats: {
          totalDisbursed: Number(totalDisbursed._sum.totalBatchAmount || 0),
          totalCollected: Number(totalCollected._sum.amount || 0),
          totalOutstanding,
        },
      },
    })
  } catch (error) {
    console.error('Reports API Error:', error)
    return NextResponse.json({ error: 'Failed to generate reports' }, { status: 500 })
  }
}
