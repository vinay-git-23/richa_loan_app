import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// PUT /api/customers/[id] - Update customer
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || session.user.userType !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params
        const customerId = parseInt(id)
        const body = await req.json()
        const { name, mobile, aadhaar, address, isActive } = body

        // Get existing customer
        const existing = await prisma.customer.findUnique({
            where: { id: customerId },
        })

        if (!existing) {
            return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
        }

        // Prepare update data
        const updateData: any = {}

        if (name !== undefined) updateData.name = name
        if (aadhaar !== undefined) updateData.aadhaar = aadhaar || null
        if (address !== undefined) updateData.address = address || null
        if (isActive !== undefined) updateData.isActive = isActive

        // Check mobile if provided and different
        if (mobile !== undefined && mobile !== existing.mobile) {
            if (mobile.length !== 10 || !/^\d+$/.test(mobile)) {
                return NextResponse.json({ error: 'Mobile must be exactly 10 digits' }, { status: 400 })
            }

            // Check if mobile already exists for another customer
            const existingByMobile = await prisma.customer.findUnique({
                where: { mobile },
            })

            if (existingByMobile && existingByMobile.id !== customerId) {
                return NextResponse.json({ error: 'Mobile number already exists' }, { status: 400 })
            }

            updateData.mobile = mobile
        }

        // Check aadhaar if provided
        if (aadhaar && aadhaar !== existing.aadhaar) {
            if (aadhaar.length !== 12 || !/^\d+$/.test(aadhaar)) {
                return NextResponse.json({ error: 'Aadhaar must be exactly 12 digits' }, { status: 400 })
            }

            // Check if aadhaar already exists for another customer
            const existingByAadhaar = await prisma.customer.findUnique({
                where: { aadhaar },
            })

            if (existingByAadhaar && existingByAadhaar.id !== customerId) {
                return NextResponse.json({ error: 'Aadhaar number already exists' }, { status: 400 })
            }
        }

        // Update customer
        const customer = await prisma.customer.update({
            where: { id: customerId },
            data: updateData,
        })

        return NextResponse.json({
            success: true,
            data: customer,
            message: 'Customer updated successfully',
        })
    } catch (error) {
        console.error('Customer PUT Error:', error)
        return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 })
    }
}

// DELETE /api/customers/[id] - Delete customer (soft delete)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || session.user.userType !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params
        const customerId = parseInt(id)

        // Check if customer has active tokens
        const activeTokens = await prisma.token.count({
            where: {
                customerId,
                status: 'active',
            },
        })

        if (activeTokens > 0) {
            return NextResponse.json(
                {
                    error: `Cannot delete customer with ${activeTokens} active token(s). Please close tokens first.`,
                },
                { status: 400 }
            )
        }

        // Soft delete by setting isActive to false
        const customer = await prisma.customer.update({
            where: { id: customerId },
            data: { isActive: false },
        })

        return NextResponse.json({
            success: true,
            data: customer,
            message: 'Customer deactivated successfully',
        })
    } catch (error) {
        console.error('Customer DELETE Error:', error)
        return NextResponse.json({ error: 'Failed to delete customer' }, { status: 500 })
    }
}