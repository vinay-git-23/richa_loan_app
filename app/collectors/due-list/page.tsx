'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
    ArrowLeft,
    Search,
    Calendar,
    MapPin,
    Phone,
    IndianRupee,
    AlertCircle,
    ChevronRight,
    TrendingUp,
    FileText,
    Clock
} from 'lucide-react'
import { formatCurrency } from '@/utils/calculations'
import { format } from 'date-fns'

interface DueItem {
    id: number
    tokenId: number
    tokenNo: string
    customerName: string
    customerMobile: string
    customerAddress: string | null
    scheduleDate: string
    amountDue: number
    installmentAmount: number
    penaltyAmount: number
    status: string
    isOverdue: boolean
}

interface Summary {
    totalCount: number
    totalAmount: number
    overdueCount: number
}

export default function DueListPage() {
    const { data: session, status: authStatus } = useSession()
    const router = useRouter()
    const [dueList, setDueList] = useState<DueItem[]>([])
    const [summary, setSummary] = useState<Summary | null>(null)
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        if (authStatus === 'loading') return
        if (!session || session.user.userType !== 'collector') {
            router.push('/login')
            return
        }
        fetchDueList()
    }, [session, authStatus])

    const fetchDueList = async () => {
        setLoading(true)
        try {
            const response = await fetch('/api/collectors/due-list')
            const result = await response.json()
            if (result.success) {
                setDueList(result.data)
                setSummary(result.summary)
            }
        } catch (error) {
            console.error('Failed to fetch due list:', error)
        } finally {
            setLoading(false)
        }
    }

    const filteredList = dueList.filter(item =>
        item.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tokenNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.customerMobile.includes(searchQuery)
    )

    if (loading && dueList.length === 0) {
        return (
            <div className="flex items-center justify-center h-screen bg-white">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans">
            {/* Header */}
            <div className="bg-[#0F172A] pt-8 pb-16 px-6 relative overflow-hidden text-white">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>

                <div className="relative z-10 flex items-center gap-4 mb-6">
                    <button
                        onClick={() => router.push('/collectors/dashboard')}
                        className="p-2 bg-slate-800/50 rounded-xl border border-slate-700/50 text-slate-300 hover:text-white transition-colors backdrop-blur-sm"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-xl font-bold tracking-tight">Today's Due List</h1>
                </div>

                <div className="relative z-10 bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10 shadow-2xl flex items-center justify-between">
                    <div>
                        <p className="text-blue-300 text-[10px] font-black uppercase tracking-widest mb-1">Total Due Volume</p>
                        <p className="text-3xl font-black">{formatCurrency(summary?.totalAmount || 0)}</p>
                    </div>
                    <div className="text-right">
                        <div className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-[10px] font-black border border-red-500/20">
                            {summary?.overdueCount || 0} OVERDUE
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="px-5 -mt-6 mb-6 relative z-10">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                        <input
                            type="text"
                            placeholder="Find by name, token or mobile..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-inner"
                        />
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="px-5 space-y-4">
                {filteredList.length === 0 ? (
                    <div className="bg-white rounded-2xl p-10 text-center border border-slate-100">
                        <AlertCircle className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">No due tasks found</p>
                    </div>
                ) : (
                    filteredList.map((item) => (
                        <div key={item.id} className={`bg-white rounded-2xl shadow-sm border overflow-hidden active:scale-[0.98] transition-all ${item.isOverdue ? 'border-red-100' : 'border-slate-100'}`}>
                            <div className="p-4">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${item.isOverdue ? 'bg-red-50 border-red-100 text-red-600' : 'bg-slate-50 border-slate-100 text-slate-600'}`}>
                                            <Calendar className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-slate-900 tracking-tight">{item.customerName}</p>
                                            <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                                                <Phone className="w-3 h-3" />
                                                {item.customerMobile}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-lg font-black ${item.isOverdue ? 'text-red-600' : 'text-slate-900'}`}>{formatCurrency(item.amountDue)}</p>
                                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{item.tokenNo}</p>
                                    </div>
                                </div>

                                {item.customerAddress && (
                                    <div className="flex items-start gap-1.5 p-2 bg-slate-50 rounded-lg border border-slate-100 mb-4">
                                        <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5" />
                                        <p className="text-[10px] text-slate-500 font-medium line-clamp-1">{item.customerAddress}</p>
                                    </div>
                                )}

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${item.isOverdue ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'}`}>
                                            {item.isOverdue ? 'Overdue' : 'Today'}
                                        </span>
                                        {item.penaltyAmount > 0 && (
                                            <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border border-orange-200">
                                                +{formatCurrency(item.penaltyAmount)} Penalty
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => router.push(`/collectors/payment?token=${item.tokenId}`)}
                                        className="px-5 py-2.5 bg-blue-600 text-white text-[11px] font-black rounded-xl shadow-lg shadow-blue-500/30 hover:bg-black transition-all active:scale-95 flex items-center gap-2"
                                    >
                                        RECORD <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Nav */}
            <div className="fixed bottom-6 left-5 right-5 z-50">
                <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-3xl p-3 shadow-2xl flex items-center justify-around">
                    <button onClick={() => router.push('/collectors/dashboard')} className="flex flex-col items-center gap-1.5 text-slate-500">
                        <div className="p-2 hover:bg-white/5 rounded-2xl transition-all"><TrendingUp className="w-5 h-5" /></div>
                        <span className="text-[10px] font-bold uppercase tracking-widest">Home</span>
                    </button>
                    <button onClick={() => router.push('/collectors/tokens')} className="flex flex-col items-center gap-1.5 text-slate-500">
                        <div className="p-2 hover:bg-white/5 rounded-2xl transition-all"><FileText className="w-5 h-5" /></div>
                        <span className="text-[10px] font-bold uppercase tracking-widest">Tokens</span>
                    </button>
                    <button onClick={() => router.push('/collectors/payment')} className="flex flex-col items-center gap-1.5 text-slate-500">
                        <div className="p-2 hover:bg-white/5 rounded-2xl transition-all"><IndianRupee className="w-5 h-5 transition-all" /></div>
                        <span className="text-[10px] font-bold uppercase tracking-widest">Pay</span>
                    </button>
                    <button onClick={() => router.push('/collectors/history')} className="flex flex-col items-center gap-1.5 text-slate-500 transition-all">
                        <div className="p-2 hover:bg-white/5 rounded-2xl transition-all"><Clock className="w-5 h-5 transition-all" /></div>
                        <span className="text-[10px] font-bold uppercase tracking-widest">History</span>
                    </button>
                </div>
            </div>
        </div>
    )
}
