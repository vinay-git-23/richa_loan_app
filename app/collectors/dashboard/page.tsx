'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
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
    Wallet,
    Menu,
    Package,
    Zap,
    LogOut
} from 'lucide-react'
import { formatCurrency } from '@/utils/calculations'
import { format } from 'date-fns'
import { useSidebar } from '../layout'
import { signOut } from 'next-auth/react'

interface DashboardStats {
    todayCollection: number
    todayTarget: number
    activeBatches: number
    overdueBatches: number
    todaySchedules: number
    pendingSchedules: number
}

interface BatchSummary {
    id: number
    batchNo: string
    quantity: number
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
    const pathname = usePathname()
    const { openSidebar } = useSidebar()
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [batches, setBatches] = useState<BatchSummary[]>([])
    const [loading, setLoading] = useState(true)
    const [loggingOut, setLoggingOut] = useState(false)

    useEffect(() => {
        if (status === 'loading') return

        if (!session || session?.user?.userType !== 'collector') {
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
                setBatches(result.data.batches || result.data.tokens || [])
            }
        } catch (error) {
            console.error('Failed to fetch dashboard:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gradient-to-br from-orange-50 to-slate-50">
                <div className="relative">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-orange-600"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <IndianRupee className="w-6 h-6 text-orange-600" />
                    </div>
                </div>
            </div>
        )
    }

    if (!stats) {
        return (
            <div className="flex items-center justify-center h-screen text-slate-500 flex-col gap-4 bg-gradient-to-br from-orange-50 to-slate-50">
                <AlertTriangle className="w-12 h-12 text-orange-400" />
                <p className="font-bold text-lg">Failed to load dashboard</p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-3 bg-orange-600 text-white rounded-2xl text-sm font-bold hover:shadow-lg transition-all active:scale-95"
                >
                    Retry
                </button>
            </div>
        )
    }

    const collectionProgress = stats.todayTarget > 0 ? (stats.todayCollection / stats.todayTarget) * 100 : 0

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-50 pb-24 font-sans text-slate-900">
            {/* Professional Header - Orange/Gray Theme */}
            <div className="bg-gradient-to-br from-orange-600 via-orange-500 to-orange-600 pt-8 pb-16 px-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 scale-150"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -ml-16 -mb-16"></div>

                <div className="relative z-10 flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg border border-white/30">
                            {session?.user?.name?.charAt(0) || 'C'}
                        </div>
                        <div>
                            <p className="text-orange-100 text-xs font-bold uppercase tracking-wider">Welcome Back</p>
                            <h1 className="text-xl font-black text-white tracking-tight">{session?.user?.name}</h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={async () => {
                                setLoggingOut(true)
                                router.push('/login')
                                signOut({ redirect: false, callbackUrl: '/login' }).catch(() => {})
                            }}
                            disabled={loggingOut}
                            className="p-2 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 text-white hover:bg-red-500/30 hover:border-red-400/50 transition-all disabled:opacity-50"
                            title="Sign Out"
                        >
                            {loggingOut ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <LogOut className="w-5 h-5" />
                            )}
                        </button>
                        <button
                            onClick={openSidebar}
                            className="p-2 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 text-white hover:bg-white/20 transition-all"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                    <div className="relative z-10 bg-white/20 backdrop-blur-md rounded-3xl p-6 border border-white/30 shadow-2xl">
                    <div className="flex justify-between items-end mb-4">
                        <div>
                            <p className="text-orange-100 text-sm font-bold">Daily Progress</p>
                            <p className="text-3xl font-black text-white mt-1">
                                {formatCurrency(stats.todayCollection)}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-orange-100 text-xs mb-1 font-medium">Target: {formatCurrency(stats.todayTarget)}</p>
                            <div className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white rounded-full text-xs font-black border border-white/30">
                                {collectionProgress.toFixed(1)}% Collected
                            </div>
                        </div>
                    </div>
                    <div className="w-full bg-white/20 backdrop-blur-sm rounded-full h-3.5 mb-2 overflow-hidden border border-white/10">
                        <div
                            className="bg-white h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(255,255,255,0.5)]"
                            style={{ width: `${Math.min(collectionProgress, 100)}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            {/* Premium Stats Grid - Orange/Gray Theme */}
            <div className="px-5 -mt-8 relative z-10">
                <div className="grid grid-cols-2 gap-4">
                    <div
                        onClick={() => router.push('/collectors/tokens')}
                        className="bg-white rounded-2xl p-5 shadow-lg border-2 border-slate-100 hover:border-orange-200 transition-all hover:shadow-xl group cursor-pointer active:scale-95"
                    >
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform border border-orange-200">
                            <Package className="w-6 h-6 text-orange-600" />
                        </div>
                        <p className="text-3xl font-black text-slate-800 tracking-tight">{stats.activeBatches}</p>
                        <p className="text-slate-500 text-xs font-black uppercase mt-1 tracking-widest">Active Batches</p>
                    </div>

                    <div
                        onClick={() => router.push('/collectors/due-list')}
                        className="bg-white rounded-2xl p-5 shadow-lg border-2 border-slate-100 hover:border-red-200 transition-all hover:shadow-xl group cursor-pointer active:scale-95"
                    >
                        <div className="w-12 h-12 bg-gradient-to-br from-red-50 to-red-100 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform border border-red-200">
                            <AlertTriangle className="w-6 h-6 text-red-600" />
                        </div>
                        <p className="text-3xl font-black text-slate-800 tracking-tight">{stats.overdueBatches}</p>
                        <p className="text-slate-500 text-xs font-black uppercase mt-1 tracking-widest">Due List</p>
                    </div>

                    <div
                        onClick={() => router.push('/collectors/due-list')}
                        className="bg-white rounded-2xl p-5 shadow-lg border-2 border-slate-100 hover:border-emerald-200 transition-all hover:shadow-xl group cursor-pointer active:scale-95"
                    >
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform border border-emerald-200">
                            <Calendar className="w-6 h-6 text-emerald-600" />
                        </div>
                        <p className="text-3xl font-black text-slate-800 tracking-tight">{stats.todaySchedules}</p>
                        <p className="text-slate-500 text-xs font-black uppercase mt-1 tracking-widest">Today's Lists</p>
                    </div>

                    <div
                        onClick={() => router.push('/collectors/penalties')}
                        className="bg-white rounded-2xl p-5 shadow-lg border-2 border-slate-100 hover:border-orange-200 transition-all hover:shadow-xl group cursor-pointer active:scale-95"
                    >
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform border border-orange-200">
                            <Zap className="w-6 h-6 text-orange-600" />
                        </div>
                        <p className="text-3xl font-black text-slate-800 tracking-tight">{stats.pendingSchedules}</p>
                        <p className="text-slate-500 text-xs font-black uppercase mt-1 tracking-widest">Penalty Cases</p>
                    </div>
                </div>
            </div>

            {/* Collection Section */}
            <div className="px-5 mt-8">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-black text-slate-900 tracking-tight">Priority Collections</h2>
                    <button
                        onClick={() => router.push('/collectors/tokens')}
                        className="text-sm text-orange-600 font-black bg-orange-50 px-4 py-2 rounded-full hover:bg-orange-100 transition-all active:scale-95 border border-orange-200"
                    >
                        View All
                    </button>
                </div>

                <div className="space-y-4">
                    {batches.length === 0 ? (
                        <div className="bg-white rounded-2xl shadow-lg p-10 text-center border-2 border-slate-100">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-slate-100">
                                <Calendar className="w-10 h-10 text-slate-300" />
                            </div>
                            <p className="text-slate-500 font-bold">Nothing scheduled for today</p>
                        </div>
                    ) : (
                        batches.map((batch) => (
                            <div
                                key={batch.id}
                                className="bg-white rounded-2xl shadow-lg border-2 border-slate-100 overflow-hidden active:scale-[0.98] transition-all hover:border-orange-200 hover:shadow-xl"
                                onClick={() => router.push(`/collectors/token-batches/${batch.id}`)}
                            >
                                <div className="p-5">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex gap-3">
                                            <div className="w-12 h-12 bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl flex items-center justify-center border-2 border-orange-200">
                                                <span className="text-orange-600 font-black text-sm">{batch.quantity}x</span>
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-slate-900 tracking-tight">{batch.batchNo}</p>
                                                <p className="text-xs text-slate-500 mt-0.5 font-bold">{batch.customer.name}</p>
                                            </div>
                                        </div>
                                        {batch.todaySchedule && (
                                            <span
                                                className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm border-2 ${
                                                    batch.todaySchedule.status === 'paid'
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                        : batch.todaySchedule.status === 'overdue'
                                                        ? 'bg-red-50 text-red-700 border-red-200'
                                                        : 'bg-orange-50 text-orange-700 border-orange-200'
                                                }`}
                                            >
                                                {batch.todaySchedule.status}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-0.5">Today's Dues</p>
                                            <p className="text-2xl font-black text-slate-900">
                                                {batch.todaySchedule
                                                    ? formatCurrency(batch.todaySchedule.totalDue)
                                                    : formatCurrency(batch.dailyAmount)}
                                            </p>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                router.push(`/collectors/token-batches/${batch.id}`)
                                            }}
                                            className="px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-500 text-white text-xs font-black rounded-2xl shadow-lg shadow-orange-500/30 hover:from-orange-700 hover:to-orange-600 transition-all active:scale-95 flex items-center gap-2"
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

            {/* Fixed Bottom Menu - Consistent with other pages */}
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t-2 border-slate-200 shadow-2xl">
                <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-around">
                    <button
                        onClick={() => router.push('/collectors/dashboard')}
                        className="flex flex-col items-center gap-1 text-orange-600"
                    >
                        <div className="p-2.5 rounded-2xl bg-orange-50 border-2 border-orange-200">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest">Home</span>
                    </button>
                    <button
                        onClick={() => router.push('/collectors/tokens')}
                        className="flex flex-col items-center gap-1 text-slate-400"
                    >
                        <div className="p-2.5 rounded-2xl">
                            <Package className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest">Batches</span>
                    </button>
                    <button
                        onClick={() => router.push('/collectors/payment')}
                        className="flex flex-col items-center gap-1 text-slate-400"
                    >
                        <div className="p-2.5 rounded-2xl">
                            <IndianRupee className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest">Pay</span>
                    </button>
                    <button
                        onClick={() => router.push('/collectors/account')}
                        className="flex flex-col items-center gap-1 text-slate-400"
                    >
                        <div className="p-2.5 rounded-2xl">
                            <Wallet className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest">Account</span>
                    </button>
                    <button
                        onClick={() => router.push('/collectors/history')}
                        className="flex flex-col items-center gap-1 text-slate-400"
                    >
                        <div className="p-2.5 rounded-2xl">
                            <Clock className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest">History</span>
                    </button>
                </div>
            </div>
        </div>
    )
}
