import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET /api/customer-assignments - Get all assignments with filters
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.userType !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const customerId = searchParams.get('customerId')
    const collectorId = searchParams.get('collectorId')
    const isActive = searchParams.get('isActive')

    const where: any = {}

    if (customerId) {
      where.customerId = parseInt(customerId)
    }

    if (collectorId) {
      where.collectorId = parseInt(collectorId)
    }

    if (isActive !== null && isActive !== undefined && isActive !== '') {
      where.isActive = isActive === 'true'
    }

    const assignments = await prisma.customerCollectorAssignment.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            mobile: true,
            address: true,
            isActive: true,
          }
        },
        collector: {
          select: {
            id: true,
            name: true,
            collectorId: true,
            mobile: true,
            isActive: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      data: assignments,
    })
  } catch (error) {
    console.error('Customer Assignments GET Error:', error)
    return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 })
  }
}

// POST /api/customer-assignments - Create new assignment
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.userType !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { customerId, collectorId } = body

    // Validation
    if (!customerId || !collectorId) {
      return NextResponse.json({ error: 'Customer ID and Collector ID are required' }, { status: 400 })
    }

    // Verify customer exists and is active
    const customer = await prisma.customer.findUnique({
      where: { id: parseInt(customerId) }
    })

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    if (!customer.isActive) {
      return NextResponse.json({ error: 'Cannot assign inactive customer' }, { status: 400 })
    }

    // Verify collector exists and is active
    const collector = await prisma.collector.findUnique({
      where: { id: parseInt(collectorId) }
    })

    if (!collector) {
      return NextResponse.json({ error: 'Collector not found' }, { status: 404 })
    }

    if (!collector.isActive) {
      return NextResponse.json({ error: 'Cannot assign to inactive collector' }, { status: 400 })
    }

    // Check if assignment already exists
    const existingAssignment = await prisma.customerCollectorAssignment.findFirst({
      where: {
        customerId: parseInt(customerId),
        collectorId: parseInt(collectorId),
      }
    })

    if (existingAssignment) {
      // If exists but inactive, reactivate it
      if (!existingAssignment.isActive) {
        const reactivated = await prisma.customerCollectorAssignment.update({
          where: { id: existingAssignment.id },
          data: {
            isActive: true,
            assignedDate: new Date()
          },
          include: {
            customer: true,
            collector: true
          }
        })
        return NextResponse.json({
          success: true,
          data: reactivated,
          message: 'Assignment reactivated successfully'
        })
      }

      return NextResponse.json({ error: 'Assignment already exists and is active' }, { status: 400 })
    }

    // Create new assignment
    const assignment = await prisma.customerCollectorAssignment.create({
      data: {
        customerId: parseInt(customerId),
        collectorId: parseInt(collectorId),
        assignedDate: new Date(),
        isActive: true
      },
      include: {
        customer: true,
        collector: true
      }
    })

    return NextResponse.json({
      success: true,
      data: assignment,
      message: 'Customer assigned successfully'
    })

  } catch (error) {
    console.error('Customer Assignment POST Error:', error)
    return NextResponse.json({ error: 'Failed to create assignment' }, { status: 500 })
  }
}
