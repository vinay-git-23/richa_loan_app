'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
    ArrowLeft,
    User,
    Phone,
    MapPin,
    Calendar,
    IndianRupee,
    CheckCircle,
    Clock,
    XCircle,
    TrendingUp,
    ChevronRight,
    CreditCard,
    FileText,
    History,
    AlertTriangle
} from 'lucide-react'
import { formatCurrency } from '@/utils/calculations'
import { format } from 'date-fns'

interface TokenDetails {
    id: number
    tokenNo: string
    totalAmount: number
    paidAmount: number
    dailyInstallment: number
    duration: number
    status: string
    startDate: string
    endDate: string
    customer: {
        name: string
        mobile: string
        address: string
    }
    schedules: Array<{
        id: number
        scheduleDate: string
        totalDue: number
        paidAmount: number
        status: string
        lastPaymentDate: string | null
    }>
    payments: Array<{
        id: number
        amount: number
        paymentMode: string
        paymentDate: string
        remarks: string
        photoUrl: string | null
    }>
}

export default function TokenDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { data: session, status: authStatus } = useSession()
    const router = useRouter()
    const [token, setToken] = useState<TokenDetails | null>(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'schedule' | 'history'>('schedule')
    const [tokenId, setTokenId] = useState<string | null>(null)

    useEffect(() => {
        params.then(p => setTokenId(p.id))
    }, [params])

    useEffect(() => {
        if (authStatus === 'loading' || !tokenId) return

        if (!session || session?.user?.userType !== 'collector') {
            router.push('/login')
            return
        }
        fetchTokenDetails()
    }, [session, authStatus, tokenId])

    const fetchTokenDetails = async () => {
        if (!tokenId) return

        setLoading(true)
        try {
            const response = await fetch(`/api/collectors/tokens/${tokenId}`)
            const result = await response.json()

            if (result.success) {
                setToken(result.data)
            } else {
                router.push('/collectors/tokens')
            }
        } catch (error) {
            console.error('Failed to fetch token details:', error)
            router.push('/collectors/tokens')
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-white">
                <div className="relative">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
                </div>
            </div>
        )
    }

    if (!token) {
        return (
            <div className="flex items-center justify-center h-screen text-gray-500 flex-col gap-4">
                <AlertTriangle className="w-12 h-12 text-red-400" />
                <p>Token not found</p>
                <button onClick={() => router.back()} className="text-blue-600 font-bold">Go Back</button>
            </div>
        )
    }

    const progress = (token.paidAmount / token.totalAmount) * 100
    const remaining = token.totalAmount - token.paidAmount

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'active':
                return 'bg-green-500/10 text-green-500 border-green-500/20'
            case 'overdue':
                return 'bg-red-500/10 text-red-500 border-red-500/20'
            case 'closed':
                return 'bg-slate-500/10 text-white border-slate-500/20'
            default:
                return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
        }
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-32 font-sans text-slate-900">
            {/* Professional Header */}
            <div className="bg-[#0F172A] pt-8 pb-20 px-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>

                <div className="relative z-10 flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="p-2 bg-slate-800/50 rounded-xl border border-slate-700/50 text-slate-300 hover:text-white transition-all backdrop-blur-sm"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-white tracking-tight">{token.tokenNo}</h1>
                            <p className="text-blue-300 text-[10px] font-black uppercase tracking-widest mt-0.5">Loan Details</p>
                        </div>
                    </div>
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${getStatusStyle(token.status)}`}>
                        {token.status}
                    </span>
                </div>

                {/* Progress Card (Glassmorphic) */}
                <div className="relative z-10 bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10 shadow-2xl">
                    <div className="flex justify-between items-end mb-4">
                        <div>
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Collection Progress</p>
                            <p className="text-3xl font-black text-white mt-1">
                                {progress.toFixed(1)}%
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Balance</p>
                            <p className="text-lg font-bold text-blue-300">{formatCurrency(remaining)}</p>
                        </div>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-3 mb-2 overflow-hidden border border-white/5">
                        <div
                            className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(59,130,246,0.3)]"
                            style={{ width: `${Math.min(progress, 100)}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            <div className="px-5 -mt-8 relative z-10 space-y-6">
                {/* Customer Profile Card */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                    <div className="flex items-start gap-4">
                        <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 flex-shrink-0">
                            <User className="w-7 h-7 text-slate-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2 className="text-lg font-black text-slate-900 truncate">{token.customer.name}</h2>
                            <div className="flex items-center gap-1.5 mt-1 text-slate-500">
                                <Phone className="w-4 h-4" />
                                <span className="text-sm font-bold tracking-tight">{token.customer.mobile}</span>
                            </div>
                            {token.customer.address && (
                                <div className="flex items-start gap-1.5 mt-2 p-2 bg-slate-50 rounded-lg border border-slate-100">
                                    <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                                    <span className="text-[10px] text-slate-500 font-medium leading-relaxed">{token.customer.address}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Daily Installment</p>
                        <p className="text-xl font-black text-slate-900">{formatCurrency(token.dailyInstallment)}</p>
                    </div>
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Loan</p>
                        <p className="text-xl font-black text-slate-900">{formatCurrency(token.totalAmount)}</p>
                    </div>
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                        <div className="flex items-center gap-1.5 mb-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Start Date</p>
                        </div>
                        <p className="text-sm font-black text-slate-700">{format(new Date(token.startDate), 'dd MMM yyyy')}</p>
                    </div>
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                        <div className="flex items-center gap-1.5 mb-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Duration</p>
                        </div>
                        <p className="text-sm font-black text-slate-700">{token.duration} Days</p>
                    </div>
                </div>

                {/* Premium Tabs */}
                <div className="space-y-4">
                    <div className="bg-slate-200/50 p-1.5 rounded-2xl flex gap-1.5">
                        <button
                            onClick={() => setActiveTab('schedule')}
                            className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'schedule'
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <Calendar className="w-4 h-4" />
                            SCHEDULE
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'history'
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <History className="w-4 h-4" />
                            HISTORY
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div className="space-y-3">
                        {activeTab === 'schedule' ? (
                            token.schedules.map((schedule, idx) => (
                                <div
                                    key={schedule.id}
                                    className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center justify-between group transition-all hover:border-blue-100"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${schedule.status === 'paid'
                                                ? 'bg-green-50 border-green-100 text-green-600'
                                                : schedule.status === 'overdue'
                                                    ? 'bg-red-50 border-red-100 text-red-600'
                                                    : 'bg-slate-50 border-slate-100 text-slate-400'
                                            }`}>
                                            {schedule.status === 'paid' ? <CheckCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-slate-900 uppercase tracking-tight">Day {idx + 1}</p>
                                            <p className="text-[10px] text-slate-400 font-bold">{format(new Date(schedule.scheduleDate), 'dd MMM yyyy')}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-black text-slate-900">{formatCurrency(schedule.totalDue)}</p>
                                        <span className={`text-[9px] font-black uppercase tracking-tighter ${schedule.status === 'paid' ? 'text-green-600' : 'text-slate-400'
                                            }`}>
                                            {schedule.status}
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            token.payments.length === 0 ? (
                                <div className="bg-white rounded-2xl p-10 text-center border border-slate-100 italic text-slate-400 text-sm">
                                    No payments recorded yet
                                </div>
                            ) : (
                                token.payments.map((payment) => (
                                    <div
                                        key={payment.id}
                                        className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 group transition-all hover:border-blue-100"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex gap-3">
                                                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100 text-blue-600">
                                                    <IndianRupee className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{payment.paymentMode}</p>
                                                    <p className="text-[10px] text-slate-400 font-bold">{format(new Date(payment.paymentDate), 'dd MMM, hh:mm a')}</p>
                                                </div>
                                            </div>
                                            <p className="text-lg font-black text-green-600">{formatCurrency(payment.amount)}</p>
                                        </div>
                                        {payment.remarks && (
                                            <div className="mt-2 text-[10px] text-slate-500 bg-slate-50 p-2 rounded-lg italic">
                                                "{payment.remarks}"
                                            </div>
                                        )}
                                    </div>
                                ))
                            )
                        )}
                    </div>
                </div>
            </div>

            {/* Sticky Action Footer */}
            {token.status !== 'closed' && (
                <div className="fixed bottom-0 left-0 right-0 p-5 bg-white/80 backdrop-blur-md border-t border-slate-100 z-50">
                    <button
                        onClick={() => router.push(`/collectors/payment?token=${token.id}`)}
                        className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-xl shadow-blue-600/20 active:scale-95 transition-all hover:bg-black"
                    >
                        RECORD PAYMENT
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            )}
        </div>
    )
}