import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { startOfDay, endOfDay } from 'date-fns'

// GET /api/collectors/due-list - Get today's and overdue schedules for collector
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || session.user.userType !== 'collector') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const collectorId = parseInt(session.user.id)
        const today = startOfDay(new Date())

        // Fetch all pending/partial/overdue schedules for tokens assigned to this collector
        const schedules = await prisma.repaymentSchedule.findMany({
            where: {
                token: {
                    collectorId: collectorId,
                    status: { in: ['active', 'overdue'] }
                },
                status: { in: ['pending', 'partial', 'overdue'] },
                scheduleDate: {
                    lte: endOfDay(new Date()) // Today or past
                }
            },
            include: {
                token: {
                    include: {
                        customer: {
                            select: {
                                name: true,
                                mobile: true,
                                address: true
                            }
                        }
                    }
                }
            },
            orderBy: [
                { scheduleDate: 'asc' }, // Oldest first (overdue)
                { token: { tokenNo: 'asc' } }
            ]
        })

        const formattedSchedules = schedules.map(s => ({
            id: s.id,
            tokenId: s.tokenId,
            tokenNo: s.token.tokenNo,
            customerName: s.token.customer.name,
            customerMobile: s.token.customer.mobile,
            customerAddress: s.token.customer.address,
            scheduleDate: s.scheduleDate,
            amountDue: Number(s.totalDue) - Number(s.paidAmount),
            installmentAmount: Number(s.installmentAmount),
            penaltyAmount: Number(s.penaltyAmount),
            status: s.status,
            isOverdue: new Date(s.scheduleDate) < today
        }))

        return NextResponse.json({
            success: true,
            data: formattedSchedules,
            summary: {
                totalCount: formattedSchedules.length,
                totalAmount: formattedSchedules.reduce((sum, s) => sum + s.amountDue, 0),
                overdueCount: formattedSchedules.filter(s => s.isOverdue).length
            }
        })
    } catch (error) {
        console.error('Due List API Error:', error)
        return NextResponse.json({ error: 'Failed to fetch due list' }, { status: 500 })
    }
}
