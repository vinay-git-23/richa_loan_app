import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { startOfDay } from 'date-fns'

// GET /api/overdue-schedules - Get all overdue schedules with stats
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || session.user.userType !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const statusFilter = searchParams.get('status')

        const today = startOfDay(new Date())

        // Build where clause
        const where: any = {
            scheduleDate: { lt: today },
            status: { in: ['pending', 'partial', 'overdue'] }
        }

        if (statusFilter && statusFilter !== 'all') {
            where.status = statusFilter
        }

        // Get overdue schedules
        const schedules = await prisma.repaymentSchedule.findMany({
            where,
            include: {
                token: {
                    include: {
                        customer: {
                            select: {
                                name: true,
                                mobile: true,
                            }
                        },
                        collector: {
                            select: {
                                name: true,
                            }
                        }
                    }
                }
            },
            orderBy: [
                { scheduleDate: 'asc' },
                { token: { tokenNo: 'asc' } }
            ]
        })

        // Calculate statistics
        const totalSchedules = schedules.length
        const totalPenaltyApplied = schedules.reduce((sum, s) => sum + Number(s.penaltyAmount), 0)
        const totalOverdue = schedules.reduce((sum, s) => {
            const balance = Number(s.totalDue) - Number(s.paidAmount)
            return sum + balance
        }, 0)

        // Calculate average overdue days
        const totalOverdueDays = schedules.reduce((sum, s) => {
            const scheduleDate = new Date(s.scheduleDate)
            const diffTime = today.getTime() - scheduleDate.getTime()
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
            return sum + diffDays
        }, 0)
        const averageOverdueDays = totalSchedules > 0 ? totalOverdueDays / totalSchedules : 0

        const stats = {
            totalSchedules,
            totalPenaltyApplied,
            totalOverdue,
            averageOverdueDays
        }

        return NextResponse.json({
            success: true,
            data: schedules,
            stats
        })
    } catch (error) {
        console.error('Overdue Schedules GET Error:', error)
        return NextResponse.json({ error: 'Failed to fetch overdue schedules' }, { status: 500 })
    }
}
