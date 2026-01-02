'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
    ArrowLeft,
    User,
    Phone,
    Calendar,
    IndianRupee,
    TrendingUp,
    AlertTriangle,
    CheckCircle2,
    Clock,
    XCircle,
    Printer,
    Edit,
    Plus,
    Activity,
    Shield,
    Zap,
    Target
} from 'lucide-react'
import { formatCurrency } from '@/utils/calculations'
import { format } from 'date-fns'

interface TokenDetails {
    id: number
    tokenNo: string
    loanAmount: number
    interestRate: number
    interestAmount: number
    totalAmount: number
    duration: number
    dailyAmount: number
    startDate: string
    endDate: string
    status: string
    createdAt: string
    customer: {
        id: number
        name: string
        mobile: string
        address: string | null
    }
    collector: {
        id: number
        name: string
        collectorId: string
    }
    schedules: Array<{
        id: number
        scheduleDate: string
        totalDue: number
        paidAmount: number
        status: string
        paymentDate: string | null
    }>
    payments: Array<{
        id: number
        amount: number
        paymentMode: string
        paymentDate: string
        remarks: string | null
        collector: {
            name: string
        }
    }>
    stats: {
        totalPaid: number
        outstanding: number
        paidSchedules: number
        overdueSchedules: number
        pendingSchedules: number
        totalSchedules: number
    }
}

export default function TokenDetailsPage() {
    const params = useParams()
    const router = useRouter()
    const tokenId = params.id as string

    const [token, setToken] = useState<TokenDetails | null>(null)
    const [loading, setLoading] = useState(true)
    const [showPaymentModal, setShowPaymentModal] = useState(false)
    const [showStatusModal, setShowStatusModal] = useState(false)
    const [updatingStatus, setUpdatingStatus] = useState(false)

    useEffect(() => {
        fetchTokenDetails()
    }, [tokenId])

    const fetchTokenDetails = async () => {
        setLoading(true)
        try {
            const response = await fetch(`/api/tokens/${tokenId}`)
            const result = await response.json()

            if (result.success) {
                setToken(result.data)
            } else {
                alert('Failed to load token details')
                router.push('/admin/tokens')
            }
        } catch (error) {
            console.error('Failed to fetch token:', error)
            alert('Failed to load token details')
            router.push('/admin/tokens')
        } finally {
            setLoading(false)
        }
    }

    const handlePrint = () => {
        window.print()
    }

    const handleStatusChange = async (newStatus: string) => {
        if (!confirm(`Are you sure you want to change token status to "${newStatus.toUpperCase()}"?`)) {
            return
        }

        setUpdatingStatus(true)
        try {
            const response = await fetch(`/api/tokens/${tokenId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            })

            const result = await response.json()

            if (response.ok) {
                alert(result.message || 'Token status updated successfully')
                fetchTokenDetails()
                setShowStatusModal(false)
            } else {
                alert(result.error || 'Failed to update token status')
            }
        } catch (error) {
            alert('Failed to update token status')
        } finally {
            setUpdatingStatus(false)
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="w-12 h-12 border-4 border-slate-100 border-t-orange-600 rounded-full animate-spin"></div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 animate-pulse">Loading Token Details...</p>
            </div>
        )
    }

    if (!token) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400 p-10 text-center">
                <AlertTriangle className="w-12 h-12 text-slate-200 mb-4" />
                <p className="text-lg font-bold text-slate-900">Token Not Found</p>
                <p className="text-sm text-slate-500 mt-1">The requested token record could not be found.</p>
            </div>
        )
    }

    const progressPercent = (token.stats.totalPaid / token.totalAmount) * 100

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 print:hidden">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 text-slate-400 hover:text-slate-900 transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Token Details</span>
                            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                            <span className="text-[10px] font-bold text-orange-600 uppercase tracking-widest">{token.tokenNo}</span>
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Token Summary</h1>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 bg-white text-slate-600 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95"
                    >
                        <Printer className="w-4 h-4" />
                        Print Report
                    </button>
                    <button
                        onClick={() => setShowPaymentModal(true)}
                        className="flex items-center gap-2 px-6 py-2.5 bg-zinc-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-orange-600 shadow-md transition-all active:scale-95"
                    >
                        <Plus className="w-5 h-5" />
                        Record Payment
                    </button>
                </div>
            </div>

            {/* Quick Status & Status Management */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm print:hidden">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex flex-wrap items-center gap-3">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${token.status === 'active'
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                            : token.status === 'closed'
                                ? 'bg-slate-100 text-slate-400 border border-slate-200'
                                : token.status === 'overdue'
                                    ? 'bg-rose-50 text-rose-600 border-rose-100'
                                    : 'bg-amber-50 text-amber-600 border-amber-100'
                            }`}>
                            <Zap className="w-3 h-3 mr-2" />
                            Status: {token.status}
                        </span>
                        <span className="inline-flex items-center px-3 py-1 bg-white border border-slate-200 rounded-full text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            <Calendar className="w-3 h-3 text-orange-500 mr-2" />
                            Created: {format(new Date(token.createdAt), 'dd MMM yyyy')}
                        </span>
                    </div>

                    {/* Status Management Actions */}
                    <div className="flex flex-wrap items-center gap-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-2">Change Status:</p>
                        {token.status !== 'active' && (
                            <button
                                onClick={() => handleStatusChange('active')}
                                disabled={updatingStatus}
                                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
                            >
                                Reactivate
                            </button>
                        )}
                        {token.status !== 'closed' && (
                            <button
                                onClick={() => handleStatusChange('closed')}
                                disabled={updatingStatus}
                                className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
                            >
                                Close Token
                            </button>
                        )}
                        {token.status !== 'cancelled' && (
                            <button
                                onClick={() => handleStatusChange('cancelled')}
                                disabled={updatingStatus}
                                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                        )}
                        {token.status !== 'overdue' && token.stats.overdueSchedules > 0 && (
                            <button
                                onClick={() => handleStatusChange('overdue')}
                                disabled={updatingStatus}
                                className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
                            >
                                Mark Overdue
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Loan Amount"
                    value={formatCurrency(token.loanAmount)}
                    subtitle={`Interest: ${formatCurrency(token.interestAmount)} (${token.interestRate}%)`}
                    icon={IndianRupee}
                    variant="neutral"
                />
                <StatCard
                    title="Total Paid"
                    value={formatCurrency(token.stats.totalPaid)}
                    subtitle={`${token.stats.paidSchedules} of ${token.stats.totalSchedules} Installments`}
                    icon={CheckCircle2}
                    variant="success"
                />
                <StatCard
                    title="Outstanding"
                    value={formatCurrency(token.stats.outstanding)}
                    subtitle={`${token.stats.pendingSchedules} Pending Installments`}
                    icon={TrendingUp}
                    variant="warning"
                />
                <StatCard
                    title="Overdue"
                    value={token.stats.overdueSchedules}
                    subtitle="Defaulted installments"
                    icon={AlertTriangle}
                    variant="danger"
                />
            </div>

            {/* Progress */}
            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 tracking-tight">Payment Progress</h3>
                        <p className="text-slate-500 text-xs mt-1">Tracking payment completion percentage.</p>
                    </div>
                    <div className="bg-orange-50 px-4 py-2 rounded-xl border border-orange-100">
                        <span className="text-xl font-bold text-orange-600 tracking-tight">{progressPercent.toFixed(1)}%</span>
                    </div>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden border border-slate-200 p-0.5">
                    <div
                        className="bg-orange-500 h-full rounded-full transition-all duration-1000 ease-out shadow-sm"
                        style={{ width: `${progressPercent}%` }}
                    ></div>
                </div>
                <div className="flex justify-between mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <span>START: {formatCurrency(0)}</span>
                    <span>TOTAL PAYABLE: {formatCurrency(token.totalAmount)}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Customer Details */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden group">
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                        <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-3">
                            <User className="w-5 h-5 text-orange-600" />
                            Customer Details
                        </h3>
                    </div>
                    <div className="p-8 space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Customer Name</p>
                                <p className="text-sm font-bold text-slate-900 uppercase">{token.customer.name}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mobile Number</p>
                                <div className="flex items-center gap-2 text-sm font-bold text-slate-900 font-mono">
                                    <Phone className="w-3 h-3 text-slate-400" />
                                    {token.customer.mobile}
                                </div>
                            </div>
                        </div>
                        {token.customer.address && (
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Address</p>
                                <p className="text-sm font-medium text-slate-600 leading-relaxed italic">{token.customer.address}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Collector Details */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden group">
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                        <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-3">
                            <Shield className="w-5 h-5 text-slate-900" />
                            Collector Details
                        </h3>
                    </div>
                    <div className="p-8 space-y-6">
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Assigned Collector</p>
                            <p className="text-sm font-bold text-slate-900 uppercase">{token.collector.name}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Collector ID</p>
                            <p className="text-sm font-bold text-slate-500 font-mono uppercase tracking-widest">
                                {token.collector.collectorId}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Timeline */}
            <div className="bg-zinc-900 rounded-2xl p-8 text-white shadow-lg overflow-hidden relative">
                <div className="flex items-center gap-3 mb-8 relative z-10">
                    <Target className="w-5 h-5 text-orange-500" />
                    <h3 className="text-lg font-bold tracking-tight">Loan Timeline</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 relative z-10">
                    <DetailItem label="Duration" value={`${token.duration} Days`} />
                    <DetailItem label="Daily Payment" value={formatCurrency(token.dailyAmount)} />
                    <DetailItem label="Start Date" value={format(new Date(token.startDate), 'dd MMM yyyy')} />
                    <DetailItem label="End Date" value={format(new Date(token.endDate), 'dd MMM yyyy')} />
                </div>
            </div>

            {/* Payment Schedule */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-bold text-slate-900">Payment Schedule</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Daily payment installments tracking.</p>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-50/30">
                                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Due Date</th>
                                <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Installment</th>
                                <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest text-emerald-600">Paid</th>
                                <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest text-orange-600">Due</th>
                                <th className="px-6 py-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest print:hidden">Payment Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {token.schedules.map((schedule) => {
                                const balance = Number(schedule.totalDue) - Number(schedule.paidAmount)
                                return (
                                    <tr key={schedule.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 text-xs font-bold text-slate-900 uppercase">
                                            {format(new Date(schedule.scheduleDate), 'dd MMM yyyy')}
                                        </td>
                                        <td className="px-6 py-4 text-right text-xs font-bold text-slate-700 font-mono">
                                            {formatCurrency(schedule.totalDue)}
                                        </td>
                                        <td className="px-6 py-4 text-right text-xs font-bold text-emerald-600 font-mono">
                                            {formatCurrency(schedule.paidAmount)}
                                        </td>
                                        <td className="px-6 py-4 text-right text-xs font-bold text-orange-600 font-mono">
                                            {formatCurrency(balance)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-center">
                                                <span
                                                    className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${schedule.status === 'paid'
                                                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                        : schedule.status === 'partial'
                                                            ? 'bg-amber-50 text-amber-600 border-amber-100'
                                                            : schedule.status === 'overdue'
                                                                ? 'bg-rose-50 text-rose-600 border-rose-100'
                                                                : 'bg-slate-100 text-slate-400 border border-slate-200'
                                                        }`}
                                                >
                                                    {schedule.status}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest print:hidden font-mono">
                                            {schedule.paymentDate ? format(new Date(schedule.paymentDate), 'dd.MM.yy') : '-'}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Payment History */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-3">
                        <IndianRupee className="w-5 h-5 text-emerald-600" />
                        Payment History
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">View all recorded payments for this token.</p>
                </div>
                {token.payments.length === 0 ? (
                    <div className="p-16 text-center">
                        <Activity className="w-12 h-12 mx-auto mb-4 text-slate-100" />
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No payments recorded</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50/30">
                                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Timestamp</th>
                                    <th className="px-6 py-4 text-right text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Amount</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mode</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Collector</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Remarks</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {token.payments.map((payment) => (
                                    <tr key={payment.id} className="hover:bg-emerald-50/30 transition-colors">
                                        <td className="px-6 py-4 text-xs font-bold text-slate-900 uppercase">
                                            {format(new Date(payment.paymentDate), 'dd MMM yyyy, hh:mm a')}
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm font-bold text-emerald-600 font-mono">
                                            {formatCurrency(payment.amount)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex px-2 py-0.5 rounded-lg bg-slate-100 text-[10px] font-bold uppercase text-slate-600 border border-slate-200">
                                                {payment.paymentMode}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-bold text-slate-900 uppercase">{payment.collector.name}</td>
                                        <td className="px-6 py-4 text-[10px] font-medium text-slate-500 italic max-w-xs truncate">{payment.remarks || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* record payment modal */}
            {showPaymentModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 border border-slate-200">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600 border border-orange-100">
                                <Activity className="w-6 h-6 animate-pulse" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">Record Payment</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Redirecting to payments</p>
                            </div>
                        </div>

                        <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 mb-8">
                            <p className="text-slate-600 text-sm font-medium leading-relaxed">
                                Please proceed to the payments page to record a transaction for Token <span className="text-orange-600 font-bold">{token.tokenNo}</span>.
                            </p>
                        </div>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => router.push('/admin/payments')}
                                className="w-full py-4 bg-zinc-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-orange-600 transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                            >
                                <Zap className="w-4 h-4" />
                                Go to Payments
                            </button>
                            <button
                                onClick={() => setShowPaymentModal(false)}
                                className="w-full py-4 bg-slate-100 text-slate-500 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

function StatCard({ title, value, subtitle, icon: Icon, variant }: any) {
    const styles = {
        neutral: 'bg-zinc-900 text-white border-zinc-900',
        success: 'bg-white text-slate-600 border-slate-200',
        warning: 'bg-white text-slate-600 border-slate-200',
        danger: 'bg-white text-slate-600 border-slate-200',
    } as any

    const iconStyles = {
        neutral: 'bg-zinc-800 text-orange-500',
        success: 'bg-emerald-50 text-emerald-600',
        warning: 'bg-amber-50 text-amber-600',
        danger: 'bg-rose-50 text-rose-600',
    } as any

    const valueStyles = {
        neutral: 'text-white',
        success: 'text-emerald-600',
        warning: 'text-orange-600',
        danger: 'text-rose-600',
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

function DetailItem({ label, value }: any) {
    return (
        <div className="space-y-1">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{label}</p>
            <p className="text-lg font-bold text-white tracking-tight">{value}</p>
        </div>
    )
}