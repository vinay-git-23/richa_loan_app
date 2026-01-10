import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { startOfDay, endOfDay, subDays } from 'date-fns'

// GET /api/collectors/history - Get payment history for the collector
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || session.user.userType !== 'collector') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const collectorId = parseInt(session.user.id)
        const { searchParams } = new URL(req.url)

        // Filtering options
        const dateRange = searchParams.get('range') || 'today' // today, yesterday, week, all
        let startDate: Date | undefined
        let endDate: Date | undefined = endOfDay(new Date())

        if (dateRange === 'today') {
            startDate = startOfDay(new Date())
        } else if (dateRange === 'yesterday') {
            startDate = startOfDay(subDays(new Date(), 1))
            endDate = endOfDay(subDays(new Date(), 1))
        } else if (dateRange === 'week') {
            startDate = startOfDay(subDays(new Date(), 7))
        }

        // Get payments
        const payments = await prisma.payment.findMany({
            where: {
                collectorId,
                ...(startDate && {
                    paymentDate: {
                        gte: startDate,
                        lte: endDate,
                    }
                })
            },
            include: {
                token: {
                    select: {
                        tokenNo: true,
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
                paymentDate: 'desc'
            }
        })

        // Format for frontend
        const history = payments
            .filter(p => p.token && p.token.customer) // Filter out payments without token or customer
            .map(p => ({
                id: p.id,
                amount: Number(p.amount),
                paymentDate: p.paymentDate,
                paymentMode: p.paymentMode,
                remarks: p.remarks,
                tokenNo: p.token!.tokenNo,
                customerName: p.token!.customer.name,
                customerMobile: p.token!.customer.mobile
            }))

        return NextResponse.json({
            success: true,
            data: history
        })
    } catch (error) {
        console.error('Collector History Error:', error)
        return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 })
    }
}
