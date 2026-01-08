import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { startOfDay } from 'date-fns'

// GET /api/payments/upcoming - Get upcoming payment schedules
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.userType !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''
    const collectorId = searchParams.get('collectorId')
    const days = parseInt(searchParams.get('days') || '7') // Default 7 days ahead
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')

    const today = startOfDay(new Date())
    const futureDate = new Date(today)
    futureDate.setDate(futureDate.getDate() + days)

    // Build where clause for batch schedules
    const batchWhere: any = {
      scheduleDate: {
        gte: today,
        lte: futureDate,
      },
      status: { in: ['pending', 'partial'] },
    }

    const batchFilters: any = {}
    if (collectorId) {
      batchFilters.collectorId = parseInt(collectorId)
    }
    if (search) {
      batchFilters.OR = [
        { batchNo: { contains: search } },
        { customer: { name: { contains: search } } },
        { customer: { mobile: { contains: search } } },
      ]
    }
    if (Object.keys(batchFilters).length > 0) {
      batchWhere.batch = batchFilters
    }

    // Get batch schedules
    const [batchSchedules, batchTotal] = await Promise.all([
      prisma.batchRepaymentSchedule.findMany({
        where: batchWhere,
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
        },
        orderBy: {
          scheduleDate: 'asc',
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.batchRepaymentSchedule.count({ where: batchWhere }),
    ])

    // Format response
    const formatted = batchSchedules.map((schedule) => ({
      id: schedule.id,
      scheduleDate: schedule.scheduleDate,
      totalDue: Number(schedule.totalDue),
      paidAmount: Number(schedule.paidAmount),
      outstanding: Number(schedule.totalDue) - Number(schedule.paidAmount),
      status: schedule.status,
      batch: {
        id: schedule.batch.id,
        batchNo: schedule.batch.batchNo,
        quantity: schedule.batch.quantity,
        customer: schedule.batch.customer,
        collector: schedule.batch.collector,
      },
      type: 'batch',
    }))

    return NextResponse.json({
      success: true,
      data: formatted,
      pagination: {
        page,
        pageSize,
        total: batchTotal,
        totalPages: Math.ceil(batchTotal / pageSize),
      },
    })
  } catch (error) {
    console.error('Upcoming Payments Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch upcoming payments',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

