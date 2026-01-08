'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
    ArrowLeft,
    User,
    IndianRupee,
    TrendingUp,
    TrendingDown,
    Wallet,
    Calendar,
    CheckCircle,
    XCircle,
    Clock,
    RefreshCw,
    FileText
} from 'lucide-react'
import { formatCurrency } from '@/utils/calculations'
import { format } from 'date-fns'

interface CollectorDetails {
    id: number
    name: string
    collectorId: string
    mobile: string
    totalCollected: number
    totalDeposited: number
    currentBalance: number
    pendingDeposits: number
}

interface Transaction {
    id: number
    transactionType?: 'credit' | 'debit'
    amount: number
    balanceAfter?: number
    description?: string | null
    referenceType?: string | null
    transactionDate?: string
    depositDate?: string
    status?: string
    createdAt: string
    verifiedBy?: number | null
    verificationDate?: string | null
    receiptUrl?: string | null
    verifier?: {
        username: string
    } | null
}

export default function CollectorAccountDetailPage() {
    const router = useRouter()
    const params = useParams()
    const collectorId = parseInt(params.id as string)

    const [collector, setCollector] = useState<CollectorDetails | null>(null)
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchData()
    }, [collectorId])

    const fetchData = async () => {
        setLoading(true)
        try {
            const [collectorRes, transactionsRes, accountTransactionsRes] = await Promise.all([
                fetch(`/api/admin/collector-accounts?id=${collectorId}`),
                fetch(`/api/admin/collector-transactions/${collectorId}`),
                fetch(`/api/admin/collector-accounts/${collectorId}/transactions`).catch(() => ({ json: async () => ({ success: true, data: [] }) }))
            ])

            const collectorData = await collectorRes.json()
            const transactionsData = await transactionsRes.json()
            const accountTransactionsData = await accountTransactionsRes.json()

            if (collectorData.success) {
                setCollector(collectorData.data)
            }
            
            // Combine both old cash deposits and new account transactions
            const allTransactions: Transaction[] = []
            
            if (transactionsData.success && transactionsData.data) {
                allTransactions.push(...transactionsData.data.map((t: any) => ({
                    id: t.id,
                    amount: Number(t.amount || 0),
                    depositDate: t.depositDate,
                    status: t.status,
                    createdAt: t.createdAt,
                    verifiedBy: t.verifiedBy,
                    verificationDate: t.verificationDate,
                    receiptUrl: t.receiptUrl,
                    verifier: t.verifier
                })))
            }
            
            if (accountTransactionsData.success && accountTransactionsData.data?.transactions) {
                allTransactions.push(...accountTransactionsData.data.transactions.map((t: any) => ({
                    id: t.id + 1000000, // Offset to avoid ID conflicts
                    transactionType: t.transactionType,
                    amount: Number(t.amount || 0),
                    balanceAfter: Number(t.balanceAfter || 0),
                    description: t.description,
                    referenceType: t.referenceType,
                    transactionDate: t.transactionDate,
                    createdAt: t.createdAt,
                    status: 'verified' // Account transactions are always verified
                })))
            }
            
            // Sort by date (newest first)
            allTransactions.sort((a, b) => {
                const dateA = new Date(a.transactionDate || a.depositDate || a.createdAt).getTime()
                const dateB = new Date(b.transactionDate || b.depositDate || b.createdAt).getTime()
                return dateB - dateA
            })
            
            setTransactions(allTransactions)
        } catch (error) {
            console.error('Failed to fetch data:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="w-12 h-12 border-4 border-slate-100 border-t-orange-600 rounded-full animate-spin"></div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 animate-pulse">Loading...</p>
            </div>
        )
    }

    if (!collector) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <XCircle className="w-12 h-12 text-rose-400" />
                <p className="text-sm font-bold text-slate-600">Collector not found</p>
                <button
                    onClick={() => router.push('/admin/cash-management')}
                    className="px-6 py-2 bg-orange-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-orange-700 transition-all"
                >
                    Go Back
                </button>
            </div>
        )
    }

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => router.push('/admin/cash-management')}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-all"
                >
                    <ArrowLeft className="w-5 h-5 text-slate-400" />
                </button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{collector.name}</h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Collector ID: {collector.collectorId} • {collector.mobile}
                    </p>
                </div>
                <button
                    onClick={fetchData}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-all"
                    title="Refresh"
                >
                    <RefreshCw className="w-5 h-5 text-slate-400" />
                </button>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
                        <TrendingUp className="w-6 h-6 text-blue-600" />
                    </div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Collected</h4>
                    <p className="text-2xl font-bold tracking-tight font-mono text-slate-900">
                        {formatCurrency(collector.totalCollected)}
                    </p>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                    <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mb-4">
                        <CheckCircle className="w-6 h-6 text-emerald-600" />
                    </div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Deposited</h4>
                    <p className="text-2xl font-bold tracking-tight font-mono text-emerald-600">
                        {formatCurrency(collector.totalDeposited)}
                    </p>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                    <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center mb-4">
                        <Wallet className="w-6 h-6 text-orange-600" />
                    </div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Current Balance</h4>
                    <p className="text-2xl font-bold tracking-tight font-mono text-orange-600">
                        {formatCurrency(collector.currentBalance)}
                    </p>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                    <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center mb-4">
                        <Clock className="w-6 h-6 text-amber-600" />
                    </div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Pending Deposits</h4>
                    <p className="text-2xl font-bold tracking-tight font-mono text-amber-600">
                        {collector.pendingDeposits}
                    </p>
                </div>
            </div>

            {/* Transaction History */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-sm font-bold text-slate-900">Transaction History</h3>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                                All deposits and adjustments
                            </p>
                        </div>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            {transactions.length} Transactions
                        </div>
                    </div>
                </div>

                {transactions.length === 0 ? (
                    <div className="text-center py-20 text-slate-400">
                        <FileText className="w-12 h-12 mx-auto mb-3 text-slate-200" />
                        <p className="text-sm font-bold">No Transactions Yet</p>
                        <p className="text-xs mt-1">Transaction history will appear here</p>
                    </div>
                ) : (
                    <div className="p-6 space-y-4">
                        {transactions.map((transaction) => {
                            // Handle both old cash deposits and new account transactions
                            const isAccountTransaction = transaction.transactionType !== undefined
                            const isCredit = isAccountTransaction 
                                ? transaction.transactionType === 'credit'
                                : transaction.amount > 0
                            const isAdminTransaction = transaction.receiptUrl?.startsWith('Admin') || transaction.referenceType === 'admin_credit'
                            const transactionDate = transaction.transactionDate || transaction.depositDate || transaction.createdAt
                            const status = transaction.status || (isAccountTransaction ? 'verified' : 'pending')

                            return (
                                <div
                                    key={transaction.id}
                                    className="bg-slate-50 rounded-xl p-5 border border-slate-200 hover:border-slate-300 transition-all"
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-start gap-4">
                                            <div
                                                className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                                    status === 'verified'
                                                        ? isCredit
                                                            ? 'bg-emerald-50 border border-emerald-100'
                                                            : 'bg-rose-50 border border-rose-100'
                                                        : status === 'rejected'
                                                        ? 'bg-red-50 border border-red-100'
                                                        : 'bg-amber-50 border border-amber-100'
                                                }`}
                                            >
                                                {status === 'verified' ? (
                                                    isCredit ? (
                                                        <TrendingUp className="w-6 h-6 text-emerald-600" />
                                                    ) : (
                                                        <TrendingDown className="w-6 h-6 text-rose-600" />
                                                    )
                                                ) : status === 'rejected' ? (
                                                    <XCircle className="w-6 h-6 text-red-600" />
                                                ) : (
                                                    <Clock className="w-6 h-6 text-amber-600" />
                                                )}
                                            </div>
                                            <div>
                                                <p
                                                    className={`text-2xl font-black mb-1 ${
                                                        status === 'verified'
                                                            ? isCredit
                                                                ? 'text-emerald-600'
                                                                : 'text-rose-600'
                                                            : 'text-slate-900'
                                                    }`}
                                                >
                                                    {isCredit ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount))}
                                                </p>
                                                <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                                                    <Calendar className="w-3 h-3" />
                                                    {format(new Date(transactionDate), 'dd MMM yyyy, hh:mm a')}
                                                </div>
                                                {transaction.description && (
                                                    <p className="text-xs text-slate-600 font-medium max-w-md mb-1">
                                                        {transaction.description}
                                                    </p>
                                                )}
                                                {transaction.receiptUrl && !isAccountTransaction && (
                                                    <p className="text-xs text-slate-600 font-medium max-w-md">
                                                        {transaction.receiptUrl}
                                                    </p>
                                                )}
                                                {status === 'verified' && transaction.verifier && (
                                                    <p className="text-xs text-slate-400 mt-1">
                                                        Verified by {transaction.verifier.username} on{' '}
                                                        {transaction.verificationDate &&
                                                            format(new Date(transaction.verificationDate), 'dd MMM yyyy')}
                                                    </p>
                                                )}
                                                {transaction.balanceAfter !== undefined && (
                                                    <p className="text-xs text-slate-400 mt-1">
                                                        Balance: {formatCurrency(transaction.balanceAfter)}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span
                                                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                                                    status === 'verified'
                                                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                                        : status === 'rejected'
                                                        ? 'bg-red-50 text-red-600 border border-red-100'
                                                        : 'bg-amber-50 text-amber-600 border border-amber-100'
                                                }`}
                                            >
                                                {status === 'verified'
                                                    ? 'Verified'
                                                    : status === 'rejected'
                                                    ? 'Rejected'
                                                    : 'Pending'}
                                            </span>
                                            {isAdminTransaction && (
                                                <div className="mt-2">
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100 uppercase tracking-wider">
                                                        Admin Entry
                                                    </span>
                                                </div>
                                            )}
                                            {isAccountTransaction && transaction.referenceType && (
                                                <div className="mt-2">
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold bg-purple-50 text-purple-600 border border-purple-100 uppercase tracking-wider">
                                                        {transaction.referenceType.replace('_', ' ')}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
