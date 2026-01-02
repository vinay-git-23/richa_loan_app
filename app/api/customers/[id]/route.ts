import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET /api/customers/[id] - Get single customer with full history
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.userType !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const customerId = parseInt(id)

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        tokens: {
          include: {
            payments: {
              select: {
                amount: true,
              }
            },
            schedules: {
              select: {
                status: true,
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: customer,
    })
  } catch (error) {
    console.error('Customer Detail GET Error:', error)
    return NextResponse.json({ error: 'Failed to fetch customer details' }, { status: 500 })
  }
}

// PUT /api/customers/[id] - Update customer
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.userType !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const customerId = parseInt(id)
    const body = await req.json()

    // Check if customer exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { id: customerId }
    })

    if (!existingCustomer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    // Update customer
    const updateData: any = {}

    if (body.name) updateData.name = body.name
    if (body.mobile) updateData.mobile = body.mobile
    if (body.address !== undefined) updateData.address = body.address
    if (body.aadhaar !== undefined) updateData.aadhaar = body.aadhaar
    if (body.photoUrl !== undefined) updateData.photoUrl = body.photoUrl
    if (body.isActive !== undefined) updateData.isActive = body.isActive

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const updatedCustomer = await prisma.customer.update({
      where: { id: customerId },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      data: updatedCustomer,
      message: 'Customer updated successfully'
    })

  } catch (error) {
    console.error('Customer PUT Error:', error)
    return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 })
  }
}

// DELETE /api/customers/[id] - Delete customer (soft delete by setting inactive)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.userType !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const customerId = parseInt(id)

    // Check if customer exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        tokens: {
          where: {
            status: {
              in: ['active', 'overdue']
            }
          }
        }
      }
    })

    if (!existingCustomer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    // Check if customer has active tokens
    if (existingCustomer.tokens.length > 0) {
      return NextResponse.json({
        error: 'Cannot delete customer with active tokens'
      }, { status: 400 })
    }

    // Soft delete by setting inactive
    await prisma.customer.update({
      where: { id: customerId },
      data: { isActive: false }
    })

    return NextResponse.json({
      success: true,
      message: 'Customer deactivated successfully'
    })

  } catch (error) {
    console.error('Customer DELETE Error:', error)
    return NextResponse.json({ error: 'Failed to delete customer' }, { status: 500 })
  }
}
