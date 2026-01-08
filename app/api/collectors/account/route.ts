import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET /api/collectors/account - Get collector account details
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || session.user.userType !== 'collector') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const collectorId = parseInt(session.user.id)
        const { searchParams } = new URL(req.url)
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')
        const transactionType = searchParams.get('type')
        const page = parseInt(searchParams.get('page') || '1')
        const pageSize = parseInt(searchParams.get('pageSize') || '50')

        // Verify collector exists first
        const collectorExists = await prisma.collector.findUnique({
            where: { id: collectorId }
        })

        if (!collectorExists) {
            return NextResponse.json({ error: 'Collector not found' }, { status: 404 })
        }

        // Get or create collector account
        let account = await (prisma as any).collectorAccount?.findUnique({
            where: { collectorId }
        }).catch(() => null)

        if (!account && (prisma as any).collectorAccount) {
            try {
                account = await (prisma as any).collectorAccount.create({
                    data: {
                        collectorId,
                        currentBalance: 0
                    }
                })
            } catch (error: any) {
                // If account already exists or foreign key error, try to fetch again
                if (error?.code === 'P2002' || error?.code === 'P2003') {
                    account = await (prisma as any).collectorAccount?.findUnique({
                        where: { collectorId }
                    }).catch(() => null)
                } else {
                    throw error
                }
            }
        }

        if (!account) {
            return NextResponse.json({
                success: true,
                data: {
                    account: { currentBalance: 0 },
                    stats: {
                        currentBalance: 0,
                        totalCredits: 0,
                        totalDebits: 0,
                        todayCredits: 0,
                        todayDebits: 0
                    },
                    transactions: [],
                    pagination: { page: 1, pageSize, total: 0, totalPages: 0 }
                }
            })
        }

        // Build transaction query
        const transactionWhere: any = {
            collectorAccountId: account.id
        }

        if (startDate) {
            transactionWhere.transactionDate = { ...transactionWhere.transactionDate, gte: new Date(startDate) }
        }

        if (endDate) {
            transactionWhere.transactionDate = { ...transactionWhere.transactionDate, lte: new Date(endDate) }
        }

        if (transactionType && (transactionType === 'credit' || transactionType === 'debit')) {
            transactionWhere.transactionType = transactionType
        }

        // Get transactions
        const [transactions, total] = await Promise.all([
            (prisma as any).collectorAccountTransaction?.findMany({
                where: transactionWhere,
                orderBy: { transactionDate: 'desc' },
                skip: (page - 1) * pageSize,
                take: pageSize
            }) || [],
            (prisma as any).collectorAccountTransaction?.count({ where: transactionWhere }) || 0
        ])

        // Calculate stats
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const todayEnd = new Date(today)
        todayEnd.setHours(23, 59, 59, 999)

        const allTransactions = await (prisma as any).collectorAccountTransaction?.findMany({
            where: { collectorAccountId: account.id }
        }) || []

        const todayTransactions = allTransactions.filter((t: any) => {
            const txDate = new Date(t.transactionDate)
            return txDate >= today && txDate <= todayEnd
        })

        const credits = allTransactions.filter((t: any) => t.transactionType === 'credit')
        const debits = allTransactions.filter((t: any) => t.transactionType === 'debit')
        const todayCredits = todayTransactions.filter((t: any) => t.transactionType === 'credit')
        const todayDebits = todayTransactions.filter((t: any) => t.transactionType === 'debit')

        const stats = {
            currentBalance: Number(account.currentBalance),
            totalCredits: credits.reduce((sum: number, t: any) => sum + Number(t.amount), 0),
            totalDebits: debits.reduce((sum: number, t: any) => sum + Number(t.amount), 0),
            todayCredits: todayCredits.reduce((sum: number, t: any) => sum + Number(t.amount), 0),
            todayDebits: todayDebits.reduce((sum: number, t: any) => sum + Number(t.amount), 0)
        }

        return NextResponse.json({
            success: true,
            data: {
                account,
                stats,
                transactions: transactions.map((t: any) => ({
                    id: t.id,
                    transactionType: t.transactionType,
                    amount: Number(t.amount),
                    balanceAfter: Number(t.balanceAfter),
                    description: t.description,
                    referenceType: t.referenceType,
                    transactionDate: t.transactionDate.toISOString(),
                    createdAt: t.createdAt.toISOString()
                })),
                pagination: {
                    page,
                    pageSize,
                    total,
                    totalPages: Math.ceil(total / pageSize)
                }
            }
        })
    } catch (error) {
        console.error('Collector Account GET Error:', error)
        return NextResponse.json({ error: 'Failed to fetch account data' }, { status: 500 })
    }
}
