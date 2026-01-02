import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// POST /api/collectors/cash-deposits - Record a cash deposit
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || session.user.userType !== 'collector') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const collectorId = parseInt(session.user.id)
        const body = await req.json()
        const { amount, depositDate, remarks } = body

        // Validation
        if (!amount || amount <= 0) {
            return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
        }

        if (!depositDate) {
            return NextResponse.json({ error: 'Deposit date is required' }, { status: 400 })
        }

        // Create deposit record
        const deposit = await prisma.cashDeposit.create({
            data: {
                collectorId,
                amount,
                depositDate: new Date(depositDate),
                status: 'pending',
                receiptUrl: remarks || null
            }
        })

        return NextResponse.json({
            success: true,
            data: deposit,
            message: 'Deposit recorded successfully'
        })
    } catch (error) {
        console.error('Cash Deposit POST Error:', error)
        return NextResponse.json({ error: 'Failed to record deposit' }, { status: 500 })
    }
}
