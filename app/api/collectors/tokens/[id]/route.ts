import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET /api/collectors/tokens/[id] - Get token details
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || session.user.userType !== 'collector') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // session.user.id is already the collector's database ID
        const collectorId = parseInt(session.user.id)

        const { id } = await params
        const tokenId = parseInt(id)

        // Get token with all details
        const token = await prisma.token.findFirst({
            where: {
                id: tokenId,
                collectorId,
            },
            include: {
                customer: {
                    select: {
                        name: true,
                        mobile: true,
                        address: true,
                    },
                },
                schedules: {
                    orderBy: {
                        scheduleDate: 'asc',
                    },
                },
                payments: {
                    orderBy: {
                        paymentDate: 'desc',
                    },
                },
            },
        })

        if (!token) {
            return NextResponse.json({ error: 'Token not found or not assigned to you' }, { status: 404 })
        }

        // Calculate paid amount
        const paidAmount = token.payments.reduce((sum, p) => sum + Number(p.amount), 0)

        // Format the response
        const tokenFormatted = {
            id: token.id,
            tokenNo: token.tokenNo,
            totalAmount: Number(token.totalAmount),
            paidAmount: paidAmount,
            dailyInstallment: Number(token.dailyInstallment),
            duration: token.durationDays,
            status: token.status,
            startDate: token.startDate,
            endDate: token.endDate,
            customer: token.customer,
            schedules: token.schedules.map((schedule) => ({
                id: schedule.id,
                scheduleDate: schedule.scheduleDate,
                totalDue: Number(schedule.totalDue),
                paidAmount: Number(schedule.paidAmount),
                status: schedule.status,
                lastPaymentDate: schedule.paymentDate,
            })),
            payments: token.payments.map((payment) => ({
                id: payment.id,
                amount: Number(payment.amount),
                paymentMode: payment.paymentMode,
                paymentDate: payment.paymentDate,
                remarks: payment.remarks || '',
            })),
        }

        return NextResponse.json({
            success: true,
            data: tokenFormatted,
        })
    } catch (error) {
        console.error('Token Details Error:', error)
        return NextResponse.json({ error: 'Failed to fetch token details' }, { status: 500 })
    }
}