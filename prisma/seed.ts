import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { addDays } from 'date-fns'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // ============================================
  // 1. CLEAR EXISTING DATA (Optional - for clean slate)
  // ============================================
  console.log('🗑️  Clearing existing data...')
  
  await prisma.payment.deleteMany()
  await prisma.repaymentSchedule.deleteMany()
  await prisma.token.deleteMany()
  await prisma.customerCollectorAssignment.deleteMany()
  await prisma.cashDeposit.deleteMany()
  await prisma.systemLog.deleteMany()
  await prisma.collector.deleteMany()
  await prisma.customer.deleteMany()
  await prisma.adminUser.deleteMany()
  await prisma.penaltyConfig.deleteMany()

  console.log('✅ Existing data cleared')

  // ============================================
  // 2. CREATE ADMIN USERS
  // ============================================
  console.log('👤 Creating admin users...')

  const hashedPassword = await bcrypt.hash('Admin@123', 10)

  const superAdmin = await prisma.adminUser.create({
    data: {
      username: 'superadmin',
      email: 'admin@finance.com',
      passwordHash: hashedPassword,
      role: 'super_admin',
      isActive: true,
    },
  })

  const directorUser = await prisma.adminUser.create({
    data: {
      username: 'director',
      email: 'director@finance.com',
      passwordHash: hashedPassword,
      role: 'director',
      isActive: true,
    },
  })

  console.log('✅ Created admin users:')
  console.log('   - superadmin / Admin@123')
  console.log('   - director / Admin@123')

  // ============================================
  // 3. CREATE COLLECTORS
  // ============================================
  console.log('👥 Creating collectors...')

  const collectorPassword = await bcrypt.hash('Collector@123', 10)

  const collector1 = await prisma.collector.create({
    data: {
      name: 'Rajesh Kumar',
      mobile: '9876543210',
      email: 'rajesh@finance.com',
      passwordHash: collectorPassword,
      collectorId: 'COL-2024-0001',
      isActive: true,
    },
  })

  const collector2 = await prisma.collector.create({
    data: {
      name: 'Amit Sharma',
      mobile: '9876543211',
      email: 'amit@finance.com',
      passwordHash: collectorPassword,
      collectorId: 'COL-2024-0002',
      isActive: true,
    },
  })

  const collector3 = await prisma.collector.create({
    data: {
      name: 'Priya Singh',
      mobile: '9876543212',
      email: 'priya@finance.com',
      passwordHash: collectorPassword,
      collectorId: 'COL-2024-0003',
      isActive: true,
    },
  })

  console.log('✅ Created 3 collectors (password: Collector@123)')

  // ============================================
  // 4. CREATE CUSTOMERS
  // ============================================
  console.log('👨‍👩‍👧‍👦 Creating customers...')

  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        name: 'Suresh Patel',
        mobile: '9988776655',
        address: '123, MG Road, Delhi',
        aadhaar: '123456789012',
        isActive: true,
      },
    }),
    prisma.customer.create({
      data: {
        name: 'Ramesh Verma',
        mobile: '9988776656',
        address: '456, Gandhi Nagar, Mumbai',
        aadhaar: '234567890123',
        isActive: true,
      },
    }),
    prisma.customer.create({
      data: {
        name: 'Sunita Devi',
        mobile: '9988776657',
        address: '789, Station Road, Pune',
        aadhaar: '345678901234',
        isActive: true,
      },
    }),
    prisma.customer.create({
      data: {
        name: 'Mohan Lal',
        mobile: '9988776658',
        address: '321, Market Street, Bangalore',
        aadhaar: '456789012345',
        isActive: true,
      },
    }),
    prisma.customer.create({
      data: {
        name: 'Geeta Sharma',
        mobile: '9988776659',
        address: '654, Park Avenue, Chennai',
        aadhaar: '567890123456',
        isActive: true,
      },
    }),
    prisma.customer.create({
      data: {
        name: 'Vijay Kumar',
        mobile: '9988776660',
        address: '987, Lake View, Hyderabad',
        aadhaar: '678901234567',
        isActive: true,
      },
    }),
    prisma.customer.create({
      data: {
        name: 'Anita Gupta',
        mobile: '9988776661',
        address: '147, River Side, Kolkata',
        aadhaar: '789012345678',
        isActive: true,
      },
    }),
    prisma.customer.create({
      data: {
        name: 'Ravi Shankar',
        mobile: '9988776662',
        address: '258, Hill Top, Jaipur',
        isActive: true,
      },
    }),
    prisma.customer.create({
      data: {
        name: 'Kavita Reddy',
        mobile: '9988776663',
        address: '369, Beach Road, Goa',
        isActive: true,
      },
    }),
    prisma.customer.create({
      data: {
        name: 'Manoj Tiwari',
        mobile: '9988776664',
        address: '741, Temple Street, Lucknow',
        isActive: true,
      },
    }),
  ])

  console.log('✅ Created 10 customers')

  // ============================================
  // 5. ASSIGN CUSTOMERS TO COLLECTORS
  // ============================================
  console.log('🔗 Assigning customers to collectors...')

  // Collector 1: First 4 customers
  for (let i = 0; i < 4; i++) {
    await prisma.customerCollectorAssignment.create({
      data: {
        customerId: customers[i].id,
        collectorId: collector1.id,
        assignedDate: new Date(),
        isActive: true,
      },
    })
  }

  // Collector 2: Next 3 customers
  for (let i = 4; i < 7; i++) {
    await prisma.customerCollectorAssignment.create({
      data: {
        customerId: customers[i].id,
        collectorId: collector2.id,
        assignedDate: new Date(),
        isActive: true,
      },
    })
  }

  // Collector 3: Last 3 customers
  for (let i = 7; i < 10; i++) {
    await prisma.customerCollectorAssignment.create({
      data: {
        customerId: customers[i].id,
        collectorId: collector3.id,
        assignedDate: new Date(),
        isActive: true,
      },
    })
  }

  console.log('✅ Assigned customers to collectors')

  // ============================================
  // 6. CREATE PENALTY CONFIG
  // ============================================
  console.log('⚖️  Creating penalty configuration...')

  await prisma.penaltyConfig.create({
    data: {
      penaltyType: 'fixed',
      penaltyValue: 10.0,
      graceDays: 0,
      isActive: true,
    },
  })

  await prisma.penaltyConfig.create({
    data: {
      penaltyType: 'percent',
      penaltyValue: 5.0,
      graceDays: 1,
      isActive: false,
    },
  })

  console.log('✅ Created penalty configurations')

  // ============================================
  // 7. CREATE TOKENS (LOANS)
  // ============================================
  console.log('💰 Creating tokens (loans)...')

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Token 1: Active, on-time payments
  const token1 = await prisma.token.create({
    data: {
      tokenNo: 'TKN-20241215-0001',
      customerId: customers[0].id,
      collectorId: collector1.id,
      loanAmount: 10000.0,
      interestType: 'fixed',
      interestValue: 1000.0,
      totalAmount: 11000.0,
      durationDays: 30,
      dailyInstallment: 366.67,
      startDate: addDays(today, -10), // Started 10 days ago
      endDate: addDays(today, 20), // Ends in 20 days
      status: 'active',
    },
  })

  // Token 2: Active, has overdue
  const token2 = await prisma.token.create({
    data: {
      tokenNo: 'TKN-20241210-0002',
      customerId: customers[1].id,
      collectorId: collector1.id,
      loanAmount: 15000.0,
      interestType: 'percentage',
      interestValue: 10.0,
      totalAmount: 16500.0,
      durationDays: 45,
      dailyInstallment: 366.67,
      startDate: addDays(today, -15), // Started 15 days ago
      endDate: addDays(today, 30),
      status: 'overdue',
    },
  })

  // Token 3: Recently started
  const token3 = await prisma.token.create({
    data: {
      tokenNo: 'TKN-20241218-0003',
      customerId: customers[2].id,
      collectorId: collector1.id,
      loanAmount: 5000.0,
      interestType: 'fixed',
      interestValue: 500.0,
      totalAmount: 5500.0,
      durationDays: 20,
      dailyInstallment: 275.0,
      startDate: addDays(today, -2), // Started 2 days ago
      endDate: addDays(today, 18),
      status: 'active',
    },
  })

  // Token 4: Collector 2's token
  const token4 = await prisma.token.create({
    data: {
      tokenNo: 'TKN-20241212-0004',
      customerId: customers[4].id,
      collectorId: collector2.id,
      loanAmount: 20000.0,
      interestType: 'percentage',
      interestValue: 12.0,
      totalAmount: 22400.0,
      durationDays: 60,
      dailyInstallment: 373.33,
      startDate: addDays(today, -12),
      endDate: addDays(today, 48),
      status: 'active',
    },
  })

  // Token 5: Closed token
  const token5 = await prisma.token.create({
    data: {
      tokenNo: 'TKN-20241101-0005',
      customerId: customers[5].id,
      collectorId: collector2.id,
      loanAmount: 8000.0,
      interestType: 'fixed',
      interestValue: 800.0,
      totalAmount: 8800.0,
      durationDays: 30,
      dailyInstallment: 293.33,
      startDate: addDays(today, -40),
      endDate: addDays(today, -10),
      status: 'closed',
    },
  })

  console.log('✅ Created 5 tokens')

  // ============================================
  // 8. CREATE REPAYMENT SCHEDULES
  // ============================================
  console.log('📅 Creating repayment schedules...')

  // Helper function to create schedule for a token
  async function createSchedule(
    tokenId: number,
    startDate: Date,
    durationDays: number,
    dailyInstallment: number,
    status: 'active' | 'closed' | 'overdue'
  ) {
    const schedules = []

    for (let i = 0; i < durationDays; i++) {
      const scheduleDate = addDays(startDate, i)
      const isPast = scheduleDate < today
      const isToday = scheduleDate.getTime() === today.getTime()

      let scheduleStatus: 'pending' | 'paid' | 'overdue' | 'partial' = 'pending'
      let paidAmount = 0
      let paymentDate = null

      if (status === 'closed') {
        // All paid for closed tokens
        scheduleStatus = 'paid'
        paidAmount = dailyInstallment
        paymentDate = scheduleDate
      } else if (isPast) {
        // For active tokens, some past payments are paid
        if (tokenId === token1.id) {
          // Token 1: All past payments done
          scheduleStatus = 'paid'
          paidAmount = dailyInstallment
          paymentDate = scheduleDate
        } else if (tokenId === token2.id) {
          // Token 2: Some overdue
          if (i < 10) {
            scheduleStatus = 'paid'
            paidAmount = dailyInstallment
            paymentDate = scheduleDate
          } else {
            scheduleStatus = 'overdue'
            paidAmount = 0
          }
        } else {
          // Token 3 & 4: Mostly paid
          if (Math.random() > 0.2) {
            scheduleStatus = 'paid'
            paidAmount = dailyInstallment
            paymentDate = scheduleDate
          } else {
            scheduleStatus = 'overdue'
          }
        }
      }

      schedules.push({
        tokenId,
        scheduleDate,
        installmentAmount: dailyInstallment,
        penaltyAmount: scheduleStatus === 'overdue' ? 10.0 : 0,
        totalDue: scheduleStatus === 'overdue' ? dailyInstallment + 10.0 : dailyInstallment,
        paidAmount,
        paymentDate,
        status: scheduleStatus,
      })
    }

    await prisma.repaymentSchedule.createMany({
      data: schedules,
    })
  }

  // Create schedules for all tokens
  await createSchedule(token1.id, addDays(today, -10), 30, 366.67, 'active')
  await createSchedule(token2.id, addDays(today, -15), 45, 366.67, 'overdue')
  await createSchedule(token3.id, addDays(today, -2), 20, 275.0, 'active')
  await createSchedule(token4.id, addDays(today, -12), 60, 373.33, 'active')
  await createSchedule(token5.id, addDays(today, -40), 30, 293.33, 'closed')

  console.log('✅ Created repayment schedules for all tokens')

  // ============================================
  // 9. CREATE PAYMENTS
  // ============================================
  console.log('💳 Creating payment records...')

  // Get all paid schedules
  const paidSchedules = await prisma.repaymentSchedule.findMany({
    where: {
      status: 'paid',
    },
    include: {
      token: true,
    },
  })

  // Create payment records for paid schedules
  for (const schedule of paidSchedules.slice(0, 50)) {
    // Limit to 50 for seed
    await prisma.payment.create({
      data: {
        tokenId: schedule.tokenId,
        scheduleId: schedule.id,
        collectorId: schedule.token.collectorId,
        amount: schedule.paidAmount,
        paymentMode: ['cash', 'upi', 'bank_transfer'][Math.floor(Math.random() * 3)] as any,
        paymentDate: schedule.paymentDate!,
        isSynced: true,
      },
    })
  }

  console.log('✅ Created payment records')

  // ============================================
  // 10. SUMMARY
  // ============================================
  console.log('\n' + '='.repeat(50))
  console.log('🎉 SEED DATA CREATED SUCCESSFULLY!')
  console.log('='.repeat(50))
  console.log('\n📊 Summary:')
  console.log('   👤 Admin Users: 2')
  console.log('      - Username: superadmin | Password: Admin@123')
  console.log('      - Username: director   | Password: Admin@123')
  console.log('\n   👥 Collectors: 3')
  console.log('      - Rajesh Kumar (9876543210) | Password: Collector@123')
  console.log('      - Amit Sharma  (9876543211) | Password: Collector@123')
  console.log('      - Priya Singh  (9876543212) | Password: Collector@123')
  console.log('\n   👨‍👩‍👧‍👦 Customers: 10')
  console.log('   💰 Tokens: 5 (1 closed, 1 overdue, 3 active)')
  console.log('   📅 Repayment Schedules: Created for all tokens')
  console.log('   💳 Payments: ~50 payment records')
  console.log('   ⚖️  Penalty Config: 2 rules')
  console.log('\n' + '='.repeat(50))
  console.log('✅ You can now login and test the system!')
  console.log('='.repeat(50) + '\n')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })