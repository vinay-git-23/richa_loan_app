import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// PUT /api/admin/cash-deposits/[id] - Verify or reject a deposit
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || session.user.userType !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id: idParam } = await params
        const depositId = parseInt(idParam)
        const body = await req.json()
        const { status } = body

        if (!['verified', 'rejected'].includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
        }

        const deposit = await prisma.cashDeposit.update({
            where: { id: depositId },
            data: {
                status,
                verifiedBy: parseInt(session.user.id),
                verificationDate: new Date()
            }
        })

        return NextResponse.json({
            success: true,
            data: deposit,
            message: `Deposit ${status} successfully`
        })
    } catch (error) {
        console.error('Cash Deposit PUT Error:', error)
        return NextResponse.json({ error: 'Failed to update deposit' }, { status: 500 })
    }
}
