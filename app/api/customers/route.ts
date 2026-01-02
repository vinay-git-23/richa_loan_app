import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET /api/customers - List all customers with filters
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.userType !== 'admin' && session.user.role !== 'director')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''
    const isActive = searchParams.get('isActive')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')

    // Build where clause
    const where: any = {}

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { mobile: { contains: search } },
        { aadhaar: { contains: search } },
      ]
    }

    if (isActive !== null && isActive !== undefined && isActive !== '') {
      where.isActive = isActive === 'true'
    }

    // Get total count
    const totalCount = await prisma.customer.count({ where })

    // Get customers with pagination
    const customers = await prisma.customer.findMany({
      where,
      include: {
        tokens: {
          select: {
            id: true,
            status: true,
            totalAmount: true,
          },
        },
        _count: {
          select: {
            tokens: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    })

    // Calculate active tokens count for each customer
    const customersWithStats = customers.map((customer) => ({
      ...customer,
      activeTokensCount: customer.tokens.filter((t) => t.status === 'active').length,
      totalBorrowed: customer.tokens.reduce((sum, t) => sum + Number(t.totalAmount), 0),
    }))

    return NextResponse.json({
      success: true,
      data: customersWithStats,
      pagination: {
        page,
        pageSize,
        totalPages: Math.ceil(totalCount / pageSize),
        totalRecords: totalCount,
      },
    })
  } catch (error) {
    console.error('Customers GET Error:', error)
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 })
  }
}

// POST /api/customers - Create new customer
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.userType !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, mobile, address, aadhaar, photoUrl } = body

    // Validation
    if (!name || !mobile) {
      return NextResponse.json({ error: 'Name and mobile are required' }, { status: 400 })
    }

    // Check if mobile already exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { mobile },
    })

    if (existingCustomer) {
      return NextResponse.json({ error: 'Customer with this mobile already exists' }, { status: 400 })
    }

    // Validate mobile (10 digits)
    if (!/^\d{10}$/.test(mobile)) {
      return NextResponse.json({ error: 'Mobile must be 10 digits' }, { status: 400 })
    }

    // Validate aadhaar if provided (12 digits)
    if (aadhaar && !/^\d{12}$/.test(aadhaar)) {
      return NextResponse.json({ error: 'Aadhaar must be 12 digits' }, { status: 400 })
    }

    // Create customer
    const customer = await prisma.customer.create({
      data: {
        name,
        mobile,
        address: address || null,
        aadhaar: aadhaar || null,
        photoUrl: photoUrl || null,
        isActive: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: customer,
      message: 'Customer created successfully',
    })
  } catch (error) {
    console.error('Customer POST Error:', error)
    return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 })
  }
}