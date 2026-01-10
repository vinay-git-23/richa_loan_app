import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// POST /api/batch-payments - Record payment for a token batch
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      batchId,
      amount,
      paymentMode = 'cash',
      paymentDate,
      penaltyWaived = 0,
      remarks,
      photoUrl
    } = body

    // Validation
    if (!batchId || !amount || !paymentDate) {
      return NextResponse.json({
        error: 'Required fields: batchId, amount, paymentDate'
      }, { status: 400 })
    }

    if (amount <= 0) {
      return NextResponse.json({
        error: 'Payment amount must be positive'
      }, { status: 400 })
    }

    // Verify batch exists and is active
    const batch = await prisma.tokenBatch.findUnique({
      where: { id: parseInt(batchId) },
      include: {
        customer: true,
        collector: true,
      }
    })

    if (!batch) {
      return NextResponse.json({
        error: 'Token batch not found'
      }, { status: 404 })
    }

    if (batch.status !== 'active') {
      return NextResponse.json({
        error: 'Cannot record payment for inactive batch'
      }, { status: 400 })
    }

    // For collectors, verify they own this batch
    if (session.user.userType === 'collector') {
      if (batch.collectorId !== parseInt(session.user.id)) {
        return NextResponse.json({
          error: 'You can only record payments for your own batches'
        }, { status: 403 })
      }
    }

    const collectorId = session.user.userType === 'collector'
      ? parseInt(session.user.id)
      : batch.collectorId

    const paymentAmount = Number(amount)
    const penaltyWaivedAmount = Number(penaltyWaived || 0)
    const payDate = new Date(paymentDate)

    // Apply payment to batch schedules in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Get pending schedules for this batch, ordered by date
      const pendingSchedules = await tx.batchRepaymentSchedule.findMany({
        where: {
          batchId: parseInt(batchId),
          status: {
            in: ['pending', 'partial', 'overdue']
          }
        },
        orderBy: {
          scheduleDate: 'asc'
        }
      })

      if (pendingSchedules.length === 0) {
        throw new Error('No pending schedules found for this batch')
      }

      let remainingAmount = paymentAmount
      const updatedSchedules = []
      const createdPayments = []

      // Apply payment to schedules sequentially
      for (const schedule of pendingSchedules) {
        if (remainingAmount <= 0) break

        const outstandingAmount = Number(schedule.totalDue) - Number(schedule.paidAmount) - Number(schedule.penaltyWaived)

        // Calculate how much to apply to this schedule
        const amountToApply = Math.min(remainingAmount, outstandingAmount)

        // Determine if we're waiving penalty on this schedule
        const scheduleWaived = Math.min(
          penaltyWaivedAmount,
          Number(schedule.totalPenalty) - Number(schedule.penaltyWaived)
        )

        // Calculate new paid amount and status
        const newPaidAmount = Number(schedule.paidAmount) + amountToApply
        const newWaivedAmount = Number(schedule.penaltyWaived) + scheduleWaived
        const totalReceived = newPaidAmount + newWaivedAmount

        let newStatus: 'pending' | 'paid' | 'overdue' | 'partial' = schedule.status

        if (totalReceived >= Number(schedule.totalDue)) {
          newStatus = 'paid'
        } else if (newPaidAmount > 0) {
          newStatus = 'partial'
        } else if (new Date(schedule.scheduleDate) < new Date()) {
          newStatus = 'overdue'
        }

        // Update schedule
        const updatedSchedule = await tx.batchRepaymentSchedule.update({
          where: { id: schedule.id },
          data: {
            paidAmount: newPaidAmount,
            penaltyWaived: newWaivedAmount,
            paymentDate: newStatus === 'paid' ? payDate : schedule.paymentDate,
            status: newStatus,
          }
        })

        updatedSchedules.push(updatedSchedule)

        // Create batch payment record
        const payment = await tx.batchPayment.create({
          data: {
            batchId: parseInt(batchId),
            scheduleId: schedule.id,
            collectorId,
            amount: amountToApply,
            penaltyWaived: scheduleWaived,
            paymentMode,
            paymentDate: payDate,
            remarks,
            photoUrl,
            isSynced: false,
            createdBy: session.user.userType as 'admin' | 'collector' | 'director',
          }
        })

        createdPayments.push(payment)
        remainingAmount -= amountToApply
      }

      // Credit account based on who recorded the payment
      try {
        if (session.user.userType === 'collector') {
          // Credit collector account when collector records payment
          let collectorAccount = await (tx as any).collectorAccount?.findUnique({
            where: { collectorId }
          }).catch(() => null)

          if (!collectorAccount && (tx as any).collectorAccount) {
            try {
              collectorAccount = await (tx as any).collectorAccount.create({
                data: {
                  collectorId,
                  currentBalance: 0
                }
              })
            } catch (error: any) {
              // If account already exists, fetch it
              if (error?.code === 'P2002' || error?.code === 'P2003') {
                collectorAccount = await (tx as any).collectorAccount?.findUnique({
                  where: { collectorId }
                }).catch(() => null)
              } else {
                throw error
              }
            }
          }

          if (collectorAccount && (tx as any).collectorAccount) {
            const newBalance = Number(collectorAccount.currentBalance) + paymentAmount

            await (tx as any).collectorAccount.update({
              where: { id: collectorAccount.id },
              data: { currentBalance: newBalance }
            })

            if ((tx as any).collectorAccountTransaction) {
              await (tx as any).collectorAccountTransaction.create({
                data: {
                  collectorAccountId: collectorAccount.id,
                  transactionType: 'credit',
                  amount: paymentAmount,
                  balanceAfter: newBalance,
                  referenceType: 'collection',
                  referenceId: createdPayments[0].id,
                  description: `Collection for batch ${batch.batchNo}`,
                  createdBy: collectorId,
                  createdByType: 'collector'
                }
              })
            }
          }
        } else if (session.user.userType === 'admin') {
          // Credit admin account when admin records payment
          const adminId = parseInt(session.user.id)
          let adminAccount = await (tx as any).adminAccount?.findUnique({
            where: { adminId }
          }).catch(() => null)

          if (!adminAccount && (tx as any).adminAccount) {
            try {
              adminAccount = await (tx as any).adminAccount.create({
                data: {
                  adminId,
                  currentBalance: 0
                }
              })
            } catch (error: any) {
              // If account already exists, fetch it
              if (error?.code === 'P2002' || error?.code === 'P2003') {
                adminAccount = await (tx as any).adminAccount?.findUnique({
                  where: { adminId }
                }).catch(() => null)
              } else {
                throw error
              }
            }
          }

          if (adminAccount && (tx as any).adminAccount) {
            const newBalance = Number(adminAccount.currentBalance) + paymentAmount

            await (tx as any).adminAccount.update({
              where: { id: adminAccount.id },
              data: { currentBalance: newBalance }
            })

            if ((tx as any).adminAccountTransaction) {
              await (tx as any).adminAccountTransaction.create({
                data: {
                  adminAccountId: adminAccount.id,
                  transactionType: 'credit',
                  amount: paymentAmount,
                  balanceAfter: newBalance,
                  referenceType: 'payment_record',
                  referenceId: createdPayments[0].id,
                  description: `Payment recorded for batch ${batch.batchNo}`,
                  createdBy: adminId,
                  createdByType: 'admin'
                }
              })
            }
          }
        }
      } catch (accountError: any) {
        // If account system is not set up yet, log but don't fail the payment
        if (accountError?.code !== 'P2001' && accountError?.code !== 'P2025') {
          console.warn('Account credit failed (account system may not be migrated yet):', accountError?.message || accountError)
        }
      }

      // Check if all schedules are paid - if so, close the batch
      const allSchedules = await tx.batchRepaymentSchedule.findMany({
        where: { batchId: parseInt(batchId) }
      })

      const allPaid = allSchedules.every(s => s.status === 'paid')

      if (allPaid) {
        await tx.tokenBatch.update({
          where: { id: parseInt(batchId) },
          data: { status: 'closed' }
        })

        // Also close all individual tokens in the batch
        await tx.token.updateMany({
          where: { batchId: parseInt(batchId) },
          data: { status: 'closed' }
        })
      }

      return {
        payments: createdPayments,
        updatedSchedules,
        amountApplied: paymentAmount - remainingAmount,
        remainingAmount,
        batchClosed: allPaid
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Payment recorded successfully',
      data: result
    })

  } catch (error) {
    console.error('Batch Payment Error:', error)
    return NextResponse.json({
      error: 'Failed to record batch payment',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET /api/batch-payments - List batch payments
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const batchId = searchParams.get('batchId')
    const collectorId = searchParams.get('collectorId')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')

    const where: any = {}

    if (batchId) {
      where.batchId = parseInt(batchId)
    }

    if (collectorId) {
      where.collectorId = parseInt(collectorId)
    }

    // For collectors, only show their own payments
    if (session.user.userType === 'collector') {
      where.collectorId = parseInt(session.user.id)
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
                  mobile: true
                }
              }
            }
          }
        },
        orderBy: {
          paymentDate: 'desc'
        },
        skip: (page - 1) * pageSize,
        take: pageSize
      }),
      prisma.batchPayment.count({ where })
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
    console.error('Batch Payments GET Error:', error)
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 })
  }
}
