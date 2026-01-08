import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET /api/admin/collector-accounts - Get all collector accounts with balances or single collector by id
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || session.user.userType !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const collectorId = searchParams.get('id')

        // If ID is provided, return single collector details
        if (collectorId) {
            const collector = await prisma.collector.findUnique({
                where: { id: parseInt(collectorId) },
                select: {
                    id: true,
                    name: true,
                    collectorId: true,
                    mobile: true
                }
            })

            if (!collector) {
                return NextResponse.json({ error: 'Collector not found' }, { status: 404 })
            }

            // Get collector account
            const account = await (prisma as any).collectorAccount?.findUnique({
                where: { collectorId: collector.id }
            }).catch(() => null)

            // Get collector account transactions
            const transactions = account ? await (prisma as any).collectorAccountTransaction?.findMany({
                where: { collectorAccountId: account.id }
            }).catch(() => []) : []

            // Calculate stats from transactions
            const credits = transactions.filter((t: any) => t.transactionType === 'credit')
            const debits = transactions.filter((t: any) => t.transactionType === 'debit')
            
            const totalCollected = credits
                .filter((t: any) => t.referenceType === 'collection')
                .reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0)
            
            const totalDeposited = credits
                .filter((t: any) => t.referenceType === 'admin_credit')
                .reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0)

            // Get pending deposits (cash deposits that are pending)
            const pendingDeposits = await prisma.cashDeposit.count({
                where: {
                    collectorId: collector.id,
                    status: 'pending'
                }
            })

            return NextResponse.json({
                success: true,
                data: {
                    ...collector,
                    currentBalance: account ? Number(account.currentBalance || 0) : 0,
                    totalCollected: totalCollected || 0,
                    totalDeposited: totalDeposited || 0,
                    pendingDeposits: pendingDeposits || 0
                }
            })
        }

        // Otherwise return all collectors
        const collectors = await prisma.collector.findMany({
            where: { isActive: true },
            select: {
                id: true,
                name: true,
                collectorId: true,
                mobile: true
            },
            orderBy: { name: 'asc' }
        })

        // Get account data for each collector
        const accountsData = await Promise.all(
            collectors.map(async (collector) => {
                // Get collector account using new model
                const account = await (prisma as any).collectorAccount?.findUnique({
                    where: {
                        collectorId: collector.id
                    }
                }).catch(() => null)

                return {
                    ...collector,
                    currentBalance: account ? Number(account.currentBalance || 0) : 0
                }
            })
        )

        return NextResponse.json({
            success: true,
            data: accountsData
        })
    } catch (error) {
        console.error('Collector Accounts GET Error:', error)
        return NextResponse.json({ error: 'Failed to fetch collector accounts' }, { status: 500 })
    }
}
