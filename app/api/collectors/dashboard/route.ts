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
        const todayStart = new Date(today.setHours(0, 0, 0, 0))
        const todayEnd = new Date(today.setHours(23, 59, 59, 999))

        // 1. Get stats
        const activeTokensCount = await prisma.token.count({
            where: { collectorId, status: 'active' }
        })

        const overdueTokensCount = await prisma.token.count({
            where: { collectorId, status: 'overdue' }
        })

        const todaySchedules = await prisma.repaymentSchedule.findMany({
            where: {
                token: { collectorId },
                scheduleDate: { gte: todayStart, lte: todayEnd }
            }
        })

        const todayCollection = await prisma.payment.aggregate({
            where: {
                collectorId,
                paymentDate: { gte: todayStart, lte: todayEnd }
            },
            _sum: { amount: true }
        })

        const stats = {
            todayCollection: Number(todayCollection._sum.amount || 0),
            todayTarget: todaySchedules.reduce((sum, s) => sum + Number(s.totalDue), 0),
            activeTokens: activeTokensCount,
            overdueTokens: overdueTokensCount,
            todaySchedules: todaySchedules.length,
            pendingSchedules: todaySchedules.filter(s => s.status !== 'paid').length
        }

        // 2. Get today's tokens for the list
        const tokens = await prisma.token.findMany({
            where: {
                collectorId,
                status: { in: ['active', 'overdue'] }
            },
            include: {
                customer: {
                    select: { name: true, mobile: true }
                },
                schedules: {
                    where: {
                        scheduleDate: { gte: todayStart, lte: todayEnd }
                    },
                    take: 1
                }
            },
            take: 10
        })

        const formattedTokens = tokens.map(t => ({
            id: t.id,
            tokenNo: t.tokenNo,
            customer: t.customer,
            totalAmount: Number(t.totalAmount),
            dailyAmount: Number(t.dailyInstallment),
            todaySchedule: t.schedules[0] ? {
                scheduleDate: t.schedules[0].scheduleDate,
                totalDue: Number(t.schedules[0].totalDue),
                status: t.schedules[0].status
            } : undefined
        }))

        return NextResponse.json({
            success: true,
            data: {
                stats,
                tokens: formattedTokens
            }
        })

    } catch (error) {
        console.error('Dashboard Data Error:', error)
        return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 })
    }
}