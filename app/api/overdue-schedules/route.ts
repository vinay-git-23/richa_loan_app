import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { startOfDay } from 'date-fns'

// GET /api/overdue-schedules - Get all overdue batch schedules with stats
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || session.user.userType !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const statusFilter = searchParams.get('status')
        const collectorId = searchParams.get('collectorId')
        const search = searchParams.get('search') || ''

        const today = startOfDay(new Date())

        // Build where clause for batch schedules
        const where: any = {
            scheduleDate: { lt: today },
            status: { in: ['pending', 'partial', 'overdue'] },
        }

        if (statusFilter && statusFilter !== 'all') {
            where.status = statusFilter
        }

        // Add batch filters
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
            where.batch = batchFilters
        }

        // Get overdue batch schedules
        const schedules = await prisma.batchRepaymentSchedule.findMany({
            where,
            include: {
                batch: {
                    include: {
                        customer: {
                            select: {
                                name: true,
                                mobile: true,
                            },
                        },
                        collector: {
                            select: {
                                name: true,
                                collectorId: true,
                            },
                        },
                    },
                },
            },
            orderBy: [
                { scheduleDate: 'asc' },
                { batch: { batchNo: 'asc' } },
            ],
        })

        // Recalculate status for each schedule to ensure accuracy
        const schedulesWithCorrectStatus = await Promise.all(
            schedules.map(async (schedule) => {
                const installmentAmount = Number(schedule.installmentAmount)
                const totalPenalty = Number(schedule.totalPenalty)
                const paidAmount = Number(schedule.paidAmount)
                const penaltyWaived = Number(schedule.penaltyWaived)
                const totalDue = Number(schedule.totalDue)
                const scheduleDate = new Date(schedule.scheduleDate)

                // Calculate correct status
                const totalReceived = paidAmount + penaltyWaived
                let correctStatus: 'pending' | 'paid' | 'overdue' | 'partial' = schedule.status

                // If fully paid (total received >= total due)
                if (totalReceived >= totalDue) {
                    correctStatus = 'paid'
                }
                // If installment is fully paid AND (no penalty OR penalty is fully waived)
                else if (paidAmount >= installmentAmount && (totalPenalty === 0 || penaltyWaived >= totalPenalty)) {
                    correctStatus = 'paid'
                }
                // If partially paid (some payment made but not full)
                else if (paidAmount > 0 && totalReceived < totalDue) {
                    // Check if it's overdue
                    if (scheduleDate < today) {
                        correctStatus = 'overdue'
                    } else {
                        correctStatus = 'partial'
                    }
                }
                // If overdue (past due date and not paid)
                else if (scheduleDate < today) {
                    correctStatus = 'overdue'
                }
                // Otherwise pending
                else {
                    correctStatus = 'pending'
                }

                // Update status in database if it's different
                if (correctStatus !== schedule.status) {
                    await prisma.batchRepaymentSchedule.update({
                        where: { id: schedule.id },
                        data: { 
                            status: correctStatus,
                            // If marked as paid, set payment date
                            paymentDate: correctStatus === 'paid' ? (schedule.paymentDate || new Date()) : schedule.paymentDate,
                        },
                    })
                }

                return {
                    ...schedule,
                    status: correctStatus,
                }
            })
        )

        // Calculate statistics using corrected schedules
        const totalSchedules = schedulesWithCorrectStatus.length
        const totalPenaltyApplied = schedulesWithCorrectStatus.reduce((sum, s) => sum + Number(s.totalPenalty), 0)
        const totalOverdue = schedulesWithCorrectStatus.reduce((sum, s) => {
            const balance = Number(s.totalDue) - Number(s.paidAmount) - Number(s.penaltyWaived)
            return sum + balance
        }, 0)

        // Calculate average overdue days
        const totalOverdueDays = schedulesWithCorrectStatus.reduce((sum, s) => {
            const scheduleDate = new Date(s.scheduleDate)
            const diffTime = today.getTime() - scheduleDate.getTime()
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
            return sum + diffDays
        }, 0)
        const averageOverdueDays = totalSchedules > 0 ? totalOverdueDays / totalSchedules : 0

        const stats = {
            totalSchedules,
            totalPenaltyApplied,
            totalOverdue,
            averageOverdueDays,
        }

        return NextResponse.json({
            success: true,
            data: schedulesWithCorrectStatus,
            stats,
        })
    } catch (error) {
        console.error('Overdue Schedules GET Error:', error)
        return NextResponse.json({ error: 'Failed to fetch overdue schedules' }, { status: 500 })
    }
}
