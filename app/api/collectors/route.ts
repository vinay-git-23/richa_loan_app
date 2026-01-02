import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import bcrypt from 'bcrypt'

// GET /api/collectors - List all collectors with stats
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
        { collectorId: { contains: search } },
        { mobile: { contains: search } },
      ]
    }

    if (isActive !== null && isActive !== 'all') {
      where.isActive = isActive === 'true'
    }

    // Get total count
    const totalCount = await prisma.collector.count({ where })

    // Get collectors
    const collectors = await prisma.collector.findMany({
      where,
      include: {
        tokens: {
          where: { status: 'active' },
          select: { id: true },
        },
        payments: {
          select: { amount: true },
        },
      },
      orderBy: { name: 'asc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    })

    // Add stats
    const collectorsWithStats = collectors.map((collector) => ({
      ...collector,
      activeTokens: collector.tokens.length,
      totalCollected: collector.payments.reduce((sum, p) => sum + Number(p.amount), 0),
      tokens: undefined, // Remove tokens array
      payments: undefined, // Remove payments array
    }))

    return NextResponse.json({
      success: true,
      data: collectorsWithStats,
      pagination: {
        page,
        pageSize,
        totalPages: Math.ceil(totalCount / pageSize),
        totalRecords: totalCount,
      },
    })
  } catch (error) {
    console.error('Collectors GET Error:', error)
    return NextResponse.json({ error: 'Failed to fetch collectors' }, { status: 500 })
  }
}

// POST /api/collectors - Create new collector
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.userType !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, collectorId, mobile } = body

    // Validation
    if (!name || !collectorId || !mobile) {
      return NextResponse.json({ error: 'Name, Collector ID, and Mobile are required' }, { status: 400 })
    }

    if (mobile.length !== 10 || !/^\d+$/.test(mobile)) {
      return NextResponse.json({ error: 'Mobile must be exactly 10 digits' }, { status: 400 })
    }

    // Check if collectorId already exists
    const existingById = await prisma.collector.findUnique({
      where: { collectorId },
    })

    if (existingById) {
      return NextResponse.json({ error: 'Collector ID already exists' }, { status: 400 })
    }

    // Check if mobile already exists
    const existingByMobile = await prisma.collector.findUnique({
      where: { mobile },
    })

    if (existingByMobile) {
      return NextResponse.json({ error: 'Mobile number already exists' }, { status: 400 })
    }

    // Hash default password (same as collector ID or mobile)
    const hashedPassword = await bcrypt.hash('Collector@123', 10)

    // Create collector
    const collector = await prisma.collector.create({
      data: {
        name,
        collectorId,
        mobile,
        passwordHash: hashedPassword,
        isActive: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: collector,
      message: 'Collector created successfully',
    })
  } catch (error) {
    console.error('Collector POST Error:', error)
    return NextResponse.json({ error: 'Failed to create collector' }, { status: 500 })
  }
}