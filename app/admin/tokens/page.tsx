'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Plus, Eye, Calendar, IndianRupee, User, TrendingUp, Shield, Briefcase, ChevronRight, Activity, Clock } from 'lucide-react'
import { formatCurrency } from '@/utils/calculations'
import { format } from 'date-fns'

interface TokenBatch {
    id: number
    batchNo: string
    quantity: number
    loanAmount: number
    totalBatchAmount: number
    totalDailyAmount: number
    durationDays: number
    startDate: string
    endDate: string
    status: string
    customer: {
        name: string
        mobile: string
    }
    collector: {
        name: string
        collectorId: string
    }
    tokens: {
        id: number
        tokenNo: string
        status: string
    }[]
    batchSchedules: {
        scheduleDate: string
        totalDue: number
        paidAmount: number
    }[]
}

export default function TokensPage() {
    const router = useRouter()
    const [batches, setBatches] = useState<TokenBatch[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [filterStatus, setFilterStatus] = useState<string>('all')
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)

    useEffect(() => {
        fetchBatches()
    }, [page, search, filterStatus])

    const fetchBatches = async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                pageSize: '20',
            })

            if (search) params.append('search', search)
            if (filterStatus !== 'all') params.append('status', filterStatus)

            const response = await fetch(`/api/token-batches?${params}`)
            const result = await response.json()

            if (result.success) {
                setBatches(result.data)
                setTotalPages(result.pagination?.totalPages || 1)
            }
        } catch (error) {
            console.error('Failed to fetch token batches:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleViewDetails = (batchId: number) => {
        router.push(`/admin/token-batches/${batchId}`)
    }

    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Token Batches</h1>
                    <p className="text-slate-500 text-sm mt-1">Monitor and manage all token batches treated as unified loan entities.</p>
                </div>
                <button
                    onClick={() => router.push('/admin/tokens/create')}
                    className="flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white rounded-xl font-bold text-sm transition-all hover:bg-orange-600 active:scale-95 shadow-md"
                >
                    <Plus className="w-5 h-5" />
                    New Batch
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by batch ID, customer or mobile..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value)
                                setPage(1)
                            }}
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-slate-900 font-medium placeholder:text-slate-400 transition-all text-sm"
                        />
                    </div>

                    <div className="relative min-w-[200px]">
                        <select
                            value={filterStatus}
                            onChange={(e) => {
                                setFilterStatus(e.target.value)
                                setPage(1)
                            }}
                            className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-slate-900 font-bold text-xs uppercase tracking-widest appearance-none transition-all cursor-pointer"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="closed">Closed</option>
                            <option value="overdue">Overdue</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                        <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90 pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* Batches Content */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex flex-col items-center justify-center p-20 gap-4">
                        <div className="w-12 h-12 border-4 border-slate-100 border-t-orange-600 rounded-full animate-spin"></div>
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 animate-pulse">Syncing Batches...</p>
                    </div>
                ) : batches.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-20 text-slate-400 text-center">
                        <Activity className="w-12 h-12 text-slate-200 mb-4" />
                        <p className="text-lg font-bold text-slate-900">No Token Batches Found</p>
                        <p className="text-sm text-slate-500 mt-1">Try adjusting your search or filters.</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-slate-50/50 border-b border-slate-100">
                                        <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            Batch Details
                                        </th>
                                        <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            Customer
                                        </th>
                                        <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            Quantity
                                        </th>
                                        <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            Daily Collection
                                        </th>
                                        <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            Total Amount
                                        </th>
                                        <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            Status
                                        </th>
                                        <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {batches.map((batch) => {
                                        const nextDue = batch.batchSchedules?.[0]
                                        return (
                                            <tr key={batch.id} className="group hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center text-orange-600 font-bold text-xs border border-orange-100 group-hover:bg-orange-600 group-hover:text-white transition-all">
                                                            {batch.quantity}x
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-slate-900">{batch.batchNo}</p>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                                                {format(new Date(batch.startDate), 'dd MMM')} - {format(new Date(batch.endDate), 'dd MMM yyyy')}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-900 uppercase">{batch.customer.name}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 tracking-wider mt-0.5">{batch.customer.mobile}</p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div>
                                                        <p className="text-sm font-bold text-purple-600">{batch.quantity} Tokens</p>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                                            {formatCurrency(batch.loanAmount)} each
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div>
                                                        <p className="text-sm font-bold text-blue-600 font-mono">
                                                            {formatCurrency(batch.totalDailyAmount)}
                                                        </p>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                                            {batch.durationDays} Days
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-900 font-mono">
                                                            {formatCurrency(batch.totalBatchAmount)}
                                                        </p>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                                            Combined
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span
                                                        className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${batch.status === 'active'
                                                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                                            : batch.status === 'closed'
                                                                ? 'bg-slate-100 text-slate-400 border border-slate-200'
                                                                : batch.status === 'overdue'
                                                                    ? 'bg-rose-50 text-rose-600 border border-rose-100'
                                                                    : 'bg-amber-50 text-amber-600 border border-amber-100'
                                                            }`}
                                                    >
                                                        <div className={`w-1.5 h-1.5 rounded-full mr-2 ${batch.status === 'active' ? 'bg-emerald-500' : batch.status === 'overdue' ? 'bg-rose-500' : 'bg-slate-300'}`}></div>
                                                        {batch.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5 text-right">
                                                    <button
                                                        onClick={() => handleViewDetails(batch.id)}
                                                        className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
                                                        title="View Details"
                                                    >
                                                        <Eye className="w-5 h-5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {totalPages > 1 && (
                            <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    Page {page} of {totalPages}
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-[10px] font-bold uppercase tracking-widest text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-all shadow-sm"
                                    >
                                        Previous
                                    </button>
                                    <button
                                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                        disabled={page === totalPages}
                                        className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-[10px] font-bold uppercase tracking-widest text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-all shadow-sm"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}