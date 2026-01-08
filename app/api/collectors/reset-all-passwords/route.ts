import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import bcrypt from 'bcrypt'

// POST /api/collectors/reset-all-passwords - Generate passwords for all collectors without passwords
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.userType !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Generate random secure password function
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

    // Get all collectors without passwords
    const collectorsWithoutPasswords = await prisma.collector.findMany({
      where: {
        OR: [
          { plainPassword: null },
          { plainPassword: '' },
        ],
      },
      select: {
        id: true,
        name: true,
        collectorId: true,
      },
    })

    if (collectorsWithoutPasswords.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All collectors already have passwords',
        data: {
          updated: 0,
          collectors: [],
        },
      })
    }

    // Generate and update passwords for each collector
    const updatedCollectors = []
    for (const collector of collectorsWithoutPasswords) {
      const generatedPassword = generateRandomPassword(8)
      const hashedPassword = await bcrypt.hash(generatedPassword, 10)

      await prisma.collector.update({
        where: { id: collector.id },
        data: {
          passwordHash: hashedPassword,
          plainPassword: generatedPassword,
        },
      })

      updatedCollectors.push({
        id: collector.id,
        name: collector.name,
        collectorId: collector.collectorId,
        generatedPassword,
      })
    }

    return NextResponse.json({
      success: true,
      message: `Passwords generated for ${updatedCollectors.length} collector(s)`,
      data: {
        updated: updatedCollectors.length,
        collectors: updatedCollectors,
      },
    })
  } catch (error) {
    console.error('Reset All Passwords Error:', error)
    return NextResponse.json({ error: 'Failed to reset passwords' }, { status: 500 })
  }
}

