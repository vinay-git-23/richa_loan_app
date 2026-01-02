import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET /api/penalty-config - List all penalty configurations
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.userType !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const configs = await prisma.penaltyConfig.findMany({
      orderBy: [
        { isActive: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json({
      success: true,
      data: configs,
    })
  } catch (error) {
    console.error('Penalty Config GET Error:', error)
    return NextResponse.json({ error: 'Failed to fetch penalty configurations' }, { status: 500 })
  }
}

// POST /api/penalty-config - Create new penalty configuration
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.userType !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { penaltyType, penaltyValue, graceDays, applyToLoanType, isActive } = body

    // Validation
    if (!penaltyType || penaltyValue === undefined || graceDays === undefined) {
      return NextResponse.json({ error: 'Penalty type, value, and grace days are required' }, { status: 400 })
    }

    if (!['fixed', 'percent'].includes(penaltyType)) {
      return NextResponse.json({ error: 'Invalid penalty type' }, { status: 400 })
    }

    if (penaltyValue < 0) {
      return NextResponse.json({ error: 'Penalty value cannot be negative' }, { status: 400 })
    }

    if (graceDays < 0) {
      return NextResponse.json({ error: 'Grace days cannot be negative' }, { status: 400 })
    }

    // If setting as active, deactivate all other configs
    if (isActive) {
      await prisma.penaltyConfig.updateMany({
        where: { isActive: true },
        data: { isActive: false }
      })
    }

    // Create penalty configuration
    const config = await prisma.penaltyConfig.create({
      data: {
        penaltyType,
        penaltyValue,
        graceDays,
        applyToLoanType: applyToLoanType || null,
        isActive: isActive ?? true,
      },
    })

    return NextResponse.json({
      success: true,
      data: config,
      message: 'Penalty configuration created successfully',
    })
  } catch (error) {
    console.error('Penalty Config POST Error:', error)
    return NextResponse.json({ error: 'Failed to create penalty configuration' }, { status: 500 })
  }
}
