import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { startOfDay, startOfWeek, startOfMonth, endOfDay } from 'date-fns'

// GET /api/payments - List all payments with filters
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.userType !== 'admin' && session.user.role !== 'director')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''
    const dateFilter = searchParams.get('dateFilter') || 'all'
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')

    // Build where clause
    const where: any = {}

    if (search) {
      where.OR = [
        { token: { tokenNo: { contains: search } } },
        { token: { customer: { name: { contains: search } } } },
        { token: { customer: { mobile: { contains: search } } } },
      ]
    }

    // Date filter
    const now = new Date()
    if (dateFilter === 'today') {
      where.paymentDate = {
        gte: startOfDay(now),
        lte: endOfDay(now),
      }
    } else if (dateFilter === 'week') {
      where.paymentDate = {
        gte: startOfWeek(now),
        lte: endOfDay(now),
      }
    } else if (dateFilter === 'month') {
      where.paymentDate = {
        gte: startOfMonth(now),
        lte: endOfDay(now),
      }
    }

    // Get total count
    const totalCount = await prisma.payment.count({ where })

    // Get payments
    const payments = await prisma.payment.findMany({
      where,
      include: {
        token: {
          include: {
            customer: {
              select: {
                name: true,
                mobile: true,
              },
            },
          },
        },
        collector: {
          select: {
            name: true,
            collectorId: true,
          },
        },
      },
      orderBy: { paymentDate: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    })

    return NextResponse.json({
      success: true,
      data: payments,
      pagination: {
        page,
        pageSize,
        totalPages: Math.ceil(totalCount / pageSize),
        totalRecords: totalCount,
      },
    })
  } catch (error) {
    console.error('Payments GET Error:', error)
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 })
  }
}

// POST /api/payments - Record new payment
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.userType !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { tokenId, scheduleId, collectorId, amount, paymentMode, paymentDate, remarks } = body

    // Validation
    if (!tokenId || !scheduleId || !collectorId || !amount || !paymentMode) {
      return NextResponse.json({ error: 'All required fields must be provided' }, { status: 400 })
    }

    const paymentAmount = parseFloat(amount)
    if (paymentAmount <= 0) {
      return NextResponse.json({ error: 'Amount must be greater than 0' }, { status: 400 })
    }

    // Verify token exists
    const token = await prisma.token.findUnique({
      where: { id: parseInt(tokenId) },
    })

    if (!token) {
      return NextResponse.json({ error: 'Token not found' }, { status: 404 })
    }

    // Verify schedule exists
    const schedule = await prisma.repaymentSchedule.findUnique({
      where: { id: parseInt(scheduleId) },
    })

    if (!schedule || schedule.tokenId !== parseInt(tokenId)) {
      return NextResponse.json({ error: 'Invalid schedule' }, { status: 400 })
    }

    // Verify collector exists
    const collector = await prisma.collector.findUnique({
      where: { id: parseInt(collectorId) },
    })

    if (!collector) {
      return NextResponse.json({ error: 'Collector not found' }, { status: 404 })
    }

    // Parse payment date
    const parsedPaymentDate = paymentDate ? new Date(paymentDate) : new Date()

    // Transaction: Create payment and update schedule
    const result = await prisma.$transaction(async (tx) => {
      // Create payment
      const payment = await tx.payment.create({
        data: {
          tokenId: parseInt(tokenId),
          scheduleId: parseInt(scheduleId),
          collectorId: parseInt(collectorId),
          amount: paymentAmount,
          paymentMode,
          paymentDate: parsedPaymentDate,
          remarks: remarks || null,
          isSynced: true,
        },
      })

      // Update schedule
      const newPaidAmount = Number(schedule.paidAmount) + paymentAmount
      const totalDue = Number(schedule.totalDue)

      let newStatus: 'pending' | 'paid' | 'partial' | 'overdue'
      if (newPaidAmount >= totalDue) {
        newStatus = 'paid'
      } else if (newPaidAmount > 0) {
        newStatus = 'partial'
      } else {
        newStatus = schedule.status as any
      }

      await tx.repaymentSchedule.update({
        where: { id: parseInt(scheduleId) },
        data: {
          paidAmount: newPaidAmount,
          paymentDate: parsedPaymentDate,
          status: newStatus,
        },
      })

      // Check if all schedules are paid, then close token
      const allSchedules = await tx.repaymentSchedule.findMany({
        where: { tokenId: parseInt(tokenId) },
      })

      const allPaid = allSchedules.every((s) => s.status === 'paid')
      if (allPaid) {
        await tx.token.update({
          where: { id: parseInt(tokenId) },
          data: { status: 'closed' },
        })
      }

      return payment
    })

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Payment recorded successfully',
    })
  } catch (error) {
    console.error('Payment POST Error:', error)
    return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 })
  }
}