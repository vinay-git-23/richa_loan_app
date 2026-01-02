import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET /api/collectors/cash-account - Get collector's cash account data
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || session.user.userType !== 'collector') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const collectorId = parseInt(session.user.id)

        // Get all payments collected by this collector
        const payments = await prisma.payment.findMany({
            where: { collectorId },
            select: { amount: true }
        })

        const totalCollected = payments.reduce((sum, p) => sum + Number(p.amount), 0)

        // Get all verified deposits
        const verifiedDeposits = await prisma.cashDeposit.findMany({
            where: {
                collectorId,
                status: 'verified'
            },
            select: { amount: true }
        })

        const totalDeposited = verifiedDeposits.reduce((sum, d) => sum + Number(d.amount), 0)

        // Get all deposits with their status
        const deposits = await prisma.cashDeposit.findMany({
            where: { collectorId },
            orderBy: { depositDate: 'desc' }
        })

        const pendingDeposits = deposits.filter(d => d.status === 'pending').length
        const verifiedDepositsCount = deposits.filter(d => d.status === 'verified').length

        const stats = {
            totalCollected,
            totalDeposited,
            currentBalance: totalCollected - totalDeposited,
            pendingDeposits,
            verifiedDeposits: verifiedDepositsCount
        }

        return NextResponse.json({
            success: true,
            data: {
                stats,
                deposits
            }
        })
    } catch (error) {
        console.error('Cash Account GET Error:', error)
        return NextResponse.json({ error: 'Failed to fetch account data' }, { status: 500 })
    }
}
