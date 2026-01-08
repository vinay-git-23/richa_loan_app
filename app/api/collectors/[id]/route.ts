import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import bcrypt from 'bcrypt'

// GET /api/collectors/[id] - Get collector details
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.userType !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const collectorId = parseInt(id)

    const collector = await prisma.collector.findUnique({
      where: { id: collectorId },
      select: {
        id: true,
        name: true,
        collectorId: true,
        mobile: true,
        email: true,
        plainPassword: true,
        isActive: true,
        createdAt: true,
        lastLogin: true,
      },
    })

    if (!collector) {
      return NextResponse.json({ error: 'Collector not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: collector,
    })
  } catch (error) {
    console.error('Collector GET Error:', error)
    return NextResponse.json({ error: 'Failed to fetch collector details' }, { status: 500 })
  }
}

// PUT /api/collectors/[id] - Update collector
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.userType !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const collectorId = parseInt(id)
    const body = await req.json()
    const { name, mobile, isActive } = body

    // Get existing collector
    const existing = await prisma.collector.findUnique({
      where: { id: collectorId },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Collector not found' }, { status: 404 })
    }

    // Prepare update data
    const updateData: any = {}

    if (name !== undefined) updateData.name = name
    if (isActive !== undefined) updateData.isActive = isActive

    // Check mobile if provided and different
    if (mobile !== undefined && mobile !== existing.mobile) {
      if (mobile.length !== 10 || !/^\d+$/.test(mobile)) {
        return NextResponse.json({ error: 'Mobile must be exactly 10 digits' }, { status: 400 })
      }

      // Check if mobile already exists for another collector
      const existingByMobile = await prisma.collector.findUnique({
        where: { mobile },
      })

      if (existingByMobile && existingByMobile.id !== collectorId) {
        return NextResponse.json({ error: 'Mobile number already exists' }, { status: 400 })
      }

      updateData.mobile = mobile
    }

    // Update collector
    const collector = await prisma.collector.update({
      where: { id: collectorId },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      data: collector,
      message: 'Collector updated successfully',
    })
  } catch (error) {
    console.error('Collector PUT Error:', error)
    return NextResponse.json({ error: 'Failed to update collector' }, { status: 500 })
  }
}

// PATCH /api/collectors/[id]/reset-password - Reset collector password
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.userType !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const collectorId = parseInt(id)

    // Get existing collector
    const collector = await prisma.collector.findUnique({
      where: { id: collectorId },
    })

    if (!collector) {
      return NextResponse.json({ error: 'Collector not found' }, { status: 404 })
    }

    // Generate random secure password (8 characters: uppercase, lowercase, numbers)
    const generateRandomPassword = (length: number = 8): string => {
      const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
      const lowercase = 'abcdefghijklmnopqrstuvwxyz'
      const numbers = '0123456789'
      const allChars = uppercase + lowercase + numbers
      
      let password = ''
      // Ensure at least one character from each type
      password += uppercase[Math.floor(Math.random() * uppercase.length)]
      password += lowercase[Math.floor(Math.random() * lowercase.length)]
      password += numbers[Math.floor(Math.random() * numbers.length)]
      
      // Fill the rest randomly
      for (let i = password.length; i < length; i++) {
        password += allChars[Math.floor(Math.random() * allChars.length)]
      }
      
      // Shuffle the password
      return password.split('').sort(() => Math.random() - 0.5).join('')
    }

    const generatedPassword = generateRandomPassword(8)
    const hashedPassword = await bcrypt.hash(generatedPassword, 10)

    // Update collector password
    const updatedCollector = await prisma.collector.update({
      where: { id: collectorId },
      data: {
        passwordHash: hashedPassword,
        plainPassword: generatedPassword,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        ...updatedCollector,
        generatedPassword, // Return password in response
      },
      message: 'Password reset successfully',
    })
  } catch (error) {
    console.error('Collector Password Reset Error:', error)
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 })
  }
}

// DELETE /api/collectors/[id] - Delete collector (soft delete)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.userType !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const collectorId = parseInt(id)

    // Check if collector has active tokens
    const activeTokens = await prisma.token.count({
      where: {
        collectorId,
        status: 'active',
      },
    })

    if (activeTokens > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete collector with ${activeTokens} active token(s). Please reassign or close tokens first.`,
        },
        { status: 400 }
      )
    }

    // Soft delete by setting isActive to false
    const collector = await prisma.collector.update({
      where: { id: collectorId },
      data: { isActive: false },
    })

    return NextResponse.json({
      success: true,
      data: collector,
      message: 'Collector deactivated successfully',
    })
  } catch (error) {
    console.error('Collector DELETE Error:', error)
    return NextResponse.json({ error: 'Failed to delete collector' }, { status: 500 })
  }
}