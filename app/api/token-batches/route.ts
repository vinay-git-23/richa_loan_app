import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// POST /api/token-batches - Create token batch (Admin only)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.userType !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()

    const {
      customerId,
      collectorId,
      loanAmount,
      interestType,
      interestValue,
      durationDays,
      startDate,
      quantity
    } = body

    // Validation
    if (!customerId || !collectorId || !loanAmount || !interestType || interestValue === undefined || !durationDays || !startDate || !quantity) {
      return NextResponse.json({
        error: 'All fields are required: customerId, collectorId, loanAmount, interestType, interestValue, durationDays, startDate, quantity'
      }, { status: 400 })
    }

    if (loanAmount <= 0 || durationDays <= 0) {
      return NextResponse.json({
        error: 'Loan amount and duration must be positive'
      }, { status: 400 })
    }

    // Validate quantity
    const tokenQuantity = parseInt(quantity)
    if (tokenQuantity < 1 || tokenQuantity > 50) {
      return NextResponse.json({
        error: 'Quantity must be between 1 and 50'
      }, { status: 400 })
    }

    if (!['fixed', 'percentage'].includes(interestType)) {
      return NextResponse.json({
        error: 'Interest type must be "fixed" or "percentage"'
      }, { status: 400 })
    }

    // Verify customer exists and is active
    const customer = await prisma.customer.findUnique({
      where: { id: parseInt(customerId), isActive: true }
    })

    if (!customer) {
      return NextResponse.json({
        error: 'Customer not found or inactive'
      }, { status: 404 })
    }

    // Verify collector exists and is active
    const collector = await prisma.collector.findUnique({
      where: { id: parseInt(collectorId), isActive: true }
    })

    if (!collector) {
      return NextResponse.json({
        error: 'Collector not found or inactive'
      }, { status: 404 })
    }

    // Calculate token details (per token)
    const loanAmountNum = Number(loanAmount)
    const interestValueNum = Number(interestValue)
    const durationDaysNum = parseInt(durationDays)
    let totalAmountPerToken = loanAmountNum

    if (interestType === 'fixed') {
      totalAmountPerToken += interestValueNum
    } else if (interestType === 'percentage') {
      totalAmountPerToken += (loanAmountNum * interestValueNum) / 100
    }

    const dailyInstallmentPerToken = totalAmountPerToken / durationDaysNum

    // Calculate batch totals
    const totalBatchAmount = totalAmountPerToken * tokenQuantity
    const totalDailyAmount = dailyInstallmentPerToken * tokenQuantity

    const start = new Date(startDate)
    const end = new Date(start)
    end.setDate(end.getDate() + durationDaysNum - 1)

    // Generate batch number: BATCH-YYYYMMDD-XXXX
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const lastBatch = await prisma.tokenBatch.findFirst({
      where: {
        batchNo: {
          startsWith: `BATCH-${dateStr}`
        }
      },
      orderBy: { batchNo: 'desc' }
    })

    let batchSequence = 1
    if (lastBatch) {
      const lastSeq = parseInt(lastBatch.batchNo.split('-').pop() || '0')
      batchSequence = lastSeq + 1
    }

    const batchNo = `BATCH-${dateStr}-${batchSequence.toString().padStart(4, '0')}`

    // Get current token sequence for individual token numbering
    const lastToken = await prisma.token.findFirst({
      where: {
        tokenNo: {
          startsWith: `TKN-${dateStr}`
        }
      },
      orderBy: { tokenNo: 'desc' }
    })

    let tokenSequence = 1
    if (lastToken) {
      const lastSeq = parseInt(lastToken.tokenNo.split('-').pop() || '0')
      tokenSequence = lastSeq + 1
    }

    // Create batch with tokens and schedules in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create TokenBatch
      const batch = await tx.tokenBatch.create({
        data: {
          batchNo,
          customerId: parseInt(customerId),
          collectorId: parseInt(collectorId),
          quantity: tokenQuantity,
          loanAmount: loanAmountNum,
          totalBatchAmount,
          interestType,
          interestValue: interestValueNum,
          durationDays: durationDaysNum,
          dailyInstallment: dailyInstallmentPerToken,
          totalDailyAmount,
          startDate: start,
          endDate: end,
          status: 'active',
          createdBy: 'admin',
        },
      })

      // Create individual tokens in this batch
      const tokens = []
      for (let q = 0; q < tokenQuantity; q++) {
        const tokenNo = `TKN-${dateStr}-${(tokenSequence + q).toString().padStart(4, '0')}`

        const token = await tx.token.create({
          data: {
            tokenNo,
            batchId: batch.id,
            customerId: parseInt(customerId),
            collectorId: parseInt(collectorId),
            loanAmount: loanAmountNum,
            interestType,
            interestValue: interestValueNum,
            totalAmount: totalAmountPerToken,
            durationDays: durationDaysNum,
            dailyInstallment: dailyInstallmentPerToken,
            startDate: start,
            endDate: end,
            status: 'active',
            createdBy: 'admin',
          },
        })

        // Create individual repayment schedules for this token
        const schedules = []
        for (let i = 0; i < durationDaysNum; i++) {
          const scheduleDate = new Date(start)
          scheduleDate.setDate(scheduleDate.getDate() + i)

          schedules.push({
            tokenId: token.id,
            scheduleDate,
            installmentAmount: dailyInstallmentPerToken,
            penaltyAmount: 0,
            totalDue: dailyInstallmentPerToken,
            paidAmount: 0,
            status: 'pending' as const,
          })
        }

        await tx.repaymentSchedule.createMany({
          data: schedules,
        })

        tokens.push(token)
      }

      // Create batch-level repayment schedules
      const batchSchedules = []
      for (let i = 0; i < durationDaysNum; i++) {
        const scheduleDate = new Date(start)
        scheduleDate.setDate(scheduleDate.getDate() + i)

        batchSchedules.push({
          batchId: batch.id,
          scheduleDate,
          installmentAmount: totalDailyAmount,
          penaltyPerToken: 0,
          totalPenalty: 0,
          totalDue: totalDailyAmount,
          paidAmount: 0,
          penaltyWaived: 0,
          status: 'pending' as const,
        })
      }

      await tx.batchRepaymentSchedule.createMany({
        data: batchSchedules,
      })

      // Debit admin account when admin creates token batch
      try {
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
          const currentBalance = Number(adminAccount.currentBalance)
          if (currentBalance >= totalBatchAmount) {
            const newBalance = currentBalance - totalBatchAmount

            await (tx as any).adminAccount.update({
              where: { id: adminAccount.id },
              data: { currentBalance: newBalance }
            })

            if ((tx as any).adminAccountTransaction) {
              await (tx as any).adminAccountTransaction.create({
                data: {
                  adminAccountId: adminAccount.id,
                  transactionType: 'debit',
                  amount: totalBatchAmount,
                  balanceAfter: newBalance,
                  referenceType: 'token_creation',
                  referenceId: batch.id,
                  description: `Token batch created: ${batchNo} (${tokenQuantity} tokens)`,
                  createdBy: adminId,
                  createdByType: 'admin'
                }
              })
            }
          } else {
            // Log warning but don't fail batch creation
            console.warn(`Insufficient admin balance. Required: ${totalBatchAmount}, Available: ${currentBalance}`)
          }
        }
      } catch (accountError: any) {
        console.warn('Admin account debit failed:', accountError?.message || accountError)
      }

      return { batch, tokens }
    })

    return NextResponse.json({
      success: true,
      message: `Token batch created successfully with ${tokenQuantity} tokens`,
      data: {
        batch: result.batch,
        tokens: result.tokens,
        tokenCount: tokenQuantity,
      }
    })

  } catch (error) {
    console.error('Token Batch Creation Error:', error)
    return NextResponse.json({
      error: 'Failed to create token batch',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET /api/token-batches - List token batches
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')
    const status = searchParams.get('status')
    const customerId = searchParams.get('customerId')
    const collectorId = searchParams.get('collectorId')

    const where: any = {}

    if (status) {
      where.status = status
    }

    if (customerId) {
      where.customerId = parseInt(customerId)
    }

    if (collectorId) {
      where.collectorId = parseInt(collectorId)
    }

    // For collectors, only show their own batches
    if (session.user.userType === 'collector') {
      where.collectorId = parseInt(session.user.id)
    }

    const [batches, total] = await Promise.all([
      prisma.tokenBatch.findMany({
        where,
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
          tokens: {
            select: {
              id: true,
              tokenNo: true,
              status: true,
            },
          },
          batchSchedules: {
            where: {
              status: 'pending',
            },
            select: {
              scheduleDate: true,
              totalDue: true,
              paidAmount: true,
            },
            orderBy: {
              scheduleDate: 'asc',
            },
            take: 1,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.tokenBatch.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: batches,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    })

  } catch (error) {
    console.error('Token Batch List Error:', error)
    return NextResponse.json({
      error: 'Failed to fetch token batches',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
