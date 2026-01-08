import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET /api/payments/penalty-history - Get payment history with penalties
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.userType !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''
    const collectorId = searchParams.get('collectorId')
    const dateFilter = searchParams.get('dateFilter') || 'all'
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')

    // Build where clause for batch payments with penalties
    const where: any = {
      penaltyWaived: { gt: 0 }, // Only payments with penalty waived
    }

    if (collectorId) {
      where.collectorId = parseInt(collectorId)
    }

    if (search) {
      where.batch = {
        OR: [
          { batchNo: { contains: search } },
          { customer: { name: { contains: search } } },
          { customer: { mobile: { contains: search } } },
        ],
      }
    }

    // Date filter
    const now = new Date()
    if (dateFilter === 'today') {
      where.paymentDate = {
        gte: new Date(now.setHours(0, 0, 0, 0)),
        lte: new Date(now.setHours(23, 59, 59, 999)),
      }
    } else if (dateFilter === 'week') {
      const weekStart = new Date(now)
      weekStart.setDate(weekStart.getDate() - weekStart.getDay())
      weekStart.setHours(0, 0, 0, 0)
      where.paymentDate = { gte: weekStart }
    } else if (dateFilter === 'month') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      where.paymentDate = { gte: monthStart }
    }

    const [payments, total] = await Promise.all([
      prisma.batchPayment.findMany({
        where,
        include: {
          batch: {
            include: {
              customer: {
                select: {
                  id: true,
                  name: true,
                  mobile: true,
                },
              },
              collector: {
                select: {
                  id: true,
                  name: true,
                  collectorId: true,
                },
              },
            },
          },
          schedule: {
            select: {
              scheduleDate: true,
              totalPenalty: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.batchPayment.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: payments,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    })
  } catch (error) {
    console.error('Penalty History Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch penalty history',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

