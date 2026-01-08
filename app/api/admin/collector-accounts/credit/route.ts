import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// POST /api/admin/collector-accounts/credit - Credit to collector account (debits admin)
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || session.user.userType !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const adminId = parseInt(session.user.id)
        const body = await req.json()
        const { collectorId, amount, description } = body

        if (!collectorId || !amount || parseFloat(amount) <= 0) {
            return NextResponse.json({ error: 'Invalid collector ID or amount' }, { status: 400 })
        }

        const creditAmount = parseFloat(amount)

        // Verify collector exists
        const collector = await prisma.collector.findUnique({
            where: { id: parseInt(collectorId) }
        })

        if (!collector) {
            return NextResponse.json({ error: 'Collector not found' }, { status: 404 })
        }

        // Verify admin exists first
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
                    // If account already exists, fetch it
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
                throw new Error('Admin account system not available')
            }

            const adminBalance = Number(adminAccount.currentBalance)

            if (adminBalance < creditAmount) {
                throw new Error('Insufficient admin balance')
            }

            // Debit admin account
            const adminNewBalance = adminBalance - creditAmount

            await (tx as any).adminAccount.update({
                where: { id: adminAccount.id },
                data: { currentBalance: adminNewBalance }
            })

            // Create debit transaction for admin
            if ((tx as any).adminAccountTransaction) {
                await (tx as any).adminAccountTransaction.create({
                    data: {
                        adminAccountId: adminAccount.id,
                        transactionType: 'debit',
                        amount: creditAmount,
                        balanceAfter: adminNewBalance,
                        description: description || `Credit to collector ${collector.name}`,
                        referenceType: 'collector_credit',
                        referenceId: parseInt(collectorId),
                        createdBy: adminId,
                        createdByType: 'admin'
                    }
                })
            }

            // Get or create collector account
            let collectorAccount = await (tx as any).collectorAccount?.findUnique({
                where: { collectorId: parseInt(collectorId) }
            }).catch(() => null)

            if (!collectorAccount && (tx as any).collectorAccount) {
                try {
                    collectorAccount = await (tx as any).collectorAccount.create({
                        data: {
                            collectorId: parseInt(collectorId),
                            currentBalance: 0
                        }
                    })
                } catch (error: any) {
                    // If account already exists, fetch it
                    if (error?.code === 'P2002' || error?.code === 'P2003') {
                        collectorAccount = await (tx as any).collectorAccount?.findUnique({
                            where: { collectorId: parseInt(collectorId) }
                        }).catch(() => null)
                    } else {
                        throw error
                    }
                }
            }

            if (collectorAccount && (tx as any).collectorAccount) {
                // Credit collector account
                const collectorNewBalance = Number(collectorAccount.currentBalance) + creditAmount

                await (tx as any).collectorAccount.update({
                    where: { id: collectorAccount.id },
                    data: { currentBalance: collectorNewBalance }
                })

                // Create credit transaction for collector
                if ((tx as any).collectorAccountTransaction) {
                    await (tx as any).collectorAccountTransaction.create({
                        data: {
                            collectorAccountId: collectorAccount.id,
                            transactionType: 'credit',
                            amount: creditAmount,
                            balanceAfter: collectorNewBalance,
                            description: description || `Credit from admin`,
                            referenceType: 'admin_credit',
                            referenceId: adminId,
                            createdBy: adminId,
                            createdByType: 'admin'
                        }
                    })
                }
            }
        })

        return NextResponse.json({
            success: true,
            message: 'Amount credited to collector account successfully'
        })
    } catch (error: any) {
        console.error('Collector Account Credit Error:', error)
        return NextResponse.json({
            error: error.message || 'Failed to credit collector account'
        }, { status: 500 })
    }
}
