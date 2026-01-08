import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// POST /api/payments/multi-token - Record payment across multiple tokens
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      customerId,
      tokenAllocations, // Array of { tokenId, amount }
      paymentMode,
      paymentDate,
      remarks,
      photoUrl,
    } = body

    // Validation
    if (!customerId || !tokenAllocations || !Array.isArray(tokenAllocations) || tokenAllocations.length === 0) {
      return NextResponse.json({
        error: 'Customer ID and token allocations are required'
      }, { status: 400 })
    }

    const totalPaymentAmount = tokenAllocations.reduce((sum, alloc) => sum + Number(alloc.amount), 0)

    if (totalPaymentAmount <= 0) {
      return NextResponse.json({
        error: 'Total payment amount must be greater than 0'
      }, { status: 400 })
    }

    // Get collector ID from session
    const collectorId = session.user.userType === 'collector'
      ? parseInt(session.user.id)
      : parseInt(session.user.id) // For admin, could be different logic

    // Verify all tokens belong to the customer and are assigned to collector (if collector)
    const tokenIds = tokenAllocations.map(alloc => alloc.tokenId)
    const tokens = await prisma.token.findMany({
      where: {
        id: { in: tokenIds },
        customerId: customerId,
        ...(session.user.userType === 'collector' ? { collectorId } : {})
      },
      include: {
        schedules: {
          where: {
            status: { in: ['pending', 'partial', 'overdue'] }
          },
          orderBy: { scheduleDate: 'asc' }
        }
      }
    })

    if (tokens.length !== tokenIds.length) {
      return NextResponse.json({
        error: 'Invalid tokens or tokens not assigned to you'
      }, { status: 400 })
    }

    // Process payment in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create main payment record
      const payment = await tx.payment.create({
        data: {
          customerId,
          collectorId,
          amount: totalPaymentAmount,
          paymentMode: paymentMode || 'cash',
          paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
          remarks,
          photoUrl,
          isMultiToken: true,
          createdBy: session.user.userType as any,
        }
      })

      const allAllocations = []

      // Process each token allocation
      for (const allocation of tokenAllocations) {
        const token = tokens.find(t => t.id === allocation.tokenId)
        if (!token) continue

        let remainingAmount = Number(allocation.amount)
        const scheduleAllocations = []

        // Apply payment to schedules in order
        for (const schedule of token.schedules) {
          if (remainingAmount <= 0) break

          const scheduleDue = Number(schedule.totalDue) - Number(schedule.paidAmount)
          const amountToApply = Math.min(remainingAmount, scheduleDue)

          if (amountToApply > 0) {
            const newPaidAmount = Number(schedule.paidAmount) + amountToApply

            // Update schedule
            await tx.repaymentSchedule.update({
              where: { id: schedule.id },
              data: {
                paidAmount: newPaidAmount,
                status: newPaidAmount >= Number(schedule.totalDue) ? 'paid' : 'partial',
                paymentDate: newPaidAmount >= Number(schedule.totalDue)
                  ? (paymentDate ? new Date(paymentDate) : new Date())
                  : schedule.paymentDate
              }
            })

            // Create payment allocation record
            const paymentAllocation = await tx.paymentAllocation.create({
              data: {
                paymentId: payment.id,
                tokenId: token.id,
                scheduleId: schedule.id,
                amount: amountToApply,
              }
            })

            scheduleAllocations.push(paymentAllocation)
            remainingAmount -= amountToApply
          }
        }

        allAllocations.push(...scheduleAllocations)

        // Check if token is fully paid
        const updatedSchedules = await tx.repaymentSchedule.findMany({
          where: { tokenId: token.id },
          select: { status: true }
        })

        const allPaid = updatedSchedules.every(s => s.status === 'paid')
        const hasOverdue = updatedSchedules.some(s => s.status === 'overdue')

        // Update token status
        if (allPaid) {
          await tx.token.update({
            where: { id: token.id },
            data: { status: 'closed' }
          })
        } else if (hasOverdue && token.status !== 'overdue') {
          await tx.token.update({
            where: { id: token.id },
            data: { status: 'overdue' }
          })
        }
      }

      return { payment, allocations: allAllocations }
    })

    return NextResponse.json({
      success: true,
      message: 'Multi-token payment recorded successfully',
      data: result
    })

  } catch (error) {
    console.error('Multi-token Payment POST Error:', error)
    return NextResponse.json({
      error: 'Failed to record multi-token payment',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET /api/payments/multi-token - Get multi-token payment history
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const customerId = searchParams.get('customerId')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')

    const where: any = {
      isMultiToken: true,
    }

    if (customerId) {
      where.customerId = parseInt(customerId)
    }

    if (session.user.userType === 'collector') {
      where.collectorId = parseInt(session.user.id)
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          collector: {
            select: {
              name: true,
              collectorId: true,
            }
          },
          allocations: {
            include: {
              token: {
                select: {
                  tokenNo: true,
                  customerId: true,
                  customer: {
                    select: {
                      name: true,
                      mobile: true,
                    }
                  }
                }
              },
              schedule: {
                select: {
                  scheduleDate: true,
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.payment.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: payments,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    })

  } catch (error) {
    console.error('Multi-token Payment GET Error:', error)
    return NextResponse.json({
      error: 'Failed to fetch multi-token payments'
    }, { status: 500 })
  }
}
