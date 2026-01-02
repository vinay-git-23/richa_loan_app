import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// POST /api/admin/collector-transactions - Credit or debit collector account
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || session.user.userType !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { collectorId, type, amount, remarks } = body

        if (!['credit', 'debit'].includes(type)) {
            return NextResponse.json({ error: 'Invalid transaction type' }, { status: 400 })
        }

        if (!amount || amount <= 0) {
            return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
        }

        if (!remarks) {
            return NextResponse.json({ error: 'Remarks are required' }, { status: 400 })
        }

        // Create a cash deposit record with verified status
        // For credit: add to deposited amount (reduces collector's balance)
        // For debit: subtract from deposited amount (increases collector's balance)
        const deposit = await prisma.cashDeposit.create({
            data: {
                collectorId,
                amount: type === 'credit' ? amount : -amount,
                depositDate: new Date(),
                status: 'verified',
                verifiedBy: parseInt(session.user.id),
                verificationDate: new Date(),
                receiptUrl: `Admin ${type}: ${remarks}`
            }
        })

        return NextResponse.json({
            success: true,
            data: deposit,
            message: `Account ${type === 'credit' ? 'credited' : 'debited'} successfully`
        })
    } catch (error) {
        console.error('Collector Transaction POST Error:', error)
        return NextResponse.json({ error: 'Failed to process transaction' }, { status: 500 })
    }
}
