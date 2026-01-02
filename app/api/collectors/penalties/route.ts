import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET /api/collectors/penalties - Get tokens with unpaid penalties for collector
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || session.user.userType !== 'collector') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const collectorId = parseInt(session.user.id)

        // Find schedules with penalties that are not yet fully paid
        const schedulesWithPenalties = await prisma.repaymentSchedule.findMany({
            where: {
                token: {
                    collectorId: collectorId
                },
                penaltyAmount: {
                    gt: 0
                }
                // We show all penalties, even if the primary amount is paid, 
                // if they are part of pending/partial/overdue schedules
                // status: { in: ['pending', 'partial', 'overdue'] }
            },
            include: {
                token: {
                    include: {
                        customer: {
                            select: {
                                name: true,
                                mobile: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                scheduleDate: 'desc'
            }
        })

        const formattedPenalties = schedulesWithPenalties.map(s => ({
            id: s.id,
            tokenId: s.tokenId,
            tokenNo: s.token.tokenNo,
            customerName: s.token.customer.name,
            customerMobile: s.token.customer.mobile,
            scheduleDate: s.scheduleDate,
            penaltyAmount: Number(s.penaltyAmount),
            totalDue: Number(s.totalDue) - Number(s.paidAmount),
            status: s.status
        }))

        return NextResponse.json({
            success: true,
            data: formattedPenalties,
            totalPenalty: formattedPenalties.reduce((sum, p) => sum + p.penaltyAmount, 0)
        })
    } catch (error) {
        console.error('Penalties API Error:', error)
        return NextResponse.json({ error: 'Failed to fetch penalties' }, { status: 500 })
    }
}
