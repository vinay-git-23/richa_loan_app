'use client'

import { useEffect, useState } from 'react'
import {
    Wallet,
    TrendingUp,
    TrendingDown,
    AlertCircle,
    IndianRupee,
    Users,
    Clock,
    CheckCircle2,
    ArrowUpRight,
    ArrowDownRight,
    Activity,
    CreditCard,
    Target,
    BarChart3,
    ArrowRight
} from 'lucide-react'
import { formatCurrency } from '@/utils/calculations'

interface DashboardData {
    stats: {
        totalActiveTokens: number
        totalDisbursedAmount: number
        totalCollectedAmount: number
        totalOutstandingAmount: number
        todayCollectionTarget: number
        todayActualCollection: number
        collectionEfficiency: number
        overdueTokens: number
        totalOverdueAmount: number
    }
    recentPayments: Array<{
        id: number
        amount: number
        date: string
        customerName: string
        collectorName: string
        tokenNo: string
        paymentMode: string
    }>
    overdueCustomers: Array<{
        tokenNo: string
        customerName: string
        customerMobile: string
        collectorName: string
        overdueDays: number
        overdueAmount: number
    }>
    collectorPerformance: Array<{
        id: number
        name: string
        collectorId: string
        todayCollection: number
        activeTokens: number
    }>
    tokenStatusDistribution: Array<{
        status: string
        count: number
    }>
}

export default function AdminDashboard() {
    const [data, setData] = useState<DashboardData | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchDashboardData()
    }, [])

    const fetchDashboardData = async () => {
        try {
            const response = await fetch('/api/dashboard/admin')
            const result = await response.json()
            if (result.success) {
                setData(result.data)
            }
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <div className="w-12 h-12 border-4 border-slate-100 border-t-orange-600 rounded-full animate-spin"></div>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs animate-pulse">Loading dashboard data...</p>
            </div>
        )
    }

    if (!data) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="bg-white border border-slate-200 p-8 rounded-2xl text-center shadow-sm">
                    <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
                    <p className="text-slate-900 font-bold">Failed to load data</p>
                    <p className="text-slate-500 text-sm mt-1">Please check your connection and try again.</p>
                </div>
            </div>
        )
    }

    const { stats } = data

    return (
        <div className="space-y-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Financial Overview</h1>
                    <p className="text-slate-500 text-sm font-medium mt-1">Monitor your collections, disbursements, and agent performance.</p>
                </div>
                <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm transition-all hover:border-orange-200">
                    <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center text-orange-600">
                        <BarChart3 className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Overall Recovery</p>
                        <p className="text-xl font-bold text-slate-900 tracking-tight mt-1">
                            {Math.round((stats.totalCollectedAmount / (stats.totalDisbursedAmount || 1)) * 100)}%
                        </p>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Active Loans"
                    value={stats.totalActiveTokens}
                    icon={Wallet}
                    subtitle="Currently active tokens"
                    trend="+12% from last month"
                />
                <StatCard
                    title="Total Disbursed"
                    value={formatCurrency(stats.totalDisbursedAmount)}
                    icon={TrendingUp}
                    subtitle="Lifetime outflow"
                />
                <StatCard
                    title="Total Collected"
                    value={formatCurrency(stats.totalCollectedAmount)}
                    icon={IndianRupee}
                    subtitle="Lifetime inflow"
                    color="emerald"
                />
                <StatCard
                    title="Outstanding"
                    value={formatCurrency(stats.totalOutstandingAmount)}
                    icon={Clock}
                    subtitle="Total balance due"
                    color="rose"
                />
            </div>

            {/* Performance & Overdue */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Collection Performance */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">Today's Performance</h2>
                            <p className="text-xs text-slate-500 font-medium">Real-time collection tracking</p>
                        </div>
                        <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400">
                            <Target className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="p-8 flex-1 flex flex-col justify-center">
                        <div className="grid md:grid-cols-2 gap-10">
                            <div className="space-y-6">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Target Amount</p>
                                    <p className="text-4xl font-bold text-slate-900 tracking-tight">{formatCurrency(stats.todayCollectionTarget)}</p>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-end">
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Efficiency</p>
                                        <p className={`text-sm font-bold ${stats.collectionEfficiency >= 80 ? 'text-emerald-600' : 'text-orange-600'}`}>
                                            {stats.collectionEfficiency}%
                                        </p>
                                    </div>
                                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                                        <div
                                            className={`h-full transition-all duration-1000 ease-out ${stats.collectionEfficiency >= 80 ? 'bg-emerald-500' : 'bg-orange-500'}`}
                                            style={{ width: `${Math.min(stats.collectionEfficiency, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-slate-50 rounded-xl p-6 border border-slate-100 flex flex-col justify-center">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Collected Today</p>
                                <p className="text-3xl font-bold text-emerald-600 tracking-tight">{formatCurrency(stats.todayActualCollection)}</p>
                                <p className="text-[10px] text-slate-400 font-medium mt-2">Verified system deposits</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Overdue Summary */}
                <div className="bg-slate-900 rounded-2xl p-8 text-white shadow-lg flex flex-col justify-between relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center text-orange-500 border border-white/10">
                                <AlertCircle className="w-5 h-5" />
                            </div>
                            <h2 className="text-lg font-bold">Overdue Summary</h2>
                        </div>
                        <div className="space-y-4">
                            <div className="bg-white/5 rounded-xl p-5 border border-white/5">
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Total Overdue Tokens</p>
                                <p className="text-3xl font-bold">{stats.overdueTokens}</p>
                            </div>
                            <div className="bg-white/5 rounded-xl p-5 border border-white/5">
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Total Risk Amount</p>
                                <p className="text-xl font-bold text-rose-400">{formatCurrency(stats.totalOverdueAmount)}</p>
                            </div>
                        </div>
                    </div>
                    <button className="relative z-10 mt-8 w-full py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-lg font-bold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-slate-900">
                        View Risk Report
                    </button>
                    {/* Subtle decoration */}
                    <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-orange-600/10 rounded-full blur-2xl"></div>
                </div>
            </div>

            {/* Activity & Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Payments */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col hover:border-slate-300 transition-colors">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                        <h2 className="text-lg font-bold text-slate-900">Recent Payments</h2>
                        <button className="text-xs font-bold text-orange-600 uppercase tracking-widest hover:text-orange-700">View All</button>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {data.recentPayments.length > 0 ? (
                            data.recentPayments.slice(0, 5).map((payment) => (
                                <div key={payment.id} className="p-6 hover:bg-slate-50 transition-colors flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                                            <CreditCard className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900">{payment.customerName}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">#{payment.tokenNo} • {payment.collectorName}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-emerald-600">{formatCurrency(payment.amount)}</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{payment.paymentMode}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-12 text-center text-slate-400 italic text-sm">No recent payments</div>
                        )}
                    </div>
                </div>

                {/* Agent Performance */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
                    <h2 className="text-lg font-bold text-slate-900">Agent Performance</h2>
                    <div className="space-y-4">
                        {data.collectorPerformance.slice(0, 4).map((collector) => (
                            <div key={collector.id} className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 hover:border-slate-200 transition-all">
                                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-slate-800 font-bold border border-slate-200">
                                    {collector.name.charAt(0)}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-0.5">
                                        <p className="text-sm font-bold text-slate-900">{collector.name}</p>
                                        <p className="text-sm font-bold text-emerald-600">{formatCurrency(collector.todayCollection)}</p>
                                    </div>
                                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        <span>ID: {collector.collectorId}</span>
                                        <span className="text-orange-600">{collector.activeTokens} Active Tokens</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="pt-2">
                        <div className="bg-slate-900 rounded-xl p-5 border border-slate-800 flex items-center justify-between group cursor-pointer hover:bg-slate-800 transition-all">
                            <div>
                                <p className="text-white text-sm font-bold">Performance Report</p>
                                <p className="text-slate-500 text-[10px] uppercase font-bold mt-1">Detailed agent analytics</p>
                            </div>
                            <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function StatCard({ title, value, subtitle, icon: Icon, color = 'orange', trend }: any) {
    const colors = {
        orange: 'bg-orange-50 text-orange-600 border-orange-100',
        emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        rose: 'bg-rose-50 text-rose-600 border-rose-100',
        slate: 'bg-slate-50 text-slate-600 border-slate-100'
    }

    const colorConfig = colors[color as keyof typeof colors] || colors.orange

    return (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:border-slate-300 transition-all group">
            <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg ${colorConfig} border`}>
                    <Icon className="w-5 h-5" />
                </div>
                {trend && (
                    <div className="flex items-center gap-1 py-1 px-2.5 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase rounded-full border border-slate-100">
                        {trend.includes('+') ? <ArrowUpRight className="w-3 h-3 text-emerald-500" /> : <TrendingDown className="w-3 h-3 text-rose-500" />}
                        {trend}
                    </div>
                )}
            </div>
            <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</p>
                <p className="text-2xl font-bold text-slate-900 tracking-tight">{value}</p>
                <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-wide group-hover:text-slate-500 transition-colors">{subtitle}</p>
            </div>
        </div>
    )
}