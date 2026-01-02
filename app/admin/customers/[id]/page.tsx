'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
    ArrowLeft,
    Phone,
    MapPin,
    CreditCard,
    FileText,
    IndianRupee,
    TrendingUp,
    AlertTriangle,
    CheckCircle2,
    Clock,
    Calendar,
    Briefcase,
    Image as ImageIcon,
    Download,
    ZoomIn,
    X
} from 'lucide-react'
import { formatCurrency } from '@/utils/calculations'
import { format } from 'date-fns'

interface CustomerDetails {
    id: number
    name: string
    mobile: string
    address: string | null
    aadhaar: string | null
    photoUrl: string | null
    isActive: boolean
    createdAt: string
    tokens: Array<{
        id: number
        tokenNo: string
        loanAmount: number
        totalAmount: number
        status: string
        startDate: string
        endDate: string
        dailyInstallment: number
        payments: Array<{
            amount: number
        }>
        schedules: Array<{
            status: string
        }>
    }>
}

export default function CustomerDetailPage() {
    const params = useParams()
    const router = useRouter()
    const customerId = params.id as string

    const [customer, setCustomer] = useState<CustomerDetails | null>(null)
    const [loading, setLoading] = useState(true)
    const [showPhotoModal, setShowPhotoModal] = useState(false)

    useEffect(() => {
        fetchCustomerDetails()
    }, [customerId])

    const fetchCustomerDetails = async () => {
        setLoading(true)
        try {
            const response = await fetch(`/api/customers/${customerId}`)
            const result = await response.json()

            if (result.success) {
                setCustomer(result.data)
            } else {
                alert('Failed to load customer details')
                router.push('/admin/customers')
            }
        } catch (error) {
            console.error('Failed to fetch customer:', error)
            alert('Failed to load customer details')
            router.push('/admin/customers')
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="w-12 h-12 border-4 border-slate-100 border-t-orange-600 rounded-full animate-spin"></div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 animate-pulse">Loading Customer Details...</p>
            </div>
        )
    }

    if (!customer) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400 p-10 text-center">
                <AlertTriangle className="w-12 h-12 text-slate-200 mb-4" />
                <p className="text-lg font-bold text-slate-900">Customer Not Found</p>
                <p className="text-sm text-slate-500 mt-1">The requested customer record could not be found.</p>
            </div>
        )
    }

    // Calculate statistics
    const totalBorrowed = customer.tokens.reduce((sum, t) => sum + Number(t.totalAmount), 0)
    const totalPaid = customer.tokens.reduce((sum, t) => {
        const tokenPaid = t.payments.reduce((pSum, p) => pSum + Number(p.amount), 0)
        return sum + tokenPaid
    }, 0)
    const totalOutstanding = totalBorrowed - totalPaid
    const activeTokens = customer.tokens.filter(t => t.status === 'active' || t.status === 'overdue').length
    const overdueTokens = customer.tokens.filter(t => t.status === 'overdue').length
    const completedTokens = customer.tokens.filter(t => t.status === 'closed').length

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 text-slate-400 hover:text-slate-900 transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Customer Profile</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                customer.isActive
                                    ? 'bg-emerald-50 text-emerald-600'
                                    : 'bg-slate-100 text-slate-400'
                            }`}>
                                {customer.isActive ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight uppercase">{customer.name}</h1>
                    </div>
                </div>
            </div>

            {/* Customer Info & Photo Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Photo & Documents Card */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-3">
                            <ImageIcon className="w-5 h-5 text-orange-600" />
                            Photo & Documents
                        </h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                            Customer identification
                        </p>
                    </div>
                    <div className="p-6 space-y-6">
                        {/* Photo Section */}
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Customer Photo</p>
                            {customer.photoUrl ? (
                                <div className="relative group">
                                    <img
                                        src={customer.photoUrl}
                                        alt={customer.name}
                                        className="w-full aspect-[3/4] object-cover rounded-xl border-2 border-slate-200 shadow-md"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all rounded-xl flex items-center justify-center gap-3">
                                        <button
                                            onClick={() => setShowPhotoModal(true)}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity p-3 bg-white rounded-full shadow-xl hover:scale-110 active:scale-95"
                                        >
                                            <ZoomIn className="w-5 h-5 text-slate-900" />
                                        </button>
                                        <a
                                            href={customer.photoUrl}
                                            download={`${customer.name}_photo.jpg`}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity p-3 bg-white rounded-full shadow-xl hover:scale-110 active:scale-95"
                                        >
                                            <Download className="w-5 h-5 text-slate-900" />
                                        </a>
                                    </div>
                                </div>
                            ) : (
                                <div className="w-full aspect-[3/4] bg-slate-100 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-3">
                                    <ImageIcon className="w-12 h-12 text-slate-300" />
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No Photo</p>
                                </div>
                            )}
                        </div>

                        {/* Aadhaar Section */}
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Aadhaar Number</p>
                            {customer.aadhaar ? (
                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center gap-3">
                                    <CreditCard className="w-5 h-5 text-orange-600 flex-shrink-0" />
                                    <span className="text-lg font-bold font-mono text-slate-900">{customer.aadhaar}</span>
                                </div>
                            ) : (
                                <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-4 text-center">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Not Provided</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Customer Info Card */}
                <div className="lg:col-span-2 bg-zinc-900 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                    <div className="relative z-10 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-xs text-zinc-400 uppercase tracking-widest font-bold">
                                    <Phone className="w-4 h-4" />
                                    Mobile Number
                                </div>
                                <p className="text-2xl font-bold font-mono">{customer.mobile}</p>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-xs text-zinc-400 uppercase tracking-widest font-bold">
                                    <Calendar className="w-4 h-4" />
                                    Member Since
                                </div>
                                <p className="text-lg font-bold">{format(new Date(customer.createdAt), 'dd MMM yyyy')}</p>
                            </div>
                        </div>
                        {customer.address && (
                            <div className="space-y-2 pt-6 border-t border-white/10">
                                <div className="flex items-center gap-2 text-xs text-zinc-400 uppercase tracking-widest font-bold">
                                    <MapPin className="w-4 h-4" />
                                    Full Address
                                </div>
                                <p className="text-base font-medium text-zinc-100 leading-relaxed">{customer.address}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Borrowed"
                    value={formatCurrency(totalBorrowed)}
                    subtitle={`${customer.tokens.length} Total Tokens`}
                    icon={IndianRupee}
                    variant="neutral"
                />
                <StatCard
                    title="Total Paid"
                    value={formatCurrency(totalPaid)}
                    subtitle={`${completedTokens} Completed`}
                    icon={CheckCircle2}
                    variant="success"
                />
                <StatCard
                    title="Outstanding"
                    value={formatCurrency(totalOutstanding)}
                    subtitle={`${activeTokens} Active Tokens`}
                    icon={TrendingUp}
                    variant="warning"
                />
                <StatCard
                    title="Overdue Tokens"
                    value={overdueTokens}
                    subtitle="Requires attention"
                    icon={AlertTriangle}
                    variant="danger"
                />
            </div>

            {/* Token History */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-3">
                        <FileText className="w-5 h-5 text-orange-600" />
                        Token History
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                        Complete borrowing and repayment history
                    </p>
                </div>

                {customer.tokens.length === 0 ? (
                    <div className="p-20 text-center">
                        <Briefcase className="w-12 h-12 mx-auto mb-4 text-slate-100" />
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No tokens issued yet</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50/30">
                                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Token No</th>
                                    <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Loan Amount</th>
                                    <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Due</th>
                                    <th className="px-6 py-4 text-right text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Paid</th>
                                    <th className="px-6 py-4 text-right text-[10px] font-bold text-orange-600 uppercase tracking-widest">Balance</th>
                                    <th className="px-6 py-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">Progress</th>
                                    <th className="px-6 py-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Period</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {customer.tokens.map((token) => {
                                    const tokenPaid = token.payments.reduce((sum, p) => sum + Number(p.amount), 0)
                                    const balance = Number(token.totalAmount) - tokenPaid
                                    const progress = (tokenPaid / Number(token.totalAmount)) * 100
                                    const paidSchedules = token.schedules.filter(s => s.status === 'paid').length
                                    const totalSchedules = token.schedules.length

                                    return (
                                        <tr
                                            key={token.id}
                                            className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                                            onClick={() => router.push(`/admin/tokens/${token.id}`)}
                                        >
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-bold text-slate-900 uppercase">{token.tokenNo}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                                    {format(new Date(token.startDate), 'dd MMM yyyy')}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4 text-right text-sm font-bold text-slate-700 font-mono">
                                                {formatCurrency(token.loanAmount)}
                                            </td>
                                            <td className="px-6 py-4 text-right text-sm font-bold text-slate-900 font-mono">
                                                {formatCurrency(token.totalAmount)}
                                            </td>
                                            <td className="px-6 py-4 text-right text-sm font-bold text-emerald-600 font-mono">
                                                {formatCurrency(tokenPaid)}
                                            </td>
                                            <td className="px-6 py-4 text-right text-sm font-bold text-orange-600 font-mono">
                                                {formatCurrency(balance)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className="w-full max-w-[100px] bg-slate-100 rounded-full h-2 overflow-hidden">
                                                        <div
                                                            className="h-full bg-orange-500 rounded-full transition-all"
                                                            style={{ width: `${Math.min(progress, 100)}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-[10px] font-bold text-slate-400">
                                                        {paidSchedules}/{totalSchedules}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-center">
                                                    <span
                                                        className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                                                            token.status === 'active'
                                                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                                                : token.status === 'closed'
                                                                ? 'bg-slate-100 text-slate-400 border border-slate-200'
                                                                : token.status === 'overdue'
                                                                ? 'bg-rose-50 text-rose-600 border border-rose-100'
                                                                : 'bg-amber-50 text-amber-600 border border-amber-100'
                                                        }`}
                                                    >
                                                        {token.status}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                                    <Clock className="w-3 h-3" />
                                                    <span className="font-mono">{format(new Date(token.endDate), 'dd MMM yy')}</span>
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

            {/* Photo Zoom Modal */}
            {showPhotoModal && customer.photoUrl && (
                <div
                    className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
                    onClick={() => setShowPhotoModal(false)}
                >
                    <button
                        onClick={() => setShowPhotoModal(false)}
                        className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all"
                    >
                        <X className="w-6 h-6 text-white" />
                    </button>
                    <div className="max-w-4xl max-h-[90vh] relative" onClick={(e) => e.stopPropagation()}>
                        <img
                            src={customer.photoUrl}
                            alt={customer.name}
                            className="w-full h-full object-contain rounded-lg shadow-2xl"
                        />
                        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-white rounded-full shadow-xl">
                            <a
                                href={customer.photoUrl}
                                download={`${customer.name}_photo.jpg`}
                                className="flex items-center gap-2 px-6 py-3 text-sm font-bold text-slate-900 hover:bg-slate-50 rounded-full transition-all"
                            >
                                <Download className="w-5 h-5" />
                                Download Photo
                            </a>
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
