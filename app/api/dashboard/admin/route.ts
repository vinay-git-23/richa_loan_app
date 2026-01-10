import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
    try {
        // Check authentication
        const session = await getServerSession(authOptions)
        if (!session || (session.user.userType !== 'admin' && session.user.role !== 'director')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get today's date (midnight)
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)

        // ============================================
        // 1. TOTAL ACTIVE TOKENS
        // ============================================
        const totalActiveTokens = await prisma.token.count({
            where: { status: 'active' },
        })

        // ============================================
        // 2. TOTAL DISBURSED AMOUNT (ALL TIME)
        // ============================================
        const disbursedResult = await prisma.token.aggregate({
            _sum: { loanAmount: true },
        })
        const totalDisbursedAmount = Number(disbursedResult._sum.loanAmount || 0)

        // ============================================
        // 3. TOTAL COLLECTED AMOUNT (ALL TIME)
        // ============================================
        const collectedResult = await prisma.payment.aggregate({
            _sum: { amount: true },
        })
        const totalCollectedAmount = Number(collectedResult._sum.amount || 0)

        // ============================================
        // 4. TOTAL OUTSTANDING AMOUNT
        // ============================================
        const outstandingResult = await prisma.token.aggregate({
            where: { status: { in: ['active', 'overdue'] } },
            _sum: { totalAmount: true },
        })
        const totalOutstandingAmount = Number(outstandingResult._sum.totalAmount || 0) - totalCollectedAmount

        // ============================================
        // 5. TODAY'S COLLECTION TARGET
        // ============================================
        const todaySchedules = await prisma.repaymentSchedule.findMany({
            where: {
                scheduleDate: {
                    gte: today,
                    lt: tomorrow,
                },
                status: { in: ['pending', 'overdue'] },
            },
        })

        const todayCollectionTarget = todaySchedules.reduce(
            (sum, schedule) => sum + Number(schedule.totalDue),
            0
        )

        // ============================================
        // 6. TODAY'S ACTUAL COLLECTION
        // ============================================
        const todayPayments = await prisma.payment.findMany({
            where: {
                paymentDate: {
                    gte: today,
                    lt: tomorrow,
                },
            },
        })

        const todayActualCollection = todayPayments.reduce(
            (sum, payment) => sum + Number(payment.amount),
            0
        )

        // ============================================
        // 7. OVERDUE DATA
        // ============================================
        const overdueTokens = await prisma.token.count({
            where: { status: 'overdue' },
        })

        const overdueSchedules = await prisma.repaymentSchedule.findMany({
            where: { status: 'overdue' },
        })

        const totalOverdueAmount = overdueSchedules.reduce(
            (sum, schedule) => sum + Number(schedule.totalDue) - Number(schedule.paidAmount),
            0
        )

        // ============================================
        // 8. COLLECTION EFFICIENCY
        // ============================================
        const collectionEfficiency =
            todayCollectionTarget > 0
                ? Math.round((todayActualCollection / todayCollectionTarget) * 100 * 100) / 100
                : 0

        // ============================================
        // 9. RECENT PAYMENTS (Last 10)
        // ============================================
        const recentPayments = await prisma.payment.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
                token: {
                    include: {
                        customer: true,
                    },
                },
                collector: true,
            },
        })

        // ============================================
        // 10. OVERDUE CUSTOMERS (Top 10 by amount)
        // ============================================
        const overdueCustomers = await prisma.token.findMany({
            where: { status: 'overdue' },
            take: 10,
            include: {
                customer: true,
                collector: true,
                schedules: {
                    where: { status: 'overdue' },
                },
            },
            orderBy: {
                schedules: {
                    _count: 'desc',
                },
            },
        })

        // ============================================
        // 11. COLLECTOR PERFORMANCE
        // ============================================
        const collectors = await prisma.collector.findMany({
            where: { isActive: true },
            include: {
                payments: {
                    where: {
                        paymentDate: {
                            gte: today,
                            lt: tomorrow,
                        },
                    },
                },
                tokens: {
                    where: { status: { in: ['active', 'overdue'] } },
                },
            },
        })

        const collectorPerformance = collectors.map((collector) => ({
            id: collector.id,
            name: collector.name,
            collectorId: collector.collectorId,
            todayCollection: collector.payments.reduce((sum, p) => sum + Number(p.amount), 0),
            activeTokens: collector.tokens.length,
        }))

        // ============================================
        // 12. DAILY COLLECTION TREND (Last 7 days)
        // ============================================
        const sevenDaysAgo = new Date(today)
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

        const dailyCollections = await prisma.$queryRaw<
            Array<{ date: Date; total: number; count: number }>
        >`
      SELECT 
        DATE(paymentDate) as date,
        SUM(amount) as total,
        COUNT(*) as count
      FROM payments
      WHERE paymentDate >= ${sevenDaysAgo} AND paymentDate < ${tomorrow}
      GROUP BY DATE(paymentDate)
      ORDER BY date ASC
    `

        // ============================================
        // 13. TOKEN STATUS DISTRIBUTION
        // ============================================
        const statusCounts = await prisma.token.groupBy({
            by: ['status'],
            _count: { status: true },
        })

        const tokenStatusDistribution = statusCounts.map((item) => ({
            status: item.status,
            count: item._count.status,
        }))

        // ============================================
        // RETURN RESPONSE
        // ============================================
        return NextResponse.json({
            success: true,
            data: {
                stats: {
                    totalActiveTokens,
                    totalDisbursedAmount: Math.round(totalDisbursedAmount * 100) / 100,
                    totalCollectedAmount: Math.round(totalCollectedAmount * 100) / 100,
                    totalOutstandingAmount: Math.round(totalOutstandingAmount * 100) / 100,
                    todayCollectionTarget: Math.round(todayCollectionTarget * 100) / 100,
                    todayActualCollection: Math.round(todayActualCollection * 100) / 100,
                    collectionEfficiency,
                    overdueTokens,
                    totalOverdueAmount: Math.round(totalOverdueAmount * 100) / 100,
                },
                recentPayments: recentPayments
                    .filter((payment) => payment.token && payment.token.customer)
                    .map((payment) => ({
                        id: payment.id,
                        amount: Number(payment.amount),
                        date: payment.paymentDate,
                        customerName: payment.token!.customer.name,
                        collectorName: payment.collector.name,
                        tokenNo: payment.token!.tokenNo,
                        paymentMode: payment.paymentMode,
                    })),
                overdueCustomers: overdueCustomers.map((token) => ({
                    tokenNo: token.tokenNo,
                    customerName: token.customer.name,
                    customerMobile: token.customer.mobile,
                    collectorName: token.collector.name,
                    overdueDays: token.schedules.length,
                    overdueAmount: token.schedules.reduce(
                        (sum, s) => sum + Number(s.totalDue) - Number(s.paidAmount),
                        0
                    ),
                })),
                collectorPerformance: collectorPerformance.sort((a, b) => b.todayCollection - a.todayCollection),
                dailyCollectionTrend: dailyCollections.map((item) => ({
                    date: item.date,
                    total: Number(item.total),
                    count: Number(item.count),
                })),
                tokenStatusDistribution,
            },
        })
    } catch (error) {
        console.error('Dashboard API Error:', error)
        return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 })
    }
}