import { UserType } from '@prisma/client'
import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    // Redirect root to appropriate dashboard
    if (path === '/') {
      if (token?.userType === 'admin') {
        return NextResponse.redirect(new URL('/admin/dashboard', req.url))
      } else if (token?.userType === 'collector') {
        return NextResponse.redirect(new URL('/collectors/dashboard', req.url))
      }
      return NextResponse.redirect(new URL('/login', req.url))
    }

    // Check admin routes
    if (path.startsWith('/admin')) {
      if (token?.userType !== 'admin') {
        return NextResponse.redirect(new URL('/collectors/dashboard', req.url))
      }
    }

    // Check collector routes
    if (path.startsWith('/collectors')) {
      if (token?.userType !== 'collector') {
        return NextResponse.redirect(new URL('/admin/dashboard', req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: ['/', '/admin/:path*', '/collectors/:path*'],
}