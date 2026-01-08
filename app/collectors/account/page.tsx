'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
    Wallet,
    TrendingUp,
    TrendingDown,
    IndianRupee,
    FileText,
    Clock,
    ArrowDown,
    ArrowUp,
    Calendar,
    Search,
    Filter,
    Download,
    Package,
    X,
    ArrowLeft
} from 'lucide-react'
import { formatCurrency } from '@/utils/calculations'
import { format } from 'date-fns'

interface AccountTransaction {
    id: number
    transactionType: 'credit' | 'debit'
    amount: number
    balanceAfter: number
    description: string | null
    referenceType: string | null
    transactionDate: string
    createdAt: string
}

interface AccountStats {
    currentBalance: number
    totalCredits: number
    totalDebits: number
    todayCredits: number
    todayDebits: number
}

export default function CollectorAccountPage() {
    const { data: session, status: authStatus } = useSession()
    const router = useRouter()
    const [transactions, setTransactions] = useState<AccountTransaction[]>([])
    const [stats, setStats] = useState<AccountStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [showDebitModal, setShowDebitModal] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [typeFilter, setTypeFilter] = useState<'all' | 'credit' | 'debit'>('all')
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)

    useEffect(() => {
        if (authStatus === 'loading') return
        if (!session || session?.user?.userType !== 'collector') {
            router.push('/login')
            return
        }
        fetchAccountData()
    }, [session, authStatus, page, typeFilter, startDate, endDate])

    const fetchAccountData = async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                pageSize: '50'
            })
            if (typeFilter !== 'all') params.append('type', typeFilter)
            if (startDate) params.append('startDate', startDate)
            if (endDate) params.append('endDate', endDate)

            const response = await fetch(`/api/collectors/account?${params}`)
            const result = await response.json()

            if (result.success) {
                setTransactions(result.data.transactions || [])
                setStats(result.data.stats)
                setTotalPages(result.data.pagination?.totalPages || 1)
            }
        } catch (error) {
            console.error('Failed to fetch account data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleDebitSuccess = () => {
        setShowDebitModal(false)
        fetchAccountData()
    }

    const filteredTransactions = transactions.filter(tx => {
        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            return (
                tx.description?.toLowerCase().includes(query) ||
                tx.referenceType?.toLowerCase().includes(query) ||
                formatCurrency(tx.amount).toLowerCase().includes(query)
            )
        }
        return true
    })

    if (loading && !stats) {
        return (
            <div className="flex items-center justify-center h-screen bg-gradient-to-br from-orange-50 to-slate-50">
                <div className="relative">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-orange-600"></div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-50 pb-32 font-sans text-slate-900">
            {/* Header with Back Arrow */}
            <div className="bg-gradient-to-br from-orange-500 via-orange-400 to-orange-500 pt-8 pb-20 px-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>

                <div className="relative z-10 mb-6">
                    <div className="flex items-center gap-4 mb-4">
                        <button
                            onClick={() => router.push('/collectors/dashboard')}
                            className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-all backdrop-blur-sm"
                        >
                            <ArrowLeft className="w-5 h-5 text-white" />
                        </button>
                        <div className="flex items-center gap-3">
                            <Wallet className="w-6 h-6 text-white" />
                            <h1 className="text-xl font-black text-white tracking-tight">My Account</h1>
                        </div>
                    </div>
                    <p className="text-orange-100 text-xs font-black uppercase tracking-widest ml-12">Account Balance & Transaction History</p>
                </div>

                        {/* Balance Card */}
                        {stats && (
                            <div className="relative z-10 bg-white/20 backdrop-blur-md rounded-3xl p-6 border border-white/30 shadow-2xl">
                        <div className="text-center mb-6">
                            <p className="text-orange-100 text-xs font-black uppercase tracking-widest mb-2">Current Balance</p>
                            <p className="text-5xl font-black text-white mb-1">
                                {formatCurrency(stats.currentBalance)}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                            <div className="text-center">
                                <div className="flex items-center justify-center gap-2 mb-1">
                                    <TrendingUp className="w-4 h-4 text-white" />
                                    <p className="text-xs font-black text-orange-100 uppercase tracking-widest">Total Credits</p>
                                </div>
                                <p className="text-lg font-black text-white">{formatCurrency(stats.totalCredits)}</p>
                            </div>
                            <div className="text-center">
                                <div className="flex items-center justify-center gap-2 mb-1">
                                    <TrendingDown className="w-4 h-4 text-white" />
                                    <p className="text-xs font-black text-orange-100 uppercase tracking-widest">Total Debits</p>
                                </div>
                                <p className="text-lg font-black text-white">{formatCurrency(stats.totalDebits)}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="px-5 -mt-8 relative z-10 space-y-6">
                {/* Quick Stats */}
                {stats && (
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white rounded-2xl p-5 shadow-lg border-2 border-slate-100">
                            <div className="flex items-center gap-2 mb-2">
                                <ArrowUp className="w-5 h-5 text-emerald-500" />
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Today Credits</p>
                            </div>
                            <p className="text-2xl font-black text-slate-900">{formatCurrency(stats.todayCredits)}</p>
                        </div>
                        <div className="bg-white rounded-2xl p-5 shadow-lg border-2 border-slate-100">
                            <div className="flex items-center gap-2 mb-2">
                                <ArrowDown className="w-5 h-5 text-red-500" />
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Today Debits</p>
                            </div>
                            <p className="text-2xl font-black text-slate-900">{formatCurrency(stats.todayDebits)}</p>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="bg-white rounded-2xl p-5 shadow-lg border-2 border-slate-100 space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                        <Filter className="w-5 h-5 text-orange-600" />
                        <h3 className="text-sm font-black text-slate-900">Filters</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search transactions..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none font-medium text-sm"
                            />
                        </div>

                        <select
                            value={typeFilter}
                            onChange={(e) => {
                                setTypeFilter(e.target.value as any)
                                setPage(1)
                            }}
                            className="px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none font-bold text-sm"
                        >
                            <option value="all">All Transactions</option>
                            <option value="credit">Credits Only</option>
                            <option value="debit">Debits Only</option>
                        </select>

                        <div className="flex gap-2">
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => {
                                    setStartDate(e.target.value)
                                    setPage(1)
                                }}
                                className="flex-1 px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none font-bold text-sm"
                                placeholder="Start Date"
                            />
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => {
                                    setEndDate(e.target.value)
                                    setPage(1)
                                }}
                                className="flex-1 px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none font-bold text-sm"
                                placeholder="End Date"
                            />
                        </div>
                    </div>
                </div>

                {/* Transaction History */}
                <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-lg overflow-hidden">
                    <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                        <div>
                            <h3 className="text-sm font-black text-slate-900 flex items-center gap-3">
                                <FileText className="w-5 h-5 text-orange-600" />
                                Transaction History
                            </h3>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">
                                {filteredTransactions.length} Transactions
                            </p>
                        </div>
                    </div>

                    <div className="p-5 space-y-3">
                        {filteredTransactions.length === 0 ? (
                            <div className="text-center py-10 text-slate-400">
                                <Wallet className="w-12 h-12 mx-auto mb-3 text-slate-200" />
                                <p className="text-sm font-black">No transactions found</p>
                                <p className="text-xs mt-1 font-medium">Your transaction history will appear here</p>
                            </div>
                        ) : (
                            <>
                                {filteredTransactions.map((transaction) => (
                                    <div
                                        key={transaction.id}
                                        className="bg-slate-50 rounded-2xl p-4 border-2 border-slate-100"
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 ${
                                                    transaction.transactionType === 'credit'
                                                        ? 'bg-emerald-50 border-emerald-200'
                                                        : 'bg-red-50 border-red-200'
                                                }`}>
                                                    {transaction.transactionType === 'credit' ? (
                                                        <ArrowUp className="w-6 h-6 text-emerald-600" />
                                                    ) : (
                                                        <ArrowDown className="w-6 h-6 text-red-600" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className={`text-lg font-black ${
                                                        transaction.transactionType === 'credit' ? 'text-emerald-600' : 'text-red-600'
                                                    }`}>
                                                        {transaction.transactionType === 'credit' ? '+' : '-'}{formatCurrency(transaction.amount)}
                                                    </p>
                                                    <p className="text-xs text-slate-500 font-bold">
                                                        {format(new Date(transaction.transactionDate), 'dd MMM yyyy, hh:mm a')}
                                                    </p>
                                                    {transaction.description && (
                                                        <p className="text-xs text-slate-600 font-medium mt-1">{transaction.description}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Balance</p>
                                                <p className="text-sm font-black text-slate-900">{formatCurrency(transaction.balanceAfter)}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="flex items-center justify-center gap-2 pt-4 border-t border-slate-200">
                                        <button
                                            onClick={() => setPage(p => Math.max(1, p - 1))}
                                            disabled={page === 1}
                                            className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Previous
                                        </button>
                                        <span className="px-4 py-2 text-sm font-black text-slate-600">
                                            Page {page} of {totalPages}
                                        </span>
                                        <button
                                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                            disabled={page === totalPages}
                                            className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Next
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Debit Button */}
            {stats && stats.currentBalance > 0 && (
                <div className="px-5 pb-4">
                    <button
                        onClick={() => setShowDebitModal(true)}
                        className="w-full py-4 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-xl shadow-orange-500/30 active:scale-95 transition-all hover:from-orange-700 hover:to-orange-600"
                    >
                        <ArrowDown className="w-5 h-5" />
                        DEBIT FROM ACCOUNT
                    </button>
                </div>
            )}

            {/* Debit Modal */}
            {showDebitModal && (
                <DebitModal
                    onClose={() => setShowDebitModal(false)}
                    onSuccess={handleDebitSuccess}
                    currentBalance={stats?.currentBalance || 0}
                />
            )}

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
                            <Package className="w-5 h-5" />
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
                        className="flex flex-col items-center gap-1 text-orange-600"
                    >
                        <div className="p-2.5 rounded-2xl bg-orange-50 border-2 border-orange-200">
                            <Wallet className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest">Account</span>
                    </button>
                    <button
                        onClick={() => router.push('/collectors/history')}
                        className="flex flex-col items-center gap-1 text-slate-400"
                    >
                        <div className="p-2.5 rounded-2xl">
                            <Clock className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest">History</span>
                    </button>
                </div>
            </div>
        </div>
    )
}

function DebitModal({ onClose, onSuccess, currentBalance }: { onClose: () => void; onSuccess: () => void; currentBalance: number }) {
    const [amount, setAmount] = useState('')
    const [description, setDescription] = useState('')
    const [toAdmin, setToAdmin] = useState(true) // Default to admin
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        if (!amount || parseFloat(amount) <= 0) {
            setError('Please enter a valid amount')
            setLoading(false)
            return
        }

        if (parseFloat(amount) > currentBalance) {
            setError(`Insufficient balance. Available: ${formatCurrency(currentBalance)}`)
            setLoading(false)
            return
        }

        try {
            const response = await fetch('/api/collectors/account/debit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: parseFloat(amount),
                    description: description || 'Manual debit',
                    toAdmin: toAdmin
                })
            })

            const result = await response.json()

            if (response.ok && result.success) {
                onSuccess()
            } else {
                setError(result.error || 'Failed to process debit')
            }
        } catch (err) {
            setError('Network error occurred')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-xl max-w-lg w-full overflow-hidden border-2 border-slate-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-black text-slate-900">Debit from Account</h2>
                        <p className="text-slate-500 text-xs mt-1 font-medium">Withdraw amount from your account</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="p-4 bg-red-50 border-2 border-red-100 rounded-2xl text-red-600 text-xs font-black flex items-center gap-3">
                            <X className="w-4 h-4 shrink-0" />
                            {error}
                        </div>
                    )}

                    <div className="bg-slate-50 rounded-2xl p-4 border-2 border-slate-200">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Available Balance</p>
                        <p className="text-2xl font-black text-slate-900">{formatCurrency(currentBalance)}</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                            Debit Amount (₹) <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2">
                                <IndianRupee className="w-5 h-5 text-orange-600" />
                            </div>
                            <input
                                type="number"
                                step="0.01"
                                required
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                max={currentBalance}
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-slate-900 font-black transition-all text-lg"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                            Transfer To
                        </label>
                        <div className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200 rounded-2xl p-4">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={toAdmin}
                                    onChange={(e) => setToAdmin(e.target.checked)}
                                    className="w-5 h-5 text-orange-600 border-2 border-orange-300 rounded focus:ring-2 focus:ring-orange-500/20 cursor-pointer"
                                />
                                <div className="flex-1">
                                    <p className="text-sm font-black text-slate-900">Credit to Admin Account</p>
                                    <p className="text-xs text-slate-600 font-medium mt-0.5">Amount will be credited to admin account</p>
                                </div>
                            </label>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                            Description (Optional)
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-slate-900 font-medium transition-all resize-none"
                            placeholder="Add description for this debit..."
                        />
                    </div>

                    <div className="flex gap-4 pt-4 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-[2] px-4 py-3 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:from-orange-700 hover:to-orange-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-orange-500/30 active:scale-95"
                        >
                            {loading ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                'Process Debit'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
