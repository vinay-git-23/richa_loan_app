import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import prisma from './prisma'


export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'admin-login',
      name: 'Admin Login',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error('Username and password required')
        }

        // Find admin user
        const user = await prisma.adminUser.findFirst({
          where: {
            username: credentials.username,
            isActive: true,
          },
        })

        if (!user) {
          throw new Error('Invalid credentials')
        }

        // Verify password
        const isValid = await bcrypt.compare(credentials.password, user.passwordHash)

        if (!isValid) {
          throw new Error('Invalid credentials')
        }

        // Update last login
        await prisma.adminUser.update({
          where: { id: user.id },
          data: { lastLogin: new Date() },
        })

        return {
          id: user.id.toString(),
          name: user.username,
          email: user.email,
          role: user.role,
          userType: 'admin',
        }
      },
    }),
    CredentialsProvider({
      id: 'collector-login',
      name: 'Collector Login',
      credentials: {
        loginId: { label: 'Login ID or Mobile', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.loginId || !credentials?.password) {
          throw new Error('Login ID/Mobile and password required')
        }

        // Find collector by collectorId OR mobile
        const collector = await prisma.collector.findFirst({
          where: {
            OR: [
              { collectorId: credentials.loginId },
              { mobile: credentials.loginId },
            ],
            isActive: true,
          },
        })

        if (!collector) {
          throw new Error('Invalid credentials')
        }

        // Verify password
        const isValid = await bcrypt.compare(credentials.password, collector.passwordHash)

        if (!isValid) {
          throw new Error('Invalid credentials')
        }

        // Update last login
        await prisma.collector.update({
          where: { id: collector.id },
          data: { lastLogin: new Date() },
        })

        return {
          id: collector.id.toString(),
          name: collector.name,
          email: collector.email || collector.mobile,
          role: 'collector',
          userType: 'collector',
          collectorId: collector.collectorId,
        }
      },
    }),
  ],
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.userType = user.userType
        token.collectorId = user.collectorId
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.userType = token.userType as string
        session.user.collectorId = token.collectorId as string
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}