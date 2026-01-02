import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { startOfDay, startOfWeek, startOfMonth, endOfDay, subDays } from 'date-fns'

// GET /api/reports - Get comprehensive reports
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.userType !== 'admin' && session.user.role !== 'director')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()

    // 1. Collection Summary
    const todayPayments = await prisma.payment.aggregate({
      where: {
        paymentDate: {
          gte: startOfDay(now),
          lte: endOfDay(now),
        },
      },
      _sum: { amount: true },
      _count: true,
    })

    const weekPayments = await prisma.payment.aggregate({
      where: {
        paymentDate: {
          gte: startOfWeek(now),
          lte: endOfDay(now),
        },
      },
      _sum: { amount: true },
      _count: true,
    })

    const monthPayments = await prisma.payment.aggregate({
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

      const dayPayments = await prisma.payment.aggregate({
        where: {
          paymentDate: {
            gte: dayStart,
            lte: dayEnd,
          },
        },
        _sum: { amount: true },
      })

      last7Days.push({
        date: dayStart,
        amount: Number(dayPayments._sum.amount || 0),
      })
    }

    // 3. Overdue Tokens with Details
    const overdueTokens = await prisma.token.findMany({
      where: {
        status: { in: ['active', 'overdue'] },
        schedules: {
          some: {
            status: 'overdue',
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
          },
        },
        schedules: {
          where: {
            status: 'overdue',
          },
          orderBy: {
            scheduleDate: 'asc',
          },
        },
      },
      orderBy: {
        startDate: 'asc',
      },
      take: 50, // Limit to top 50 overdue
    })

    // Calculate overdue details
    const overdueWithDetails = overdueTokens.map((token) => {
      const totalOverdue = token.schedules.reduce((sum, s) => sum + Number(s.totalDue) - Number(s.paidAmount), 0)
      const oldestSchedule = token.schedules[0]
      const daysOverdue = oldestSchedule
        ? Math.floor((now.getTime() - new Date(oldestSchedule.scheduleDate).getTime()) / (1000 * 60 * 60 * 24))
        : 0

      return {
        tokenId: token.id,
        tokenNo: token.tokenNo,
        customer: token.customer,
        collector: token.collector,
        totalOverdue,
        overdueSchedules: token.schedules.length,
        daysOverdue,
        totalAmount: Number(token.totalAmount),
      }
    })

    // 4. Collector Performance
    const collectors = await prisma.collector.findMany({
      where: { isActive: true },
      include: {
        tokens: {
          where: { status: 'active' },
          select: { id: true },
        },
        payments: {
          where: {
            paymentDate: {
              gte: startOfMonth(now),
              lte: endOfDay(now),
            },
          },
          select: { amount: true },
        },
      },
    })

    const collectorPerformance = collectors.map((collector) => ({
      id: collector.id,
      name: collector.name,
      collectorId: collector.collectorId,
      activeTokens: collector.tokens.length,
      monthlyCollection: collector.payments.reduce((sum, p) => sum + Number(p.amount), 0),
    }))

    // Sort by monthly collection
    collectorPerformance.sort((a, b) => b.monthlyCollection - a.monthlyCollection)

    // 5. Token Status Summary
    const tokenStats = await prisma.token.groupBy({
      by: ['status'],
      _count: true,
      _sum: {
        loanAmount: true,
        totalAmount: true,
      },
    })

    const tokenSummary = tokenStats.map((stat) => ({
      status: stat.status,
      count: stat._count,
      totalDisbursed: Number(stat._sum.loanAmount || 0),
      totalAmount: Number(stat._sum.totalAmount || 0),
    }))

    // 6. Overall Stats
    const totalDisbursed = await prisma.token.aggregate({
      _sum: { loanAmount: true },
    })

    const totalCollected = await prisma.payment.aggregate({
      _sum: { amount: true },
    })

    const totalOutstanding = Number(totalDisbursed._sum.loanAmount || 0) - Number(totalCollected._sum.amount || 0)

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
        overdueTokens: overdueWithDetails,
        collectorPerformance,
        tokenSummary,
        overallStats: {
          totalDisbursed: Number(totalDisbursed._sum.loanAmount || 0),
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