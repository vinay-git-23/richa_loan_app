import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { startOfDay } from 'date-fns'
import { logDebug } from '@/utils/logger'

// POST /api/collectors/payment - Record a new payment
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || session.user.userType !== 'collector') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const collectorId = parseInt(session.user.id)
        const body = await req.json()
        logDebug('Payment Request Attempt', { ...body, photoUrl: body.photoUrl ? 'YES' : 'NO' })
        const { tokenId, amount, paymentMode, remarks, photoUrl } = body

        if (!tokenId || !amount || amount <= 0) {
            return NextResponse.json({ error: 'Token and valid amount are required' }, { status: 400 })
        }

        // 1. Get the token and its pending schedules
        const token = await prisma.token.findUnique({
            where: { id: tokenId, collectorId },
            include: {
                schedules: {
                    where: {
                        status: { in: ['pending', 'partial', 'overdue'] },
                    },
                    orderBy: {
                        scheduleDate: 'asc',
                    },
                },
            },
        })

        if (!token) {
            return NextResponse.json({ error: 'Token not found or not assigned to you' }, { status: 404 })
        }

        if (token.schedules.length === 0) {
            return NextResponse.json({ error: 'No pending schedules found for this token. It might be already closed.' }, { status: 400 })
        }

        // 2. Start a transaction to record payment and update schedules
        const result = await prisma.$transaction(async (tx) => {
            let remainingAmount = Number(amount)
            const paymentDate = new Date()

            // Create the main payment record
            const mainPayment = await tx.payment.create({
                data: {
                    tokenId,
                    collectorId,
                    scheduleId: token.schedules[0].id,
                    amount: Number(amount),
                    paymentMode: paymentMode || 'cash',
                    remarks: remarks || '',
                    photoUrl: photoUrl || null,
                    paymentDate,
                    isSynced: true,
                },
            })

            // Update schedules sequentially
            for (const schedule of token.schedules) {
                if (remainingAmount <= 0) break

                const dueAmount = Number(schedule.totalDue) - Number(schedule.paidAmount)
                const paymentForThisSchedule = Math.min(remainingAmount, dueAmount)

                const newPaidAmount = Number(schedule.paidAmount) + paymentForThisSchedule
                const newStatus = newPaidAmount >= Number(schedule.totalDue) ? 'paid' : 'partial'

                await tx.repaymentSchedule.update({
                    where: { id: schedule.id },
                    data: {
                        paidAmount: newPaidAmount,
                        status: newStatus,
                        paymentDate: newStatus === 'paid' ? paymentDate : schedule.paymentDate,
                    },
                })

                remainingAmount -= paymentForThisSchedule
            }

            // 3. Update token total paid amount and status
            const totalPaidAggregation = await tx.payment.aggregate({
                where: { tokenId },
                _sum: { amount: true },
            })

            const totalPaid = Number(totalPaidAggregation._sum.amount || 0)

            let tokenStatus = token.status
            if (totalPaid >= Number(token.totalAmount)) {
                tokenStatus = 'closed'
            } else {
                // Check if any schedule is still overdue
                const overdueSchedules = await tx.repaymentSchedule.count({
                    where: {
                        tokenId,
                        status: 'overdue'
                    }
                })
                tokenStatus = overdueSchedules > 0 ? 'overdue' : 'active'
            }

            await tx.token.update({
                where: { id: tokenId },
                data: {
                    status: tokenStatus as any,
                    updatedAt: new Date(),
                },
            })

            return mainPayment
        })

        return NextResponse.json({
            success: true,
            data: result,
            message: 'Payment recorded successfully',
        })
    } catch (error: any) {
        logDebug('Payment Recording ERROR', {
            message: error.message,
            code: error.code,
            stack: error.stack
        })
        console.error('Payment Recording Error:', error)
        return NextResponse.json({
            error: 'Failed to record payment',
            details: error.message,
            code: error.code
        }, { status: 500 })
    }
}
