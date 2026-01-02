import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET /api/admin/collector-accounts - Get all collector accounts with balances
// or GET /api/admin/collector-accounts?id=123 - Get specific collector account
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || session.user.userType !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const collectorIdParam = searchParams.get('id')

        // If specific collector requested
        if (collectorIdParam) {
            const collectorId = parseInt(collectorIdParam)
            const collector = await prisma.collector.findUnique({
                where: { id: collectorId },
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

            // Total collected
            const payments = await prisma.payment.findMany({
                where: { collectorId: collector.id },
                select: { amount: true }
            })
            const totalCollected = payments.reduce((sum, p) => sum + Number(p.amount), 0)

            // Total deposited (verified only)
            const verifiedDeposits = await prisma.cashDeposit.findMany({
                where: {
                    collectorId: collector.id,
                    status: 'verified'
                },
                select: { amount: true }
            })
            const totalDeposited = verifiedDeposits.reduce((sum, d) => sum + Number(d.amount), 0)

            // Pending deposits count
            const pendingCount = await prisma.cashDeposit.count({
                where: {
                    collectorId: collector.id,
                    status: 'pending'
                }
            })

            return NextResponse.json({
                success: true,
                data: {
                    ...collector,
                    totalCollected,
                    totalDeposited,
                    currentBalance: totalCollected - totalDeposited,
                    pendingDeposits: pendingCount
                }
            })
        }

        // Get all active collectors
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

        // Get payment data for each collector
        const accountsData = await Promise.all(
            collectors.map(async (collector) => {
                // Total collected
                const payments = await prisma.payment.findMany({
                    where: { collectorId: collector.id },
                    select: { amount: true }
                })
                const totalCollected = payments.reduce((sum, p) => sum + Number(p.amount), 0)

                // Total deposited (verified only)
                const verifiedDeposits = await prisma.cashDeposit.findMany({
                    where: {
                        collectorId: collector.id,
                        status: 'verified'
                    },
                    select: { amount: true }
                })
                const totalDeposited = verifiedDeposits.reduce((sum, d) => sum + Number(d.amount), 0)

                // Pending deposits count
                const pendingCount = await prisma.cashDeposit.count({
                    where: {
                        collectorId: collector.id,
                        status: 'pending'
                    }
                })

                // Last deposit
                const lastDeposit = await prisma.cashDeposit.findFirst({
                    where: { collectorId: collector.id },
                    orderBy: { depositDate: 'desc' },
                    select: { depositDate: true }
                })

                return {
                    ...collector,
                    totalCollected,
                    totalDeposited,
                    currentBalance: totalCollected - totalDeposited,
                    pendingDeposits: pendingCount,
                    lastDeposit: lastDeposit?.depositDate?.toISOString() || null
                }
            })
        )

        return NextResponse.json({
            success: true,
            data: accountsData
        })
    } catch (error) {
        console.error('Collector Accounts GET Error:', error)
        return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 })
    }
}
