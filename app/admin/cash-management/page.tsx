'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    Wallet,
    TrendingUp,
    TrendingDown,
    Plus,
    Minus,
    X,
    IndianRupee,
    User,
    CheckCircle,
    Clock,
    XCircle,
    Calendar,
    Eye,
    RefreshCw
} from 'lucide-react'
import { formatCurrency } from '@/utils/calculations'
import { format } from 'date-fns'

interface CollectorAccount {
    id: number
    name: string
    collectorId: string
    mobile: string
    totalCollected: number
    totalDeposited: number
    currentBalance: number
    pendingDeposits: number
    lastDeposit: string | null
}

interface CashDeposit {
    id: number
    amount: number
    depositDate: string
    status: string
    collectorId: number
    collector: {
        name: string
        collectorId: string
    }
    createdAt: string
}

export default function CashManagementPage() {
    const router = useRouter()
    const [accounts, setAccounts] = useState<CollectorAccount[]>([])
    const [pendingDeposits, setPendingDeposits] = useState<CashDeposit[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'accounts' | 'pending'>('accounts')
    const [selectedAccount, setSelectedAccount] = useState<CollectorAccount | null>(null)
    const [showTransactionModal, setShowTransactionModal] = useState(false)
    const [transactionType, setTransactionType] = useState<'credit' | 'debit'>('credit')

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            const [accountsRes, depositsRes] = await Promise.all([
                fetch('/api/admin/collector-accounts'),
                fetch('/api/admin/pending-deposits')
            ])

            const accountsData = await accountsRes.json()
            const depositsData = await depositsRes.json()

            if (accountsData.success) setAccounts(accountsData.data)
            if (depositsData.success) setPendingDeposits(depositsData.data)
        } catch (error) {
            console.error('Failed to fetch data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleVerifyDeposit = async (depositId: number, status: 'verified' | 'rejected') => {
        try {
            const response = await fetch(`/api/admin/cash-deposits/${depositId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            })

            if (response.ok) {
                fetchData()
                alert(`Deposit ${status} successfully`)
            } else {
                alert('Failed to update deposit')
            }
        } catch (error) {
            alert('Failed to update deposit')
        }
    }

    const handleTransaction = (account: CollectorAccount, type: 'credit' | 'debit') => {
        setSelectedAccount(account)
        setTransactionType(type)
        setShowTransactionModal(true)
    }

    const totalStats = accounts.reduce((acc, account) => ({
        totalCollected: acc.totalCollected + account.totalCollected,
        totalDeposited: acc.totalDeposited + account.totalDeposited,
        currentBalance: acc.currentBalance + account.currentBalance
    }), { totalCollected: 0, totalDeposited: 0, currentBalance: 0 })

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="w-12 h-12 border-4 border-slate-100 border-t-orange-600 rounded-full animate-spin"></div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 animate-pulse">Loading...</p>
            </div>
        )
    }

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Cash Management</h1>
                <p className="text-slate-500 text-sm mt-1">Monitor collector accounts and deposits</p>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-zinc-900 text-white rounded-2xl p-6 border shadow-sm">
                    <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center mb-6">
                        <TrendingUp className="w-6 h-6 text-orange-500" />
                    </div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Collected</h4>
                    <p className="text-3xl font-bold tracking-tight mb-3 font-mono">{formatCurrency(totalStats.totalCollected)}</p>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest pt-4 border-t border-slate-100/10">
                        From all collectors
                    </p>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                    <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mb-6">
                        <CheckCircle className="w-6 h-6 text-emerald-600" />
                    </div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Deposited</h4>
                    <p className="text-3xl font-bold tracking-tight mb-3 font-mono text-emerald-600">{formatCurrency(totalStats.totalDeposited)}</p>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest pt-4 border-t border-slate-100/10">
                        Verified deposits
                    </p>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                    <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center mb-6">
                        <Wallet className="w-6 h-6 text-orange-600" />
                    </div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Outstanding Balance</h4>
                    <p className="text-3xl font-bold tracking-tight mb-3 font-mono text-orange-600">{formatCurrency(totalStats.currentBalance)}</p>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest pt-4 border-t border-slate-100/10">
                        To be deposited
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-slate-200/50 p-1.5 rounded-2xl flex gap-1.5 inline-flex">
                <button
                    onClick={() => setActiveTab('accounts')}
                    className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                        activeTab === 'accounts'
                            ? 'bg-white text-orange-600 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                    Collector Accounts ({accounts.length})
                </button>
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all relative ${
                        activeTab === 'pending'
                            ? 'bg-white text-orange-600 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                    Pending Deposits ({pendingDeposits.length})
                    {pendingDeposits.length > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-xs rounded-full flex items-center justify-center">
                            {pendingDeposits.length}
                        </span>
                    )}
                </button>
            </div>

            {/* Content */}
            {activeTab === 'accounts' ? (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                        <div>
                            <h3 className="text-sm font-bold text-slate-900">Collector Accounts</h3>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                                Manage collector cash balances
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

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50/30 border-b border-slate-100">
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">
                                        Collector
                                    </th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-widest">
                                        Collected
                                    </th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-widest">
                                        Deposited
                                    </th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-orange-600 uppercase tracking-widest">
                                        Balance
                                    </th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                                        Pending
                                    </th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-widest">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {accounts.map((account) => (
                                    <tr key={account.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                                                    <User className="w-5 h-5 text-slate-400" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900">{account.name}</p>
                                                    <p className="text-xs text-slate-400 font-mono">{account.collectorId}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <p className="text-sm font-bold text-slate-900 font-mono">
                                                {formatCurrency(account.totalCollected)}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <p className="text-sm font-bold text-emerald-600 font-mono">
                                                {formatCurrency(account.totalDeposited)}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <p className="text-base font-bold text-orange-600 font-mono">
                                                {formatCurrency(account.currentBalance)}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-600">
                                                {account.pendingDeposits}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleTransaction(account, 'credit')}
                                                    className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                                    title="Credit Account"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleTransaction(account, 'debit')}
                                                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                                    title="Debit Account"
                                                >
                                                    <Minus className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => router.push(`/admin/cash-management/${account.id}`)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                    title="View Details"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                        <h3 className="text-sm font-bold text-slate-900">Pending Deposits</h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                            Verify or reject deposits
                        </p>
                    </div>

                    {pendingDeposits.length === 0 ? (
                        <div className="text-center py-20 text-slate-400">
                            <CheckCircle className="w-12 h-12 mx-auto mb-3 text-emerald-200" />
                            <p className="text-sm font-bold">No Pending Deposits</p>
                            <p className="text-xs mt-1">All deposits have been processed</p>
                        </div>
                    ) : (
                        <div className="p-6 space-y-4">
                            {pendingDeposits.map((deposit) => (
                                <div
                                    key={deposit.id}
                                    className="bg-slate-50 rounded-xl p-5 border border-slate-200"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100">
                                                <IndianRupee className="w-6 h-6 text-blue-600" />
                                            </div>
                                            <div>
                                                <p className="text-2xl font-black text-slate-900">{formatCurrency(deposit.amount)}</p>
                                                <p className="text-xs text-slate-500 font-medium mt-1">
                                                    {deposit.collector.name} ({deposit.collector.collectorId})
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                                                <Calendar className="w-3 h-3" />
                                                {format(new Date(deposit.depositDate), 'dd MMM yyyy')}
                                            </div>
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-600 border border-amber-100">
                                                <Clock className="w-3 h-3 mr-1" />
                                                Pending
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex gap-3 pt-4 border-t border-slate-200">
                                        <button
                                            onClick={() => handleVerifyDeposit(deposit.id, 'verified')}
                                            className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle className="w-4 h-4" />
                                            Verify
                                        </button>
                                        <button
                                            onClick={() => handleVerifyDeposit(deposit.id, 'rejected')}
                                            className="flex-1 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                                        >
                                            <XCircle className="w-4 h-4" />
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Transaction Modal */}
            {showTransactionModal && selectedAccount && (
                <TransactionModal
                    account={selectedAccount}
                    type={transactionType}
                    onClose={() => {
                        setShowTransactionModal(false)
                        setSelectedAccount(null)
                    }}
                    onSuccess={() => {
                        setShowTransactionModal(false)
                        setSelectedAccount(null)
                        fetchData()
                    }}
                />
            )}
        </div>
    )
}

function TransactionModal({
    account,
    type,
    onClose,
    onSuccess
}: {
    account: CollectorAccount
    type: 'credit' | 'debit'
    onClose: () => void
    onSuccess: () => void
}) {
    const [amount, setAmount] = useState('')
    const [remarks, setRemarks] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const response = await fetch('/api/admin/collector-transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    collectorId: account.id,
                    type,
                    amount: parseFloat(amount),
                    remarks
                })
            })

            const result = await response.json()

            if (response.ok) {
                onSuccess()
            } else {
                setError(result.error || 'Failed to process transaction')
            }
        } catch (err) {
            setError('Network error occurred')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">
                            {type === 'credit' ? 'Credit Account' : 'Debit Account'}
                        </h2>
                        <p className="text-slate-500 text-xs mt-1">{account.name} - {account.collectorId}</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 bg-slate-50 border-b border-slate-100">
                    <div className="text-sm space-y-2">
                        <div className="flex justify-between">
                            <span className="text-slate-500">Current Balance:</span>
                            <span className="font-bold text-orange-600">{formatCurrency(account.currentBalance)}</span>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-xs font-bold">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                            Amount (₹) <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            required
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-slate-900 font-bold transition-all text-lg"
                            placeholder="0.00"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                            Remarks <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                            required
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-slate-900 font-medium transition-all resize-none"
                            placeholder="Reason for this transaction..."
                        />
                    </div>

                    <div className="flex gap-4 pt-4 border-t border-slate-100">
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
                            className={`flex-[2] px-4 py-3 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all disabled:opacity-50 ${
                                type === 'credit' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                            }`}
                        >
                            {loading ? 'Processing...' : `${type === 'credit' ? 'Credit' : 'Debit'} Amount`}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
