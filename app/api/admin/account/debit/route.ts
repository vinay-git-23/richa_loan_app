import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// POST /api/admin/account/debit - Debit from admin account
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

        const debitAmount = parseFloat(amount)

        // Verify admin exists
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

            const currentBalance = Number(adminAccount.currentBalance)

            if (currentBalance < debitAmount) {
                throw new Error(`Insufficient balance. Available: ${currentBalance}`)
            }

            // Debit admin account
            const newBalance = currentBalance - debitAmount

            await (tx as any).adminAccount.update({
                where: { id: adminAccount.id },
                data: { currentBalance: newBalance }
            })

            // Create debit transaction
            if ((tx as any).adminAccountTransaction) {
                await (tx as any).adminAccountTransaction.create({
                    data: {
                        adminAccountId: adminAccount.id,
                        transactionType: 'debit',
                        amount: debitAmount,
                        balanceAfter: newBalance,
                        description: description || 'Manual debit',
                        referenceType: 'manual_debit',
                        createdBy: adminId,
                        createdByType: 'admin'
                    }
                })
            }
        })

        return NextResponse.json({
            success: true,
            message: 'Amount debited successfully'
        })
    } catch (error: any) {
        console.error('Admin Account Debit Error:', error)
        return NextResponse.json({
            error: error.message || 'Failed to process debit'
        }, { status: 500 })
    }
}

