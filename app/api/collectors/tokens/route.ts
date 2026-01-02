import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { startOfDay } from 'date-fns'

// GET /api/collectors/tokens - Get all tokens assigned to collector
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || session.user.userType !== 'collector') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // session.user.id is already the collector's database ID
        const collectorId = parseInt(session.user.id)
        const today = startOfDay(new Date())

        // Get all tokens assigned to collector
        const tokens = await prisma.token.findMany({
            where: {
                collectorId,
            },
            include: {
                customer: {
                    select: {
                        name: true,
                        mobile: true,
                    },
                },
                schedules: {
                    where: {
                        status: { in: ['pending', 'partial', 'overdue'] },
                    },
                    orderBy: {
                        scheduleDate: 'asc',
                    },
                    take: 1,
                },
                _count: {
                    select: { payments: true }
                }
            },
            orderBy: [
                { status: 'asc' },
                { startDate: 'desc' },
            ],
        })

        // Get paid amounts for these tokens
        const payments = await prisma.payment.groupBy({
            by: ['tokenId'],
            where: { tokenId: { in: tokens.map(t => t.id) } },
            _sum: { amount: true }
        })

        const paidMap = new Map(payments.map(p => [p.tokenId, Number(p._sum.amount || 0)]))

        // Format tokens with today's due and overdue info
        const tokensFormatted = tokens.map((token) => {
            const firstPendingSchedule = token.schedules[0]
            let todayDue = 0
            let overdueDays = 0

            if (firstPendingSchedule) {
                todayDue = Number(firstPendingSchedule.totalDue) - Number(firstPendingSchedule.paidAmount)
                const scheduleDate = new Date(firstPendingSchedule.scheduleDate)
                const diffTime = today.getTime() - scheduleDate.getTime()
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
                overdueDays = diffDays > 0 ? diffDays : 0
            }

            return {
                id: token.id,
                tokenNo: token.tokenNo,
                totalAmount: Number(token.totalAmount),
                paidAmount: paidMap.get(token.id) || 0,
                dailyInstallment: Number(token.dailyInstallment),
                duration: token.durationDays,
                status: token.status,
                startDate: token.startDate,
                customer: token.customer,
                todayDue,
                overdueDays,
            }
        })

        return NextResponse.json({
            success: true,
            data: tokensFormatted,
        })
    } catch (error) {
        console.error('Collector Tokens Error:', error)
        return NextResponse.json({ error: 'Failed to fetch tokens' }, { status: 500 })
    }
}