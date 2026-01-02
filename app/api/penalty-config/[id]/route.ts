import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// PUT /api/penalty-config/[id] - Update penalty configuration
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.userType !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: idParam } = await params
    const id = parseInt(idParam)
    const body = await req.json()

    // Check if config exists
    const existingConfig = await prisma.penaltyConfig.findUnique({
      where: { id },
    })

    if (!existingConfig) {
      return NextResponse.json({ error: 'Configuration not found' }, { status: 404 })
    }

    // If setting as active, deactivate all other configs
    if (body.isActive === true) {
      await prisma.penaltyConfig.updateMany({
        where: {
          isActive: true,
          id: { not: id }
        },
        data: { isActive: false }
      })
    }

    // Update configuration
    const updatedConfig = await prisma.penaltyConfig.update({
      where: { id },
      data: {
        ...(body.penaltyType && { penaltyType: body.penaltyType }),
        ...(body.penaltyValue !== undefined && { penaltyValue: body.penaltyValue }),
        ...(body.graceDays !== undefined && { graceDays: body.graceDays }),
        ...(body.applyToLoanType !== undefined && { applyToLoanType: body.applyToLoanType || null }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
      },
    })

    return NextResponse.json({
      success: true,
      data: updatedConfig,
      message: 'Configuration updated successfully',
    })
  } catch (error) {
    console.error('Penalty Config PUT Error:', error)
    return NextResponse.json({ error: 'Failed to update configuration' }, { status: 500 })
  }
}

// DELETE /api/penalty-config/[id] - Delete penalty configuration
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.userType !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: idParam } = await params
    const id = parseInt(idParam)

    // Check if config exists
    const existingConfig = await prisma.penaltyConfig.findUnique({
      where: { id },
    })

    if (!existingConfig) {
      return NextResponse.json({ error: 'Configuration not found' }, { status: 404 })
    }

    // Delete configuration
    await prisma.penaltyConfig.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Configuration deleted successfully',
    })
  } catch (error) {
    console.error('Penalty Config DELETE Error:', error)
    return NextResponse.json({ error: 'Failed to delete configuration' }, { status: 500 })
  }
}
