import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// POST /api/collectors/tokens/create - Create token batch by collector
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.userType !== 'collector') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const collectorId = parseInt(session.user.id)
    const body = await req.json()

    const {
      customerId,
      loanAmount,
      interestType,
      interestValue,
      durationDays,
      startDate,
      quantity
    } = body

    // Validation
    if (!customerId || !loanAmount || !interestType || interestValue === undefined || !durationDays || !startDate) {
      return NextResponse.json({
        error: 'All fields are required: customerId, loanAmount, interestType, interestValue, durationDays, startDate'
      }, { status: 400 })
    }

    if (loanAmount <= 0 || durationDays <= 0) {
      return NextResponse.json({
        error: 'Loan amount and duration must be positive'
      }, { status: 400 })
    }

    // Validate quantity
    const tokenQuantity = quantity ? parseInt(quantity) : 1
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
      where: { id: customerId, isActive: true }
    })

    if (!customer) {
      return NextResponse.json({
        error: 'Customer not found or inactive'
      }, { status: 404 })
    }

    // Verify collector is active
    const collector = await prisma.collector.findUnique({
      where: { id: collectorId, isActive: true }
    })

    if (!collector) {
      return NextResponse.json({
        error: 'Collector account is inactive'
      }, { status: 403 })
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
          customerId,
          collectorId,
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
          createdBy: 'collector',
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
            customerId,
            collectorId,
            loanAmount: loanAmountNum,
            interestType,
            interestValue: interestValueNum,
            totalAmount: totalAmountPerToken,
            durationDays: durationDaysNum,
            dailyInstallment: dailyInstallmentPerToken,
            startDate: start,
            endDate: end,
            status: 'active',
            createdBy: 'collector',
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

      // Debit collector account when collector creates token batch
      try {
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
          const currentBalance = Number(collectorAccount.currentBalance)
          if (currentBalance >= totalBatchAmount) {
            const newBalance = currentBalance - totalBatchAmount

            await (tx as any).collectorAccount.update({
              where: { id: collectorAccount.id },
              data: { currentBalance: newBalance }
            })

            if ((tx as any).collectorAccountTransaction) {
              await (tx as any).collectorAccountTransaction.create({
                data: {
                  collectorAccountId: collectorAccount.id,
                  transactionType: 'debit',
                  amount: totalBatchAmount,
                  balanceAfter: newBalance,
                  referenceType: 'token_creation',
                  referenceId: batch.id,
                  description: `Token batch created: ${batchNo} (${tokenQuantity} tokens)`,
                  createdBy: collectorId,
                  createdByType: 'collector'
                }
              })
            }
          } else {
            // Log warning but don't fail batch creation
            console.warn(`Insufficient collector balance. Required: ${totalBatchAmount}, Available: ${currentBalance}`)
          }
        }
      } catch (accountError: any) {
        console.warn('Collector account debit failed:', accountError?.message || accountError)
      }

      return { batch, tokens }
    }, {
      maxWait: 10000, // Maximum time to wait for a transaction slot
      timeout: 30000, // Maximum time for the transaction to complete (30 seconds)
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
    console.error('Collector Token Batch Creation Error:', error)
    return NextResponse.json({
      error: 'Failed to create token batch',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
