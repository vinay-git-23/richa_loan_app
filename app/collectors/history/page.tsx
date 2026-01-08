'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Search, Calendar, IndianRupee, Clock, TrendingUp, FileText, ChevronRight, Wallet } from 'lucide-react'
import { formatCurrency } from '@/utils/calculations'
import { format } from 'date-fns'

interface HistoryRecord {
    id: number
    amount: number
    paymentDate: string
    paymentMode: string
    remarks: string
    tokenNo: string
    customerName: string
    customerMobile: string
}

export default function HistoryPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [history, setHistory] = useState<HistoryRecord[]>([])
    const [loading, setLoading] = useState(true)
    const [range, setRange] = useState('today')
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        if (status === 'loading') return

        if (!session || session?.user?.userType !== 'collector') {
            router.push('/login')
            return
        }
        fetchHistory()
    }, [session, status, range])

    const fetchHistory = async () => {
        setLoading(true)
        try {
            const response = await fetch(`/api/collectors/history?range=${range}`)
            const result = await response.json()

            if (result.success) {
                setHistory(result.data)
            }
        } catch (error) {
            console.error('Failed to fetch history:', error)
        } finally {
            setLoading(false)
        }
    }

    const filteredHistory = history.filter(item =>
        item.tokenNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.customerMobile.includes(searchQuery)
    )

    const totalAmount = filteredHistory.reduce((sum, item) => sum + item.amount, 0)

    if (loading && history.length === 0) {
        return (
            <div className="flex items-center justify-center h-screen bg-white">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans">
            {/* Professional Header - Lighter Orange Theme */}
            <div className="bg-gradient-to-br from-orange-500 to-orange-400 pt-8 pb-16 px-6 relative overflow-hidden text-white">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>

                <div className="relative z-10 flex items-center gap-4 mb-6">
                    <button
                        onClick={() => router.push('/collectors/dashboard')}
                        className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors backdrop-blur-sm"
                    >
                        <ArrowLeft className="w-5 h-5 text-white" />
                    </button>
                    <h1 className="text-xl font-black tracking-tight">Collection History</h1>
                </div>

                <div className="relative z-10 bg-white/20 backdrop-blur-md rounded-2xl p-5 border border-white/30 shadow-2xl flex items-center justify-between">
                    <div>
                        <p className="text-orange-100 text-[10px] font-black uppercase tracking-widest mb-1">Total {range}</p>
                        <p className="text-3xl font-black">{formatCurrency(totalAmount)}</p>
                    </div>
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shadow-lg border border-white/30">
                        <IndianRupee className="w-6 h-6 text-white" />
                    </div>
                </div>
            </div>

            {/* Premium Filters */}
            <div className="px-5 -mt-6 mb-6 relative z-10">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 space-y-4">
                    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                        {['today', 'yesterday', 'week', 'all'].map((r) => (
                            <button
                                key={r}
                                onClick={() => setRange(r)}
                                className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${range === r
                                        ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/30'
                                        : 'bg-slate-50 text-slate-500 border-slate-100 hover:border-slate-300'
                                    }`}
                            >
                                {r}
                            </button>
                        ))}
                    </div>

                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                        <input
                            type="text"
                            placeholder="Find collections..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-inner"
                        />
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="px-5 space-y-4">
                {filteredHistory.length === 0 ? (
                    <div className="bg-white rounded-2xl p-10 text-center border border-slate-100">
                        <Clock className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">No recent entries</p>
                    </div>
                ) : (
                    filteredHistory.map((item) => (
                        <div key={item.id} className="bg-white rounded-2xl shadow-sm p-4 border border-slate-100 active:scale-[0.98] transition-all">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex gap-3">
                                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100">
                                        <TrendingUp className="w-5 h-5 text-slate-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-slate-900 tracking-tight">{item.tokenNo}</p>
                                        <p className="text-[11px] text-slate-500 font-medium">{item.customerName}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-black text-green-600">{formatCurrency(item.amount)}</p>
                                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-tighter">{item.paymentMode}</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                                    <Calendar className="w-3.5 h-3.5" />
                                    <span className="uppercase tracking-tight">{format(new Date(item.paymentDate), 'dd MMM, hh:mm a')}</span>
                                </div>
                                {item.remarks && (
                                    <p className="text-[10px] text-slate-400 font-medium truncate max-w-[120px] bg-slate-50 px-2 py-0.5 rounded-md italic">
                                        "{item.remarks}"
                                    </p>
                                )}
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
