import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET /api/collectors/dashboard - Get collector's dashboard stats
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || session.user.userType !== 'collector') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const collectorId = parseInt(session.user.id)
        const today = new Date()
        const todayStart = new Date(today)
        todayStart.setHours(0, 0, 0, 0)
        const todayEnd = new Date(today)
        todayEnd.setHours(23, 59, 59, 999)

        // 1. Get batch-based stats
        const activeBatchesCount = await prisma.tokenBatch.count({
            where: { collectorId, status: 'active' }
        })

        const overdueBatchesCount = await prisma.tokenBatch.count({
            where: { collectorId, status: 'overdue' }
        })

        // Get today's batch schedules
        const todayBatchSchedules = await prisma.batchRepaymentSchedule.findMany({
            where: {
                batch: { collectorId },
                scheduleDate: { gte: todayStart, lte: todayEnd }
            }
        })

        // Get today's collection from batch payments
        const todayBatchCollection = await prisma.batchPayment.aggregate({
            where: {
                collectorId,
                paymentDate: { gte: todayStart, lte: todayEnd }
            },
            _sum: { amount: true }
        })

        // Also include individual token payments (for backward compatibility with non-batch tokens)
        const todayTokenCollection = await prisma.payment.aggregate({
            where: {
                collectorId,
                paymentDate: { gte: todayStart, lte: todayEnd },
                token: {
                    batchId: null // Only non-batch tokens
                }
            },
            _sum: { amount: true }
        })

        // Get today's individual token schedules (for non-batch tokens)
        const todayTokenSchedules = await prisma.repaymentSchedule.findMany({
            where: {
                token: { 
                    collectorId,
                    batchId: null // Only non-batch tokens
                },
                scheduleDate: { gte: todayStart, lte: todayEnd }
            }
        })

        const stats = {
            todayCollection: Number(todayBatchCollection._sum.amount || 0) + Number(todayTokenCollection._sum.amount || 0),
            todayTarget: todayBatchSchedules.reduce((sum, s) => sum + Number(s.totalDue), 0) + 
                        todayTokenSchedules.reduce((sum, s) => sum + Number(s.totalDue), 0),
            activeTokens: activeBatchesCount,
            overdueTokens: overdueBatchesCount,
            todaySchedules: todayBatchSchedules.length + todayTokenSchedules.length,
            pendingSchedules: todayBatchSchedules.filter(s => s.status !== 'paid').length + 
                             todayTokenSchedules.filter(s => s.status !== 'paid').length
        }

        // 2. Get today's batches for the list (priority collections)
        const batches = await prisma.tokenBatch.findMany({
            where: {
                collectorId,
                status: { in: ['active', 'overdue'] }
            },
            include: {
                customer: {
                    select: { name: true, mobile: true }
                },
                batchSchedules: {
                    where: {
                        scheduleDate: { gte: todayStart, lte: todayEnd }
                    },
                    take: 1,
                    orderBy: {
                        scheduleDate: 'asc'
                    }
                }
            },
            orderBy: [
                { status: 'asc' }, // Overdue first
                { createdAt: 'desc' }
            ],
            take: 10
        })

        const formattedBatches = batches.map(batch => {
            const todaySchedule = batch.batchSchedules[0]
            return {
                id: batch.id,
                batchNo: batch.batchNo,
                quantity: batch.quantity,
                customer: batch.customer,
                totalAmount: Number(batch.totalBatchAmount),
                dailyAmount: Number(batch.totalDailyAmount),
                todaySchedule: todaySchedule ? {
                    scheduleDate: todaySchedule.scheduleDate,
                    totalDue: Number(todaySchedule.totalDue) - Number(todaySchedule.paidAmount),
                    status: todaySchedule.status
                } : undefined
            }
        })

        return NextResponse.json({
            success: true,
            data: {
                stats: {
                    ...stats,
                    activeBatches: stats.activeTokens,
                    overdueBatches: stats.overdueTokens
                },
                batches: formattedBatches,
                tokens: formattedBatches // Keep 'tokens' key for backward compatibility with UI
            }
        })

    } catch (error) {
        console.error('Dashboard Data Error:', error)
        return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 })
    }
}