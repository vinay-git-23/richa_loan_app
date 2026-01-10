import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET /api/admin/account - Get admin account details
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || session.user.userType !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const adminId = parseInt(session.user.id)
        const { searchParams } = new URL(req.url)
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')
        const transactionType = searchParams.get('type')
        const page = parseInt(searchParams.get('page') || '1')
        const pageSize = parseInt(searchParams.get('pageSize') || '50')

        // Verify admin exists first
        const adminExists = await prisma.adminUser.findUnique({
            where: { id: adminId }
        })

        if (!adminExists) {
            return NextResponse.json({ error: 'Admin user not found' }, { status: 404 })
        }

        // Get or create admin account
        let account = await (prisma as any).adminAccount?.findUnique({
            where: { adminId }
        }).catch(() => null)

        if (!account && (prisma as any).adminAccount) {
            try {
                account = await (prisma as any).adminAccount.create({
                    data: {
                        adminId,
                        currentBalance: 0
                    }
                })
            } catch (error: any) {
                // If account already exists or foreign key error, try to fetch again
                if (error?.code === 'P2002' || error?.code === 'P2003') {
                    account = await (prisma as any).adminAccount?.findUnique({
                        where: { adminId }
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
            adminAccountId: account.id
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
            (prisma as any).adminAccountTransaction?.findMany({
                where: transactionWhere,
                orderBy: { transactionDate: 'desc' },
                skip: (page - 1) * pageSize,
                take: pageSize
            }) || [],
            (prisma as any).adminAccountTransaction?.count({ where: transactionWhere }) || 0
        ])

        // Calculate stats
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const todayEnd = new Date(today)
        todayEnd.setHours(23, 59, 59, 999)

        const allTransactions = await (prisma as any).adminAccountTransaction?.findMany({
            where: { adminAccountId: account.id }
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

        // Fetch creator names for transactions
        const transactionsWithCreators = await Promise.all(
            transactions.map(async (t: any) => {
                let creatorName = 'System'
                if (t.createdBy && t.createdByType) {
                    try {
                        if (t.createdByType === 'admin') {
                            const admin = await prisma.adminUser.findUnique({
                                where: { id: t.createdBy },
                                select: { username: true }
                            })
                            creatorName = admin?.username || `Admin #${t.createdBy}`
                        } else if (t.createdByType === 'collector') {
                            const collector = await prisma.collector.findUnique({
                                where: { id: t.createdBy },
                                select: { name: true, collectorId: true }
                            })
                            creatorName = collector?.name || `Collector #${t.createdBy}`
                        }
                    } catch (error) {
                        console.error('Error fetching creator:', error)
                        creatorName = t.createdByType === 'admin' ? `Admin #${t.createdBy}` : `Collector #${t.createdBy}`
                    }
                }

                return {
                    id: t.id,
                    transactionType: t.transactionType,
                    amount: Number(t.amount),
                    balanceAfter: Number(t.balanceAfter),
                    description: t.description,
                    referenceType: t.referenceType,
                    transactionDate: t.transactionDate.toISOString(),
                    createdAt: t.createdAt.toISOString(),
                    createdBy: t.createdBy,
                    createdByType: t.createdByType,
                    creatorName: creatorName
                }
            })
        )

        return NextResponse.json({
            success: true,
            data: {
                account,
                stats,
                transactions: transactionsWithCreators,
                pagination: {
                    page,
                    pageSize,
                    total,
                    totalPages: Math.ceil(total / pageSize)
                }
            }
        })
    } catch (error) {
        console.error('Admin Account GET Error:', error)
        return NextResponse.json({ error: 'Failed to fetch account data' }, { status: 500 })
    }
}

// POST /api/admin/account/add - Add amount to admin account
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || session.user.userType !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const adminId = parseInt(session.user.id)
        const body = await req.json()
        const { amount, description } = body

        if (!amount || parseFloat(amount) <= 0) {
            return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
        }

        const addAmount = parseFloat(amount)

        // Verify admin exists first
        const adminExists = await prisma.adminUser.findUnique({
            where: { id: adminId }
        })

        if (!adminExists) {
            return NextResponse.json({ error: 'Admin user not found' }, { status: 404 })
        }

        await prisma.$transaction(async (tx) => {
            // Get or create admin account
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

            if (!adminAccount || !(tx as any).adminAccount) {
                throw new Error('Account system not available')
            }

            // Update account balance
            const newBalance = Number(adminAccount.currentBalance) + addAmount

            await (tx as any).adminAccount.update({
                where: { id: adminAccount.id },
                data: { currentBalance: newBalance }
            })

            // Create credit transaction
            if ((tx as any).adminAccountTransaction) {
                await (tx as any).adminAccountTransaction.create({
                    data: {
                        adminAccountId: adminAccount.id,
                        transactionType: 'credit',
                        amount: addAmount,
                        balanceAfter: newBalance,
                        description: description || 'Manual amount addition',
                        referenceType: 'manual_add',
                        createdBy: adminId,
                        createdByType: 'admin'
                    }
                })
            }
        })

        return NextResponse.json({
            success: true,
            message: 'Amount added successfully'
        })
    } catch (error) {
        console.error('Admin Account Add Error:', error)
        return NextResponse.json({ error: 'Failed to add amount' }, { status: 500 })
    }
}
