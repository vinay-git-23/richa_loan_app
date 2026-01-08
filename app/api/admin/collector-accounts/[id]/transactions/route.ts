import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET /api/admin/collector-accounts/[id]/transactions - Get collector account transactions
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || session.user.userType !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params
        const collectorId = parseInt(id)

        // Get collector account
        const account = await (prisma as any).collectorAccount?.findUnique({
            where: { collectorId }
        }).catch(() => null)

        if (!account) {
            return NextResponse.json({
                success: true,
                data: []
            })
        }

        // Get account transactions
        const transactions = await (prisma as any).collectorAccountTransaction?.findMany({
            where: { collectorAccountId: account.id },
            orderBy: { transactionDate: 'desc' }
        }).catch(() => [])

        return NextResponse.json({
            success: true,
            data: transactions.map((t: any) => ({
                id: t.id,
                transactionType: t.transactionType,
                amount: Number(t.amount || 0),
                balanceAfter: Number(t.balanceAfter || 0),
                description: t.description,
                referenceType: t.referenceType,
                transactionDate: t.transactionDate?.toISOString() || t.createdAt?.toISOString(),
                createdAt: t.createdAt?.toISOString()
            }))
        })
    } catch (error) {
        console.error('Collector Account Transactions GET Error:', error)
        return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
    }
}

