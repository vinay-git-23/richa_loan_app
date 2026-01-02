'use client'

import { useEffect, useState } from 'react'
import {
    TrendingUp,
    TrendingDown,
    IndianRupee,
    AlertTriangle,
    Users,
    FileText,
    Calendar,
    Award,
    Activity,
    Target,
    ArrowUpRight,
    ArrowDownRight,
    Search,
    ChevronRight,
    Shield,
    Zap,
    CheckCircle2
} from 'lucide-react'
import { formatCurrency } from '@/utils/calculations'
import { format } from 'date-fns'

interface ReportsData {
    collectionSummary: {
        today: { amount: number; count: number }
        week: { amount: number; count: number }
        month: { amount: number; count: number }
    }
    collectionTrend: Array<{ date: string; amount: number }>
    overdueTokens: Array<{
        tokenId: number
        tokenNo: string
        customer: { name: string; mobile: string }
        collector: { name: string }
        totalOverdue: number
        overdueSchedules: number
        daysOverdue: number
        totalAmount: number
    }>
    collectorPerformance: Array<{
        id: number
        name: string
        collectorId: string
        activeTokens: number
        monthlyCollection: number
    }>
    tokenSummary: Array<{
        status: string
        count: number
        totalDisbursed: number
        totalAmount: number
    }>
    overallStats: {
        totalDisbursed: number
        totalCollected: number
        totalOutstanding: number
    }
}

export default function ReportsPage() {
    const [data, setData] = useState<ReportsData | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchReports()
    }, [])

    const fetchReports = async () => {
        setLoading(true)
        try {
            const response = await fetch('/api/reports')
            const result = await response.json()

            if (result.success) {
                setData(result.data)
            }
        } catch (error) {
            console.error('Failed to fetch reports:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-24 gap-4">
                <div className="w-12 h-12 border-4 border-slate-100 border-t-orange-600 rounded-full animate-spin"></div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 animate-pulse">Loading reports...</p>
            </div>
        )
    }

    if (!data) {
        return (
            <div className="flex flex-col items-center justify-center p-24 text-slate-400 text-center">
                <AlertTriangle className="w-12 h-12 text-slate-200 mb-4" />
                <p className="text-lg font-bold text-slate-900">Report Failed</p>
                <p className="text-sm text-slate-500 mt-1">Unable to load business intelligence data.</p>
                <button
                    onClick={fetchReports}
                    className="mt-6 px-6 py-2.5 bg-zinc-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-orange-600 transition-all active:scale-95 shadow-md"
                >
                    Retry
                </button>
            </div>
        )
    }

    const collectionRate =
        data.overallStats.totalDisbursed > 0
            ? (data.overallStats.totalCollected / data.overallStats.totalDisbursed) * 100
            : 0

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Reports</h1>
                    <p className="text-slate-500 text-sm mt-1">Comprehensive business insights and performance analytics.</p>
                </div>
                <button
                    onClick={fetchReports}
                    className="flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95 shadow-sm"
                >
                    <Activity className="w-4 h-4 text-orange-500" />
                    Refresh
                </button>
            </div>

            {/* Overall Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <ReportStatCard
                    title="Total Disbursed"
                    value={formatCurrency(data.overallStats.totalDisbursed)}
                    icon={IndianRupee}
                    variant="neutral"
                />
                <ReportStatCard
                    title="Total Collected"
                    value={formatCurrency(data.overallStats.totalCollected)}
                    icon={TrendingUp}
                    variant="success"
                />
                <ReportStatCard
                    title="Total Outstanding"
                    value={formatCurrency(data.overallStats.totalOutstanding)}
                    icon={Target}
                    variant="warning"
                />
                <ReportStatCard
                    title="Recovery Rate"
                    value={`${collectionRate.toFixed(1)}%`}
                    icon={Award}
                    variant="neutral"
                />
            </div>

            {/* Collection Summary Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <SummaryMiniCard
                    title="Today"
                    amount={data.collectionSummary.today.amount}
                    count={data.collectionSummary.today.count}
                />
                <SummaryMiniCard
                    title="This Week"
                    amount={data.collectionSummary.week.amount}
                    count={data.collectionSummary.week.count}
                />
                <SummaryMiniCard
                    title="This Month"
                    amount={data.collectionSummary.month.amount}
                    count={data.collectionSummary.month.count}
                />
            </div>

            {/* Trend Analysis */}
            <div className="bg-zinc-900 rounded-2xl p-10 text-white shadow-lg overflow-hidden relative">
                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-12">
                        <div>
                            <h3 className="text-xl font-bold tracking-tight">Collection Trend</h3>
                            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-1">Last 7 days recovery performance.</p>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Received</span>
                            </div>
                        </div>
                    </div>
                    <div className="h-64 flex items-end justify-between gap-6 px-4">
                        {data.collectionTrend.map((day, index) => {
                            const maxAmount = Math.max(...data.collectionTrend.map((d) => d.amount))
                            const height = maxAmount > 0 ? (day.amount / maxAmount) * 100 : 0

                            return (
                                <div key={index} className="flex-1 flex flex-col items-center gap-4 group">
                                    <div className="w-full relative flex flex-col justify-end h-full">
                                        <div
                                            className="w-full bg-orange-500 rounded-t-lg transition-all duration-500 group-hover:bg-orange-400"
                                            style={{ height: `${Math.max(height, 5)}%` }}
                                        >
                                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white text-zinc-900 text-[10px] font-bold px-2 py-1 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                                                {formatCurrency(day.amount)}
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono">
                                        {format(new Date(day.date), 'EEE')}
                                    </p>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Overdue Matrix */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-rose-500" />
                                Overdue Accounts
                            </h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">List of accounts with pending installments ({data.overdueTokens.length})</p>
                        </div>
                        <button className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
                            <Search className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="overflow-auto max-h-[500px]">
                        {data.overdueTokens.length === 0 ? (
                            <div className="p-20 text-center">
                                <Shield className="w-12 h-12 mx-auto mb-4 text-slate-100" />
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No defaults detected</p>
                            </div>
                        ) : (
                            <table className="w-full">
                                <thead className="bg-slate-50/50 sticky top-0 z-10">
                                    <tr className="border-b border-slate-100">
                                        <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Token</th>
                                        <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Customer</th>
                                        <th className="px-6 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Overdue</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {data.overdueTokens.slice(0, 10).map((token) => (
                                        <tr key={token.tokenId} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <p className="text-xs font-bold text-slate-900 uppercase">{token.tokenNo}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-0.5">{token.collector.name}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-xs font-bold text-slate-900 uppercase">{token.customer.name}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5 font-mono">{token.customer.mobile}</p>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <p className="text-xs font-bold text-rose-600 font-mono">{formatCurrency(token.totalOverdue)}</p>
                                                <p className="text-[10px] font-bold text-rose-300 uppercase mt-0.5">{token.daysOverdue}D Delay</p>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* Performance Rankings */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <Users className="w-4 h-4 text-orange-500" />
                            Collector Ranking
                        </h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Performance by collection volume this month.</p>
                    </div>
                    <div className="overflow-auto max-h-[500px]">
                        <table className="w-full">
                            <thead className="bg-slate-50/50 sticky top-0 z-10">
                                <tr className="border-b border-slate-100">
                                    <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Collector</th>
                                    <th className="px-6 py-3 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tokens</th>
                                    <th className="px-6 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Recovery</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {data.collectorPerformance.map((collector, index) => (
                                    <tr key={collector.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold ${index === 0 ? 'bg-orange-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                                    {index + 1}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-slate-900 uppercase">{collector.name}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase font-mono">{collector.collectorId}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                                                {collector.activeTokens}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <p className="text-xs font-bold text-emerald-600 font-mono">{formatCurrency(collector.monthlyCollection)}</p>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Token Status */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 tracking-tight">Token Status</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Distribution of tokens by their current status.</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {data.tokenSummary.map((status) => (
                        <StatusMiniCard key={status.status} status={status} />
                    ))}
                </div>
            </div>
        </div>
    )
}

function ReportStatCard({ title, value, icon: Icon, variant }: any) {
    const valueStyles = {
        neutral: 'text-slate-900',
        success: 'text-emerald-600',
        warning: 'text-orange-600',
    } as any

    const iconStyles = {
        neutral: 'bg-slate-100 text-slate-600',
        success: 'bg-emerald-50 text-emerald-600',
        warning: 'bg-orange-50 text-orange-600',
    } as any

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 group transition-all hover:shadow-md">
            <div className={`w-12 h-12 ${iconStyles[variant]} rounded-xl flex items-center justify-center mb-6`}>
                <Icon className="w-6 h-6" />
            </div>
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</h4>
            <p className={`text-2xl font-bold tracking-tight mb-1 font-mono ${valueStyles[variant]}`}>{value}</p>
        </div>
    )
}

function SummaryMiniCard({ title, amount, count }: any) {
    return (
        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 group hover:bg-white hover:shadow-md transition-all">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">{title}</h3>
            <p className="text-2xl font-bold text-slate-900 tracking-tight font-mono mb-2">
                {formatCurrency(amount)}
            </p>
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase">{count} Transactions</span>
                <span className="text-[10px] font-bold text-emerald-600 uppercase">Received</span>
            </div>
        </div>
    )
}

function StatusMiniCard({ status }: any) {
    const configs: any = {
        active: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', icon: Zap, label: 'Active' },
        closed: { bg: 'bg-slate-100', text: 'text-slate-900', border: 'border-slate-200', icon: Shield, label: 'Closed' },
        overdue: { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-200', icon: AlertTriangle, label: 'Overdue' },
        cancelled: { bg: 'bg-rose-50', text: 'text-rose-400', border: 'border-rose-100', icon: Activity, label: 'Cancelled' },
    }

    const config = configs[status.status] || configs.active
    const Icon = config.icon

    return (
        <div className={`${config.bg} ${config.border} border rounded-2xl p-6 transition-all hover:shadow-md`}>
            <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 bg-white ${config.text} rounded-lg shadow-sm flex items-center justify-center`}>
                    <Icon className="w-5 h-5" />
                </div>
                <span className={`text-[10px] font-bold ${config.text} uppercase tracking-widest`}>{config.label}</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 tracking-tight mb-4">{status.count}</p>
            <div className="pt-4 border-t border-slate-200/50">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Value</p>
                <p className="text-sm font-bold text-slate-900 font-mono">{formatCurrency(status.totalDisbursed)}</p>
            </div>
        </div>
    )
}