import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET /api/admin/collector-transactions/[id] - Get all transactions for a collector
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || session.user.userType !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id: idParam } = await params
        const collectorId = parseInt(idParam)

        // Get all deposits for this collector
        const deposits = await prisma.cashDeposit.findMany({
            where: { collectorId },
            include: {
                verifier: {
                    select: {
                        username: true
                    }
                }
            },
            orderBy: { depositDate: 'desc' }
        })

        return NextResponse.json({
            success: true,
            data: deposits
        })
    } catch (error) {
        console.error('Collector Transactions GET Error:', error)
        return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
    }
}
