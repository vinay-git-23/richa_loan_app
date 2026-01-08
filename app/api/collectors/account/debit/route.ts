import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// POST /api/collectors/account/debit - Debit from collector account
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || session.user.userType !== 'collector') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const collectorId = parseInt(session.user.id)
        const body = await req.json()
        const { amount, description, toAdmin = true } = body

        if (!amount || parseFloat(amount) <= 0) {
            return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
        }

        const debitAmount = parseFloat(amount)

        // Verify collector exists
        const collector = await prisma.collector.findUnique({
            where: { id: collectorId }
        })

        if (!collector) {
            return NextResponse.json({ error: 'Collector not found' }, { status: 404 })
        }

        await prisma.$transaction(async (tx) => {
            // Get or create collector account
            let collectorAccount = await (tx as any).collectorAccount?.findUnique({
                where: { collectorId }
            }).catch(() => null)

            if (!collectorAccount && (tx as any).collectorAccount) {
                collectorAccount = await (tx as any).collectorAccount.create({
                    data: {
                        collectorId,
                        currentBalance: 0
                    }
                })
            }

            if (!collectorAccount || !(tx as any).collectorAccount) {
                throw new Error('Account system not available')
            }

            const currentBalance = Number(collectorAccount.currentBalance)

            if (currentBalance < debitAmount) {
                throw new Error(`Insufficient balance. Available: ${currentBalance}`)
            }

            // Debit collector account
            const newBalance = currentBalance - debitAmount

            await (tx as any).collectorAccount.update({
                where: { id: collectorAccount.id },
                data: { currentBalance: newBalance }
            })

            // Create debit transaction for collector
            if ((tx as any).collectorAccountTransaction) {
                await (tx as any).collectorAccountTransaction.create({
                    data: {
                        collectorAccountId: collectorAccount.id,
                        transactionType: 'debit',
                        amount: debitAmount,
                        balanceAfter: newBalance,
                        description: description || 'Manual debit',
                        referenceType: 'collector_debit',
                        createdBy: collectorId,
                        createdByType: 'collector'
                    }
                })
            }

            // Credit admin account only if toAdmin is true
            if (toAdmin) {
                const adminId = 1 // Assuming first admin, or get from session if needed
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
                        if (error?.code !== 'P2002' && error?.code !== 'P2003') {
                            throw error
                        }
                    }
                }

                if (adminAccount && (tx as any).adminAccount) {
                    const adminNewBalance = Number(adminAccount.currentBalance) + debitAmount

                    await (tx as any).adminAccount.update({
                        where: { id: adminAccount.id },
                        data: { currentBalance: adminNewBalance }
                    })

                    // Create credit transaction for admin
                    if ((tx as any).adminAccountTransaction) {
                        await (tx as any).adminAccountTransaction.create({
                            data: {
                                adminAccountId: adminAccount.id,
                                transactionType: 'credit',
                                amount: debitAmount,
                                balanceAfter: adminNewBalance,
                                description: description || `Debit from collector ${collector.name}`,
                                referenceType: 'collector_debit',
                                referenceId: collectorId,
                                createdBy: collectorId,
                                createdByType: 'collector'
                            }
                        })
                    }
                }
            }
        })

        return NextResponse.json({
            success: true,
            message: 'Amount debited successfully'
        })
    } catch (error: any) {
        console.error('Collector Account Debit Error:', error)
        return NextResponse.json({
            error: error.message || 'Failed to process debit'
        }, { status: 500 })
    }
}

