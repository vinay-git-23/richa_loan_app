import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function resetDatabase() {
    try {
        console.log('🗑️  Cleaning database...')

        // Delete all records in correct order (respecting foreign key constraints)
        await prisma.systemLog.deleteMany()
        await prisma.cashDeposit.deleteMany()
        await prisma.payment.deleteMany()
        await prisma.repaymentSchedule.deleteMany()
        await prisma.token.deleteMany()
        await prisma.customerCollectorAssignment.deleteMany()
        await prisma.customer.deleteMany()
        await prisma.collector.deleteMany()
        await prisma.penaltyConfig.deleteMany()
        await prisma.adminUser.deleteMany()

        console.log('✅ All records deleted')

        // Create fresh admin
        console.log('👤 Creating admin user...')

        const adminPassword = 'Admin@123' // You can change this
        const hashedPassword = await bcrypt.hash(adminPassword, 10)

        const admin = await prisma.adminUser.create({
            data: {
                username: 'admin',
                email: 'admin@finance.com',
                passwordHash: hashedPassword,
                role: 'super_admin',
                isActive: true
            }
        })

        console.log('✅ Admin created successfully')
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log('📋 Admin Credentials:')
        console.log('   Username: admin')
        console.log('   Password: Admin@123')
        console.log('   Email: admin@finance.com')
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

        // Create default penalty configuration
        console.log('⚙️  Creating default penalty config...')

        await prisma.penaltyConfig.create({
            data: {
                penaltyType: 'percent',
                penaltyValue: 1.0, // 1% per day
                graceDays: 0,
                isActive: true
            }
        })

        console.log('✅ Default penalty config created')
        console.log('✨ Database reset complete!')

    } catch (error) {
        console.error('❌ Error resetting database:', error)
        throw error
    } finally {
        await prisma.$disconnect()
    }
}

resetDatabase()
    .then(() => {
        console.log('🎉 Done!')
        process.exit(0)
    })
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
