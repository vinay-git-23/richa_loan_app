'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
    ArrowLeft,
    AlertCircle,
    TrendingUp,
    FileText,
    IndianRupee,
    Clock,
    ChevronRight,
    Gavel,
    User,
    Calendar,
    Wallet
} from 'lucide-react'
import { formatCurrency } from '@/utils/calculations'
import { format } from 'date-fns'

interface PenaltyItem {
    id: number
    tokenId: number
    tokenNo: string
    customerName: string
    customerMobile: string
    scheduleDate: string
    penaltyAmount: number
    totalDue: number
    status: string
}

export default function PenaltiesPage() {
    const { data: session, status: authStatus } = useSession()
    const router = useRouter()
    const [penalties, setPenalties] = useState<PenaltyItem[]>([])
    const [totalPenalty, setTotalPenalty] = useState(0)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (authStatus === 'loading') return
        if (!session || session.user.userType !== 'collector') {
            router.push('/login')
            return
        }
        fetchPenalties()
    }, [session, authStatus])

    const fetchPenalties = async () => {
        setLoading(true)
        try {
            const response = await fetch('/api/collectors/penalties')
            const result = await response.json()
            if (result.success) {
                setPenalties(result.data)
                setTotalPenalty(result.totalPenalty)
            }
        } catch (error) {
            console.error('Failed to fetch penalties:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading && penalties.length === 0) {
        return (
            <div className="flex items-center justify-center h-screen bg-white">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans">
            {/* Header - Lighter Orange Theme */}
            <div className="bg-gradient-to-br from-orange-500 to-orange-400 pt-8 pb-16 px-6 relative overflow-hidden text-white">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>

                <div className="relative z-10 flex items-center gap-4 mb-6">
                    <button
                        onClick={() => router.push('/collectors/dashboard')}
                        className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors backdrop-blur-sm"
                    >
                        <ArrowLeft className="w-5 h-5 text-white" />
                    </button>
                    <h1 className="text-xl font-black tracking-tight">Penalty Cases</h1>
                </div>

                <div className="relative z-10 bg-white/20 backdrop-blur-md rounded-2xl p-5 border border-white/30 shadow-2xl flex items-center justify-between">
                    <div>
                        <p className="text-orange-100 text-[10px] font-black uppercase tracking-widest mb-1">Total Penalty Amount</p>
                        <p className="text-3xl font-black">{formatCurrency(totalPenalty)}</p>
                    </div>
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shadow-lg border border-white/30">
                        <Gavel className="w-6 h-6 text-white" />
                    </div>
                </div>
            </div>

            {/* Warning Info */}
            <div className="px-5 -mt-6 mb-6 relative z-10">
                <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0" />
                    <p className="text-[10px] font-bold text-orange-800 uppercase tracking-tight leading-relaxed">
                        These penalties are applied to overdue installments. Collect these amounts during the next payment cycle.
                    </p>
                </div>
            </div>

            {/* List */}
            <div className="px-5 space-y-4">
                {penalties.length === 0 ? (
                    <div className="bg-white rounded-2xl p-10 text-center border border-slate-100">
                        <CheckCircle className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">No penalty cases found</p>
                    </div>
                ) : (
                    penalties.map((item) => (
                        <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden active:scale-[0.98] transition-all hover:border-orange-200">
                            <div className="p-4">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex gap-3">
                                        <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center border border-orange-100 text-orange-600">
                                            <User className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-slate-900 tracking-tight">{item.customerName}</p>
                                            <p className="text-[11px] text-slate-500 font-medium">{item.tokenNo}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-tighter border border-orange-200">
                                            +{formatCurrency(item.penaltyAmount)}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                                        <Calendar className="w-3.5 h-3.5" />
                                        <span className="uppercase tracking-tight">Due Since: {format(new Date(item.scheduleDate), 'dd MMM yyyy')}</span>
                                    </div>
                                    <button
                                        onClick={() => router.push(`/collectors/payment?token=${item.tokenId}`)}
                                        className="px-5 py-2.5 bg-slate-900 text-white text-[11px] font-black rounded-xl hover:bg-black transition-all active:scale-95 flex items-center gap-2"
                                    >
                                        SETTLE <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Fixed Bottom Menu - Consistent with other pages */}
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t-2 border-slate-200 shadow-2xl">
                <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-around">
                    <button
                        onClick={() => router.push('/collectors/dashboard')}
                        className="flex flex-col items-center gap-1 text-slate-400"
                    >
                        <div className="p-2.5 rounded-2xl">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest">Home</span>
                    </button>
                    <button
                        onClick={() => router.push('/collectors/tokens')}
                        className="flex flex-col items-center gap-1 text-slate-400"
                    >
                        <div className="p-2.5 rounded-2xl">
                            <FileText className="w-5 h-5" />
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
                        className="flex flex-col items-center gap-1 text-orange-600"
                    >
                        <div className="p-2.5 rounded-2xl bg-orange-50 border-2 border-orange-200">
                            <Clock className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest">History</span>
                    </button>
                </div>
            </div>
        </div>
    )
}

function CheckCircle(props: any) {
    return (
        <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    )
}
