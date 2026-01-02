import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { startOfDay, startOfWeek, startOfMonth, endOfDay } from 'date-fns'

// GET /api/payments/summary - Get collection summary
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.userType !== 'admin' && session.user.role !== 'director')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()

    // Today's collection
    const todayPayments = await prisma.payment.aggregate({
      where: {
        paymentDate: {
          gte: startOfDay(now),
          lte: endOfDay(now),
        },
      },
      _sum: {
        amount: true,
      },
    })

    // This week's collection
    const weekPayments = await prisma.payment.aggregate({
      where: {
        paymentDate: {
          gte: startOfWeek(now),
          lte: endOfDay(now),
        },
      },
      _sum: {
        amount: true,
      },
    })

    // This month's collection
    const monthPayments = await prisma.payment.aggregate({
      where: {
        paymentDate: {
          gte: startOfMonth(now),
          lte: endOfDay(now),
        },
      },
      _sum: {
        amount: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        today: Number(todayPayments._sum.amount || 0),
        week: Number(weekPayments._sum.amount || 0),
        month: Number(monthPayments._sum.amount || 0),
      },
    })
  } catch (error) {
    console.error('Payment Summary Error:', error)
    return NextResponse.json({ error: 'Failed to fetch payment summary' }, { status: 500 })
  }
}