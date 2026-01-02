import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET /api/tokens/[id] - Get single token with details
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || (session.user.userType !== 'admin' && session.user.role !== 'director')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // FIXED: Await params in Next.js 15
        const { id } = await params
        const tokenId = parseInt(id)

        const token = await prisma.token.findUnique({
            where: { id: tokenId },
            include: {
                customer: {
                    select: {
                        id: true,
                        name: true,
                        mobile: true,
                        address: true,
                    },
                },
                collector: {
                    select: {
                        id: true,
                        name: true,
                        collectorId: true,
                    },
                },
                schedules: {
                    orderBy: { scheduleDate: 'asc' },
                },
                payments: {
                    include: {
                        collector: {
                            select: {
                                name: true,
                            },
                        },
                    },
                    orderBy: { paymentDate: 'desc' },
                },
            },
        })

        if (!token) {
            return NextResponse.json({ error: 'Token not found' }, { status: 404 })
        }

        // Calculate stats
        const totalPaid = token.payments.reduce((sum, p) => sum + Number(p.amount), 0)
        const outstanding = Number(token.totalAmount) - totalPaid
        const paidSchedules = token.schedules.filter((s) => s.status === 'paid').length
        const overdueSchedules = token.schedules.filter((s) => s.status === 'overdue').length
        const pendingSchedules = token.schedules.filter((s) => s.status === 'pending').length

        return NextResponse.json({
            success: true,
            data: {
                ...token,
                stats: {
                    totalPaid,
                    outstanding,
                    paidSchedules,
                    overdueSchedules,
                    pendingSchedules,
                    totalSchedules: token.schedules.length,
                },
            },
        })
    } catch (error) {
        console.error('Token Detail GET Error:', error)
        return NextResponse.json({ error: 'Failed to fetch token details' }, { status: 500 })
    }
}

// PUT /api/tokens/[id] - Update token (including status changes)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || session.user.userType !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params
        const tokenId = parseInt(id)
        const body = await req.json()

        // Check if token exists
        const existingToken = await prisma.token.findUnique({
            where: { id: tokenId },
            include: {
                schedules: true,
                payments: true
            }
        })

        if (!existingToken) {
            return NextResponse.json({ error: 'Token not found' }, { status: 404 })
        }

        // Handle status change
        if (body.status) {
            const newStatus = body.status

            // Validate status
            if (!['active', 'closed', 'overdue', 'cancelled'].includes(newStatus)) {
                return NextResponse.json({ error: 'Invalid status value' }, { status: 400 })
            }

            // Special validation for closing token
            if (newStatus === 'closed') {
                const totalPaid = existingToken.payments.reduce((sum, p) => sum + Number(p.amount), 0)
                const totalAmount = Number(existingToken.totalAmount)

                if (totalPaid < totalAmount) {
                    return NextResponse.json({
                        error: `Cannot close token. Outstanding amount: ₹${(totalAmount - totalPaid).toFixed(2)}`
                    }, { status: 400 })
                }
            }

            // Update token status
            const updatedToken = await prisma.token.update({
                where: { id: tokenId },
                data: { status: newStatus },
                include: {
                    customer: true,
                    collector: true
                }
            })

            return NextResponse.json({
                success: true,
                data: updatedToken,
                message: `Token status updated to ${newStatus}`
            })
        }

        // Handle other updates (collector reassignment, etc.)
        const updateData: any = {}

        if (body.collectorId) {
            updateData.collectorId = parseInt(body.collectorId)
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
        }

        const updatedToken = await prisma.token.update({
            where: { id: tokenId },
            data: updateData,
            include: {
                customer: true,
                collector: true
            }
        })

        return NextResponse.json({
            success: true,
            data: updatedToken,
            message: 'Token updated successfully'
        })

    } catch (error) {
        console.error('Token PUT Error:', error)
        return NextResponse.json({ error: 'Failed to update token' }, { status: 500 })
    }
}