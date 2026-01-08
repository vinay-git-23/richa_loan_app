import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET /api/collectors/token-batches - List collector's token batches
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.userType !== 'collector') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const collectorId = parseInt(session.user.id)
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')

    const where: any = {
      collectorId
    }

    if (status && status !== 'all') {
      where.status = status
    }

    const batches = await prisma.tokenBatch.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            mobile: true,
          },
        },
        tokens: {
          select: {
            id: true,
            tokenNo: true,
            status: true,
          },
        },
        batchSchedules: {
          where: {
            status: {
              in: ['pending', 'partial', 'overdue']
            }
          },
          select: {
            scheduleDate: true,
            totalDue: true,
            paidAmount: true,
            status: true,
          },
          orderBy: {
            scheduleDate: 'asc'
          },
          take: 1,
        },
      },
      orderBy: {
        createdAt: 'desc'
      },
    })

    return NextResponse.json({
      success: true,
      data: batches,
    })

  } catch (error) {
    console.error('Collector Token Batches List Error:', error)
    return NextResponse.json({
      error: 'Failed to fetch token batches',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
