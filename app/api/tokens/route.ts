import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { calculateTokenDetails, generateTokenNumber } from '@/utils/calculations'
import { addDays } from 'date-fns'

// GET /api/tokens - List all tokens with filters
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.userType !== 'admin' && session.user.role !== 'director')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status')
    const customerId = searchParams.get('customerId')
    const collectorId = searchParams.get('collectorId')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')

    // Build where clause
    const where: any = {}

    if (search) {
      where.OR = [
        { tokenNo: { contains: search } },
        { customer: { name: { contains: search } } },
        { customer: { mobile: { contains: search } } },
      ]
    }

    if (status) {
      where.status = status
    }

    if (customerId) {
      where.customerId = parseInt(customerId)
    }

    if (collectorId) {
      where.collectorId = parseInt(collectorId)
    }

    // Get total count
    const totalCount = await prisma.token.count({ where })

    // Get tokens with relations
    const tokens = await prisma.token.findMany({
      where,
      include: {
        customer: true,
        collector: true,
        schedules: {
          select: {
            status: true,
            totalDue: true,
            paidAmount: true,
          },
        },
        payments: {
          select: {
            amount: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    })

    // Calculate stats for each token
    const tokensWithStats = tokens.map((token) => {
      const totalPaid = token.payments.reduce((sum, p) => sum + Number(p.amount), 0)
      const totalDue = token.schedules.reduce((sum, s) => sum + Number(s.totalDue), 0)
      const totalPaidFromSchedules = token.schedules.reduce((sum, s) => sum + Number(s.paidAmount), 0)
      const outstanding = Number(token.totalAmount) - totalPaid
      const overdueSchedules = token.schedules.filter((s) => s.status === 'overdue').length

      return {
        ...token,
        totalPaid,
        outstanding,
        overdueSchedules,
        paidSchedules: token.schedules.filter((s) => s.status === 'paid').length,
        totalSchedules: token.schedules.length,
      }
    })

    return NextResponse.json({
      success: true,
      data: tokensWithStats,
      pagination: {
        page,
        pageSize,
        totalPages: Math.ceil(totalCount / pageSize),
        totalRecords: totalCount,
      },
    })
  } catch (error) {
    console.error('Tokens GET Error:', error)
    return NextResponse.json({ error: 'Failed to fetch tokens' }, { status: 500 })
  }
}

// POST /api/tokens - Create new token with auto-calculations
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.userType !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { customerId, collectorId, loanAmount, interestType, interestValue, durationDays, startDate, quantity } = body

    // Validation
    if (!customerId || !collectorId || !loanAmount || !interestType || interestValue === undefined || !durationDays) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    // Validate quantity
    const tokenQuantity = quantity ? parseInt(quantity) : 1
    if (tokenQuantity < 1 || tokenQuantity > 50) {
      return NextResponse.json({ error: 'Quantity must be between 1 and 50' }, { status: 400 })
    }

    // Validate customer exists and is active
    const customer = await prisma.customer.findUnique({
      where: { id: parseInt(customerId) },
    })

    if (!customer || !customer.isActive) {
      return NextResponse.json({ error: 'Invalid or inactive customer' }, { status: 400 })
    }

    // Validate collector exists and is active
    const collector = await prisma.collector.findUnique({
      where: { id: parseInt(collectorId) },
    })

    if (!collector || !collector.isActive) {
      return NextResponse.json({ error: 'Invalid or inactive collector' }, { status: 400 })
    }

    // Validate amounts
    if (loanAmount <= 0 || interestValue < 0 || durationDays <= 0) {
      return NextResponse.json({ error: 'Invalid amount or duration values' }, { status: 400 })
    }

    // Parse start date
    const parsedStartDate = startDate ? new Date(startDate) : new Date()
    parsedStartDate.setHours(0, 0, 0, 0)

    // Calculate token details
    const calculations = calculateTokenDetails({
      loanAmount: parseFloat(loanAmount),
      interestType,
      interestValue: parseFloat(interestValue),
      durationDays: parseInt(durationDays),
      startDate: parsedStartDate,
    })

    // Get current token count for sequential numbering
    const tokensToday = await prisma.token.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lt: new Date(new Date().setHours(23, 59, 59, 999)),
        },
      },
    })

    // Create multiple tokens in transaction (based on quantity)
    const createdTokens = await prisma.$transaction(async (tx) => {
      const tokens = []

      for (let q = 0; q < tokenQuantity; q++) {
        // Generate unique token number for each
        const tokenNo = generateTokenNumber(tokensToday + q + 1)

        // Create token
        const newToken = await tx.token.create({
          data: {
            tokenNo,
            customerId: parseInt(customerId),
            collectorId: parseInt(collectorId),
            loanAmount: parseFloat(loanAmount),
            interestType,
            interestValue: parseFloat(interestValue),
            totalAmount: calculations.totalAmount,
            durationDays: parseInt(durationDays),
            dailyInstallment: calculations.dailyInstallment,
            startDate: parsedStartDate,
            endDate: calculations.endDate,
            status: 'active',
            createdBy: 'admin',
          },
        })

        // Create repayment schedule for this token
        const schedules = []
        for (let i = 0; i < parseInt(durationDays); i++) {
          const scheduleDate = addDays(parsedStartDate, i)
          schedules.push({
            tokenId: newToken.id,
            scheduleDate,
            installmentAmount: calculations.dailyInstallment,
            penaltyAmount: 0,
            totalDue: calculations.dailyInstallment,
            paidAmount: 0,
            status: 'pending' as const,
          })
        }

        await tx.repaymentSchedule.createMany({
          data: schedules,
        })

        tokens.push(newToken)
      }

      return tokens
    }, {
      maxWait: 10000, // Maximum time to wait for a transaction slot
      timeout: 30000, // Maximum time for the transaction to complete (30 seconds)
    })

    return NextResponse.json({
      success: true,
      data: createdTokens,
      message: `${tokenQuantity} token(s) created successfully`,
      count: tokenQuantity
    })
  } catch (error) {
    console.error('Token POST Error:', error)
    return NextResponse.json({ error: 'Failed to create token' }, { status: 500 })
  }
}