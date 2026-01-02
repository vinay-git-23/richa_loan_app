'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    AlertTriangle,
    Calendar,
    IndianRupee,
    User,
    Clock,
    TrendingUp,
    Filter,
    X,
    CheckCircle,
    Ban,
    RefreshCw
} from 'lucide-react'
import { formatCurrency } from '@/utils/calculations'
import { format, differenceInDays } from 'date-fns'

interface OverdueSchedule {
    id: number
    tokenId: number
    scheduleDate: string
    installmentAmount: number
    penaltyAmount: number
    totalDue: number
    paidAmount: number
    status: string
    token: {
        tokenNo: string
        customer: {
            name: string
            mobile: string
        }
        collector: {
            name: string
        }
    }
}

interface PenaltyStats {
    totalOverdue: number
    totalPenaltyApplied: number
    averageOverdueDays: number
    totalSchedules: number
}

export default function OverdueManagementPage() {
    const router = useRouter()
    const [schedules, setSchedules] = useState<OverdueSchedule[]>([])
    const [stats, setStats] = useState<PenaltyStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [showPenaltyModal, setShowPenaltyModal] = useState(false)
    const [selectedSchedule, setSelectedSchedule] = useState<OverdueSchedule | null>(null)

    useEffect(() => {
        fetchOverdueSchedules()
    }, [statusFilter])

    const fetchOverdueSchedules = async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            if (statusFilter !== 'all') {
                params.append('status', statusFilter)
            }

            const response = await fetch(`/api/overdue-schedules?${params}`)
            const result = await response.json()

            if (result.success) {
                setSchedules(result.data)
                setStats(result.stats)
            }
        } catch (error) {
            console.error('Failed to fetch overdue schedules:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleApplyPenalty = (schedule: OverdueSchedule) => {
        setSelectedSchedule(schedule)
        setShowPenaltyModal(true)
    }

    const handleWaivePenalty = async (scheduleId: number) => {
        if (!confirm('Are you sure you want to waive the penalty for this schedule?')) {
            return
        }

        try {
            const response = await fetch(`/api/schedules/${scheduleId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ penaltyAmount: 0 })
            })

            if (response.ok) {
                alert('Penalty waived successfully')
                fetchOverdueSchedules()
            } else {
                alert('Failed to waive penalty')
            }
        } catch (error) {
            alert('Failed to waive penalty')
        }
    }

    const calculateOverdueDays = (scheduleDate: string) => {
        return differenceInDays(new Date(), new Date(scheduleDate))
    }

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Overdue Management</h1>
                <p className="text-slate-500 text-sm mt-1">Monitor and manage overdue payments and penalties.</p>
            </div>

            {/* Stats Grid */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="Total Overdue"
                        value={stats.totalSchedules}
                        subtitle="Pending schedules"
                        icon={AlertTriangle}
                        variant="danger"
                    />
                    <StatCard
                        title="Total Penalty"
                        value={formatCurrency(stats.totalPenaltyApplied)}
                        subtitle="Applied penalties"
                        icon={IndianRupee}
                        variant="warning"
                    />
                    <StatCard
                        title="Outstanding"
                        value={formatCurrency(stats.totalOverdue)}
                        subtitle="Total overdue amount"
                        icon={TrendingUp}
                        variant="neutral"
                    />
                    <StatCard
                        title="Avg. Overdue"
                        value={`${Math.round(stats.averageOverdueDays)} Days`}
                        subtitle="Average delay"
                        icon={Clock}
                        variant="info"
                    />
                </div>
            )}

            {/* Filters */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                    <Filter className="w-5 h-5 text-slate-400" />
                    <h3 className="text-sm font-bold text-slate-900">Filter Schedules</h3>
                </div>
                <div className="flex gap-2 flex-wrap">
                    {['all', 'overdue', 'partial'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                                statusFilter === status
                                    ? 'bg-orange-600 text-white shadow-md'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            {status === 'all' ? 'All' : status}
                        </button>
                    ))}
                </div>
            </div>

            {/* Overdue Schedules Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-3">
                                <AlertTriangle className="w-5 h-5 text-orange-600" />
                                Overdue Schedules
                            </h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                {schedules.length} overdue payment{schedules.length !== 1 ? 's' : ''} found
                            </p>
                        </div>
                        <button
                            onClick={fetchOverdueSchedules}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-all"
                            title="Refresh"
                        >
                            <RefreshCw className="w-5 h-5 text-slate-400" />
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center p-20 gap-4">
                        <div className="w-12 h-12 border-4 border-slate-100 border-t-orange-600 rounded-full animate-spin"></div>
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 animate-pulse">Loading schedules...</p>
                    </div>
                ) : schedules.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-20 text-slate-400 text-center">
                        <CheckCircle className="w-12 h-12 text-emerald-200 mb-4" />
                        <p className="text-lg font-bold text-slate-900">No Overdue Schedules</p>
                        <p className="text-sm text-slate-500 mt-1">All payments are up to date!</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50/30 border-b border-slate-100">
                                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        Customer / Token
                                    </th>
                                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        Due Date
                                    </th>
                                    <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        Installment
                                    </th>
                                    <th className="px-6 py-4 text-right text-[10px] font-bold text-orange-600 uppercase tracking-widest">
                                        Penalty
                                    </th>
                                    <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        Total Due
                                    </th>
                                    <th className="px-6 py-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        Status
                                    </th>
                                    <th className="px-6 py-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        Overdue Days
                                    </th>
                                    <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {schedules.map((schedule) => {
                                    const overdueDays = calculateOverdueDays(schedule.scheduleDate)
                                    const balance = Number(schedule.totalDue) - Number(schedule.paidAmount)

                                    return (
                                        <tr
                                            key={schedule.id}
                                            className="group hover:bg-slate-50/50 transition-colors cursor-pointer"
                                            onClick={() => router.push(`/admin/tokens/${schedule.tokenId}`)}
                                        >
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                                        <User className="w-3 h-3 text-slate-400" />
                                                        {schedule.token.customer.name}
                                                    </p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                                        {schedule.token.tokenNo}
                                                    </p>
                                                    <p className="text-xs text-slate-500 mt-1">
                                                        {schedule.token.customer.mobile}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-rose-400" />
                                                    <span className="text-sm font-bold text-slate-900">
                                                        {format(new Date(schedule.scheduleDate), 'dd MMM yyyy')}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <p className="text-sm font-bold text-slate-900 font-mono">
                                                    {formatCurrency(schedule.installmentAmount)}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <p className="text-sm font-bold text-orange-600 font-mono">
                                                    {formatCurrency(schedule.penaltyAmount)}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <p className="text-base font-bold text-slate-900 font-mono">
                                                    {formatCurrency(balance)}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-center">
                                                    <span
                                                        className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                                                            schedule.status === 'overdue'
                                                                ? 'bg-rose-50 text-rose-600 border border-rose-100'
                                                                : 'bg-amber-50 text-amber-600 border border-amber-100'
                                                        }`}
                                                    >
                                                        {schedule.status}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-center">
                                                    <span
                                                        className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold ${
                                                            overdueDays > 30
                                                                ? 'bg-rose-100 text-rose-700'
                                                                : overdueDays > 7
                                                                ? 'bg-orange-100 text-orange-700'
                                                                : 'bg-amber-100 text-amber-700'
                                                        }`}
                                                    >
                                                        {overdueDays} {overdueDays === 1 ? 'day' : 'days'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleApplyPenalty(schedule)}
                                                        className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
                                                        title="Apply Penalty"
                                                    >
                                                        <IndianRupee className="w-4 h-4" />
                                                    </button>
                                                    {schedule.penaltyAmount > 0 && (
                                                        <button
                                                            onClick={() => handleWaivePenalty(schedule.id)}
                                                            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                                            title="Waive Penalty"
                                                        >
                                                            <Ban className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Penalty Modal */}
            {showPenaltyModal && selectedSchedule && (
                <PenaltyModal
                    schedule={selectedSchedule}
                    onClose={() => {
                        setShowPenaltyModal(false)
                        setSelectedSchedule(null)
                    }}
                    onSuccess={() => {
                        setShowPenaltyModal(false)
                        setSelectedSchedule(null)
                        fetchOverdueSchedules()
                    }}
                />
            )}
        </div>
    )
}

function StatCard({ title, value, subtitle, icon: Icon, variant }: any) {
    const styles = {
        neutral: 'bg-zinc-900 text-white border-zinc-900',
        danger: 'bg-white text-slate-600 border-slate-200',
        warning: 'bg-white text-slate-600 border-slate-200',
        info: 'bg-white text-slate-600 border-slate-200',
    } as any

    const iconStyles = {
        neutral: 'bg-zinc-800 text-orange-500',
        danger: 'bg-rose-50 text-rose-600',
        warning: 'bg-orange-50 text-orange-600',
        info: 'bg-blue-50 text-blue-600',
    } as any

    const valueStyles = {
        neutral: 'text-white',
        danger: 'text-rose-600',
        warning: 'text-orange-600',
        info: 'text-blue-600',
    } as any

    return (
        <div className={`rounded-2xl p-6 border shadow-sm ${styles[variant]}`}>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${iconStyles[variant]}`}>
                <Icon className="w-6 h-6" />
            </div>
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</h4>
            <p className={`text-2xl font-bold tracking-tight mb-3 font-mono ${valueStyles[variant]}`}>{value}</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none pt-4 border-t border-slate-100/10">
                {subtitle}
            </p>
        </div>
    )
}

function PenaltyModal({
    schedule,
    onClose,
    onSuccess,
}: {
    schedule: OverdueSchedule
    onClose: () => void
    onSuccess: () => void
}) {
    const [penaltyAmount, setPenaltyAmount] = useState(schedule.penaltyAmount.toString())
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const response = await fetch(`/api/schedules/${schedule.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ penaltyAmount: parseFloat(penaltyAmount) })
            })

            if (response.ok) {
                onSuccess()
            } else {
                alert('Failed to apply penalty')
            }
        } catch (error) {
            alert('Failed to apply penalty')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Apply Penalty</h2>
                        <p className="text-slate-500 text-xs mt-1">Adjust penalty for this overdue schedule</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 bg-slate-50 border-b border-slate-100">
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                            <span className="text-slate-500">Customer:</span>
                            <span className="font-bold text-slate-900">{schedule.token.customer.name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">Token:</span>
                            <span className="font-bold text-slate-900">{schedule.token.tokenNo}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">Installment:</span>
                            <span className="font-bold text-slate-900">{formatCurrency(schedule.installmentAmount)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">Current Penalty:</span>
                            <span className="font-bold text-orange-600">{formatCurrency(schedule.penaltyAmount)}</span>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <div className="space-y-2 mb-6">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                            New Penalty Amount (₹)
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            required
                            value={penaltyAmount}
                            onChange={(e) => setPenaltyAmount(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-slate-900 font-bold transition-all text-lg"
                        />
                    </div>

                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-xs uppercase tracking-widest transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-[2] px-4 py-3 bg-orange-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-orange-700 transition-all disabled:opacity-50"
                        >
                            {loading ? 'Applying...' : 'Apply Penalty'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
