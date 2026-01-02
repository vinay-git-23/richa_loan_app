import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET /api/admin/pending-deposits - Get all pending deposits
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || session.user.userType !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const deposits = await prisma.cashDeposit.findMany({
            where: { status: 'pending' },
            include: {
                collector: {
                    select: {
                        name: true,
                        collectorId: true
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
        console.error('Pending Deposits GET Error:', error)
        return NextResponse.json({ error: 'Failed to fetch deposits' }, { status: 500 })
    }
}
