'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
    IndianRupee,
    FileText,
    Clock,
    CheckCircle,
    AlertTriangle,
    TrendingUp,
    Calendar,
    ChevronRight,
    Search,
    Bell,
    Wallet,
    Menu,
    LogOut
} from 'lucide-react'
import { formatCurrency } from '@/utils/calculations'
import { format } from 'date-fns'
import { useSidebar } from '../layout'
import { signOut } from 'next-auth/react'

interface DashboardStats {
    todayCollection: number
    todayTarget: number
    activeTokens: number
    overdueTokens: number
    todaySchedules: number
    pendingSchedules: number
}

interface TokenSummary {
    id: number
    tokenNo: string
    customer: {
        name: string
        mobile: string
    }
    totalAmount: number
    dailyAmount: number
    todaySchedule?: {
        scheduleDate: string
        totalDue: number
        status: string
    }
}

export default function CollectorDashboard() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const { openSidebar } = useSidebar()
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [tokens, setTokens] = useState<TokenSummary[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (status === 'loading') return

        if (!session || session?.user?.userType !== 'collector') {
            // router.push('/login')
            return
        }
        fetchDashboardData()
    }, [session, status])

    const fetchDashboardData = async () => {
        setLoading(true)
        try {
            const response = await fetch('/api/collectors/dashboard')
            const result = await response.json()

            if (result.success) {
                setStats(result.data.stats)
                setTokens(result.data.tokens)
            }
        } catch (error) {
            console.error('Failed to fetch dashboard:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-white">
                <div className="relative">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <IndianRupee className="w-6 h-6 text-blue-600" />
                    </div>
                </div>
            </div>
        )
    }

    if (!stats) {
        return (
            <div className="flex items-center justify-center h-screen text-gray-500 flex-col gap-4">
                <AlertTriangle className="w-12 h-12 text-red-400" />
                <p className="font-medium text-lg">Failed to load dashboard</p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-2 bg-blue-600 text-white rounded-full text-sm hover:shadow-lg transition-all"
                >
                    Retry
                </button>
            </div>
        )
    }

    const collectionProgress = stats.todayTarget > 0 ? (stats.todayCollection / stats.todayTarget) * 100 : 0

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans text-slate-900">
            {/* Professional Header */}
            <div className="bg-[#0F172A] pt-8 pb-16 px-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20 scale-150"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-400/10 rounded-full blur-2xl -ml-16 -mb-16"></div>

                <div className="relative z-10 flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg border border-blue-400/30">
                            {session?.user?.name?.charAt(0) || 'C'}
                        </div>
                        <div>
                            <p className="text-blue-300 text-xs font-medium uppercase tracking-wider">Welcome Back</p>
                            <h1 className="text-xl font-bold text-white tracking-tight">{session?.user?.name}</h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="p-2 bg-slate-800/50 rounded-xl border border-slate-700/50 text-slate-300 hover:text-white transition-all backdrop-blur-sm">
                            <Bell className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => signOut({ callbackUrl: '/login' })}
                            className="p-2 bg-red-500/10 rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                        <button
                            onClick={openSidebar}
                            className="p-2 bg-slate-800/50 rounded-xl border border-slate-700/50 text-slate-300 hover:text-white transition-all backdrop-blur-sm"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="relative z-10 bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10 shadow-2xl">
                    <div className="flex justify-between items-end mb-4">
                        <div>
                            <p className="text-slate-400 text-sm font-medium">Daily Progress</p>
                            <p className="text-3xl font-bold text-white mt-1">
                                {formatCurrency(stats.todayCollection)}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-slate-400 text-xs mb-1">Target: {formatCurrency(stats.todayTarget)}</p>
                            <div className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-bold border border-green-500/30">
                                {collectionProgress.toFixed(1)}% Collected
                            </div>
                        </div>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-3.5 mb-2 overflow-hidden border border-white/5">
                        <div
                            className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                            style={{ width: `${Math.min(collectionProgress, 100)}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            {/* Premium Stats Grid */}
            <div className="px-5 -mt-8 relative z-10">
                <div className="grid grid-cols-2 gap-4">
                    <div
                        onClick={() => router.push('/collectors/tokens')}
                        className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:border-blue-200 transition-all hover:shadow-md group cursor-pointer"
                    >
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                            <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <p className="text-2xl font-black text-slate-800 tracking-tight">{stats.activeTokens}</p>
                        <p className="text-slate-500 text-xs font-semibold uppercase mt-0.5 whitespace-nowrap">Active Tasks</p>
                    </div>

                    <div
                        onClick={() => router.push('/collectors/due-list')}
                        className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:border-red-200 transition-all hover:shadow-md group cursor-pointer"
                    >
                        <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                        </div>
                        <p className="text-2xl font-black text-slate-800 tracking-tight">{stats.overdueTokens}</p>
                        <p className="text-slate-500 text-xs font-semibold uppercase mt-0.5 whitespace-nowrap">Due List</p>
                    </div>

                    <div
                        onClick={() => router.push('/collectors/due-list')}
                        className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:border-green-200 transition-all hover:shadow-md group cursor-pointer"
                    >
                        <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                            <Calendar className="w-5 h-5 text-green-600" />
                        </div>
                        <p className="text-2xl font-black text-slate-800 tracking-tight">{stats.todaySchedules}</p>
                        <p className="text-slate-500 text-xs font-semibold uppercase mt-0.5 whitespace-nowrap">Today's Lists</p>
                    </div>

                    <div
                        onClick={() => router.push('/collectors/penalties')}
                        className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:border-orange-200 transition-all hover:shadow-md group cursor-pointer"
                    >
                        <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform text-orange-600">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                        <p className="text-2xl font-black text-slate-800 tracking-tight">{stats.pendingSchedules}</p>
                        <p className="text-slate-500 text-xs font-semibold uppercase mt-0.5 whitespace-nowrap">Penalty Cases</p>
                    </div>
                </div>
            </div>

            {/* Collection Section */}
            <div className="px-5 mt-8">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-extrabold text-[#1E293B] tracking-tight">Priority Collections</h2>
                    <button
                        onClick={() => router.push('/collectors/tokens')}
                        className="text-sm text-blue-600 font-bold bg-blue-50 px-4 py-1.5 rounded-full hover:bg-blue-100 transition-all active:scale-95"
                    >
                        View All
                    </button>
                </div>

                <div className="space-y-4">
                    {tokens.length === 0 ? (
                        <div className="bg-white rounded-2xl shadow-sm p-10 text-center border border-slate-100">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                                <Calendar className="w-10 h-10 text-slate-300" />
                            </div>
                            <p className="text-slate-500 font-medium">Nothing scheduled for today</p>
                        </div>
                    ) : (
                        tokens.map((token) => (
                            <div
                                key={token.id}
                                className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden active:scale-[0.98] transition-all hover:border-blue-200"
                                onClick={() => router.push(`/collectors/tokens/${token.id}`)}
                            >
                                <div className="p-4">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex gap-3">
                                            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100">
                                                <IndianRupee className="w-5 h-5 text-slate-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900 tracking-tight">{token.tokenNo}</p>
                                                <p className="text-xs text-slate-500 mt-0.5 font-medium">{token.customer.name}</p>
                                            </div>
                                        </div>
                                        {token.todaySchedule && (
                                            <span
                                                className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm border ${token.todaySchedule.status === 'paid'
                                                    ? 'bg-green-50 text-green-700 border-green-200'
                                                    : token.todaySchedule.status === 'overdue'
                                                        ? 'bg-red-50 text-red-700 border-red-200'
                                                        : 'bg-orange-50 text-orange-700 border-orange-200'
                                                    }`}
                                            >
                                                {token.todaySchedule.status}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">Today's Dues</p>
                                            <p className="text-xl font-black text-slate-900">
                                                {token.todaySchedule
                                                    ? formatCurrency(token.todaySchedule.totalDue)
                                                    : formatCurrency(token.dailyAmount)}
                                            </p>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                router.push(`/collectors/payment?token=${token.id}`)
                                            }}
                                            className="px-5 py-2.5 bg-blue-600 text-white text-xs font-black rounded-xl shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all active:scale-95 flex items-center gap-2"
                                        >
                                            RECORD
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Animated Bottom Navigation */}
            <div className="fixed bottom-6 left-5 right-5 z-50">
                <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-3xl p-3 shadow-2xl flex items-center justify-around">
                    <button
                        onClick={() => router.push('/collectors/dashboard')}
                        className="flex flex-col items-center gap-1.5 text-blue-400"
                    >
                        <div className="p-2 bg-blue-400/10 rounded-2xl">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest">Home</span>
                    </button>
                    <button
                        onClick={() => router.push('/collectors/tokens')}
                        className="flex flex-col items-center gap-1.5 text-slate-500 hover:text-white transition-all"
                    >
                        <div className="p-2 hover:bg-white/5 rounded-2xl transition-all">
                            <FileText className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest">Tokens</span>
                    </button>
                    <button
                        onClick={() => router.push('/collectors/payment')}
                        className="flex flex-col items-center gap-1.5 text-slate-500 hover:text-white transition-all"
                    >
                        <div className="p-2 hover:bg-white/5 rounded-2xl transition-all">
                            <IndianRupee className="w-5 h-5 transition-all" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest">Pay</span>
                    </button>
                    <button
                        onClick={() => router.push('/collectors/history')}
                        className="flex flex-col items-center gap-1.5 text-slate-500 hover:text-white transition-all"
                    >
                        <div className="p-2 hover:bg-white/5 rounded-2xl transition-all">
                            <Clock className="w-5 h-5 transition-all" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest">History</span>
                    </button>
                    <button
                        onClick={() => router.push('/collectors/cash-account')}
                        className="flex flex-col items-center gap-1.5 text-slate-500 hover:text-white transition-all"
                    >
                        <div className="p-2 hover:bg-white/5 rounded-2xl transition-all">
                            <Wallet className="w-5 h-5 transition-all" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest">Cash</span>
                    </button>
                </div>
            </div>
        </div>
    )
}