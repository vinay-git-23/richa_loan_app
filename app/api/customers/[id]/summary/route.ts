import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET /api/customers/[id]/summary - Get customer with consolidated multi-token summary
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const customerId = parseInt(id)

    // Fetch customer with all tokens and detailed information
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        tokens: {
          include: {
            collector: {
              select: {
                id: true,
                name: true,
                collectorId: true,
                mobile: true,
              }
            },
            payments: {
              select: {
                id: true,
                amount: true,
                paymentDate: true,
                paymentMode: true,
              },
              orderBy: { paymentDate: 'desc' }
            },
            schedules: {
              select: {
                id: true,
                status: true,
                scheduleDate: true,
                installmentAmount: true,
                penaltyAmount: true,
                totalDue: true,
                paidAmount: true,
              },
              orderBy: { scheduleDate: 'asc' }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    // Calculate consolidated summary across all tokens
    const consolidatedSummary: {
      totalTokens: number
      activeTokens: number
      closedTokens: number
      overdueTokens: number
      cancelledTokens: number
      totalBorrowed: number
      totalAmountDue: number
      totalPaid: number
      totalOutstanding: number
      totalOverdue: number
      totalPenalties: number
      nextPaymentDue: Date | null
      todaysDue: number
    } = {
      totalTokens: customer.tokens.length,
      activeTokens: 0,
      closedTokens: 0,
      overdueTokens: 0,
      cancelledTokens: 0,
      totalBorrowed: 0,
      totalAmountDue: 0,
      totalPaid: 0,
      totalOutstanding: 0,
      totalOverdue: 0,
      totalPenalties: 0,
      nextPaymentDue: null,
      todaysDue: 0,
    }

    const tokenSummaries = customer.tokens.map((token) => {
      // Count tokens by status
      if (token.status === 'active') consolidatedSummary.activeTokens++
      else if (token.status === 'closed') consolidatedSummary.closedTokens++
      else if (token.status === 'overdue') consolidatedSummary.overdueTokens++
      else if (token.status === 'cancelled') consolidatedSummary.cancelledTokens++

      // Calculate token-level statistics
      const totalPaid = token.payments.reduce((sum, p) => sum + Number(p.amount), 0)
      const outstanding = Number(token.totalAmount) - totalPaid

      // Calculate overdue and penalties
      let overdueAmount = 0
      let penaltiesAmount = 0
      let paidSchedules = 0
      let pendingSchedules = 0
      let overdueSchedules = 0
      let todayDue = 0
      let nextDueDate: Date | null = null

      const today = new Date()
      today.setHours(0, 0, 0, 0)

      token.schedules.forEach((schedule) => {
        if (schedule.status === 'paid') {
          paidSchedules++
        } else if (schedule.status === 'pending' || schedule.status === 'partial') {
          pendingSchedules++
          const scheduleDate = new Date(schedule.scheduleDate)
          scheduleDate.setHours(0, 0, 0, 0)

          const remaining = Number(schedule.totalDue) - Number(schedule.paidAmount)

          if (scheduleDate.getTime() === today.getTime()) {
            todayDue += remaining
          }

          if (scheduleDate < today) {
            overdueAmount += remaining
            overdueSchedules++
          }

          if (!nextDueDate || scheduleDate < nextDueDate) {
            nextDueDate = scheduleDate
          }
        } else if (schedule.status === 'overdue') {
          overdueSchedules++
          overdueAmount += Number(schedule.totalDue) - Number(schedule.paidAmount)
        }

        penaltiesAmount += Number(schedule.penaltyAmount)
      })

      // Add to consolidated totals
      consolidatedSummary.totalBorrowed += Number(token.loanAmount)
      consolidatedSummary.totalAmountDue += Number(token.totalAmount)
      consolidatedSummary.totalPaid += totalPaid
      consolidatedSummary.totalOutstanding += outstanding
      consolidatedSummary.totalOverdue += overdueAmount
      consolidatedSummary.totalPenalties += penaltiesAmount
      consolidatedSummary.todaysDue += todayDue

      // Track earliest next payment due date
      if (nextDueDate !== null) {
        const currentNextDue = consolidatedSummary.nextPaymentDue
        if (currentNextDue === null) {
          consolidatedSummary.nextPaymentDue = nextDueDate
        } else {
          // Both are non-null Date objects
          const nextDue = nextDueDate as Date
          const currentDue = currentNextDue as Date
          if (nextDue.getTime() < currentDue.getTime()) {
            consolidatedSummary.nextPaymentDue = nextDueDate
          }
        }
      }

      return {
        tokenId: token.id,
        tokenNo: token.tokenNo,
        status: token.status,
        loanAmount: Number(token.loanAmount),
        totalAmount: Number(token.totalAmount),
        dailyInstallment: Number(token.dailyInstallment),
        durationDays: token.durationDays,
        startDate: token.startDate,
        endDate: token.endDate,
        createdAt: token.createdAt,
        createdBy: token.createdBy,
        collector: token.collector,
        statistics: {
          totalPaid,
          outstanding,
          overdueAmount,
          penaltiesAmount,
          paidSchedules,
          pendingSchedules,
          overdueSchedules,
          totalSchedules: token.schedules.length,
          completionPercentage: token.schedules.length > 0
            ? Math.round((paidSchedules / token.schedules.length) * 100)
            : 0,
          todayDue,
          nextDueDate,
        },
        recentPayments: token.payments.slice(0, 5), // Last 5 payments
        upcomingSchedules: token.schedules
          .filter(s => s.status === 'pending' || s.status === 'partial')
          .slice(0, 7) // Next 7 pending schedules
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        customer: {
          id: customer.id,
          name: customer.name,
          mobile: customer.mobile,
          address: customer.address,
          aadhaar: customer.aadhaar,
          photoUrl: customer.photoUrl,
          isActive: customer.isActive,
          createdAt: customer.createdAt,
        },
        consolidatedSummary,
        tokens: tokenSummaries,
      }
    })
  } catch (error) {
    console.error('Customer Summary GET Error:', error)
    return NextResponse.json({ error: 'Failed to fetch customer summary' }, { status: 500 })
  }
}
