import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET /api/settings - Get user settings
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.userType === 'admin') {
      const admin = await prisma.adminUser.findUnique({
        where: { id: parseInt(session.user.id) },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          lastLogin: true,
          createdAt: true,
        },
      })

      return NextResponse.json({
        success: true,
        data: {
          ...admin,
          userType: 'admin',
        },
      })
    } else {
      const collector = await prisma.collector.findUnique({
        where: { id: parseInt(session.user.id) },
        select: {
          id: true,
          name: true,
          mobile: true,
          collectorId: true,
          plainPassword: true, // Include password for display
          lastLogin: true,
          createdAt: true,
        },
      })

      return NextResponse.json({
        success: true,
        data: {
          ...collector,
          userType: 'collector',
        },
      })
    }
  } catch (error) {
    console.error('Settings GET Error:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

// PUT /api/settings - Update profile
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, mobile } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    if (session.user.userType === 'admin') {
      const admin = await prisma.adminUser.update({
        where: { id: parseInt(session.user.id) },
        data: { username: name },
      })

      return NextResponse.json({
        success: true,
        data: admin,
        message: 'Profile updated successfully',
      })
    } else {
      const updateData: any = { name }

      if (mobile) {
        if (mobile.length !== 10 || !/^\d+$/.test(mobile)) {
          return NextResponse.json({ error: 'Mobile must be exactly 10 digits' }, { status: 400 })
        }

        // Check if mobile already exists for another collector
        const existingByMobile = await prisma.collector.findUnique({
          where: { mobile },
        })

        if (existingByMobile && existingByMobile.id !== parseInt(session.user.id)) {
          return NextResponse.json({ error: 'Mobile number already exists' }, { status: 400 })
        }

        updateData.mobile = mobile
      }

      const collector = await prisma.collector.update({
        where: { id: parseInt(session.user.id) },
        data: updateData,
      })

      return NextResponse.json({
        success: true,
        data: collector,
        message: 'Profile updated successfully',
      })
    }
  } catch (error) {
    console.error('Settings PUT Error:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}