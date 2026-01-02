import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import bcrypt from 'bcrypt'

// POST /api/settings/change-password - Change password
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { currentPassword, newPassword, confirmPassword } = body

        // Validation
        if (!currentPassword || !newPassword || !confirmPassword) {
            return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
        }

        if (newPassword !== confirmPassword) {
            return NextResponse.json({ error: 'New passwords do not match' }, { status: 400 })
        }

        if (newPassword.length < 8) {
            return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
        }

        if (session.user.userType === 'admin') {
            const admin = await prisma.adminUser.findUnique({
                where: { id: parseInt(session.user.id) },
            })

            if (!admin) {
                return NextResponse.json({ error: 'User not found' }, { status: 404 })
            }

            // Verify current password
            const isValid = await bcrypt.compare(currentPassword, admin.passwordHash)
            if (!isValid) {
                return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
            }

            // Hash new password
            const hashedPassword = await bcrypt.hash(newPassword, 10)

            // Update password
            await prisma.adminUser.update({
                where: { id: parseInt(session.user.id) },
                data: { passwordHash: hashedPassword },
            })
        } else {
            const collector = await prisma.collector.findUnique({
                where: { id: parseInt(session.user.id) },
            })

            if (!collector) {
                return NextResponse.json({ error: 'User not found' }, { status: 404 })
            }

            // Verify current password
            const isValid = await bcrypt.compare(currentPassword, collector.passwordHash)
            if (!isValid) {
                return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
            }

            // Hash new password
            const hashedPassword = await bcrypt.hash(newPassword, 10)

            // Update password
            await prisma.collector.update({
                where: { id: parseInt(session.user.id) },
                data: { passwordHash: hashedPassword },
            })
        }

        return NextResponse.json({
            success: true,
            message: 'Password changed successfully',
        })
    } catch (error) {
        console.error('Change Password Error:', error)
        return NextResponse.json({ error: 'Failed to change password' }, { status: 500 })
    }
}