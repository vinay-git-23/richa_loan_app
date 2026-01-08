'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    Wallet,
    TrendingUp,
    TrendingDown,
    Plus,
    X,
    IndianRupee,
    User,
    Eye,
    RefreshCw,
    ArrowUp,
    ArrowDown,
    Search,
    Filter,
    Calendar,
    FileText,
    Download,
    BarChart3
} from 'lucide-react'
import { formatCurrency } from '@/utils/calculations'
import { format } from 'date-fns'

interface CollectorAccount {
    id: number
    name: string
    collectorId: string
    mobile: string
    currentBalance: number
}

interface AdminAccountTransaction {
    id: number
    transactionType: 'credit' | 'debit'
    amount: number
    balanceAfter: number
    description: string | null
    referenceType: string | null
    transactionDate: string
    createdBy?: number | null
    createdByType?: 'admin' | 'collector' | null
    creatorName?: string
}

interface AdminAccountStats {
    currentBalance: number
    totalCredits: number
    totalDebits: number
    todayCredits: number
    todayDebits: number
}

export default function CashManagementPage() {
    const router = useRouter()
    const [accounts, setAccounts] = useState<CollectorAccount[]>([])
    const [adminAccount, setAdminAccount] = useState<any>(null)
    const [adminTransactions, setAdminTransactions] = useState<AdminAccountTransaction[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'dashboard' | 'collectors' | 'admin' | 'reports'>('dashboard')
    const [showCreditModal, setShowCreditModal] = useState(false)
    const [showAddAmountModal, setShowAddAmountModal] = useState(false)
    const [showAdminDebitModal, setShowAdminDebitModal] = useState(false)
    const [selectedCollector, setSelectedCollector] = useState<CollectorAccount | null>(null)
    
    // Filters for reports
    const [searchQuery, setSearchQuery] = useState('')
    const [typeFilter, setTypeFilter] = useState<'all' | 'credit' | 'debit'>('all')
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [page, setPage] = useState(1)

    useEffect(() => {
        fetchData()
    }, [activeTab, page, typeFilter, startDate, endDate])

    const fetchData = async () => {
        setLoading(true)
        try {
            const [accountsRes, adminRes] = await Promise.all([
                fetch('/api/admin/collector-accounts'),
                fetch(`/api/admin/account?page=${page}&pageSize=50${typeFilter !== 'all' ? `&type=${typeFilter}` : ''}${startDate ? `&startDate=${startDate}` : ''}${endDate ? `&endDate=${endDate}` : ''}`)
            ])

            const accountsData = await accountsRes.json()
            const adminData = await adminRes.json()

            if (accountsData.success) setAccounts(accountsData.data)
            if (adminData.success) {
                setAdminAccount(adminData.data)
                setAdminTransactions(adminData.data.transactions || [])
            }
        } catch (error) {
            console.error('Failed to fetch data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleCredit = (account: CollectorAccount) => {
        setSelectedCollector(account)
        setShowCreditModal(true)
    }

    const handleCreditSuccess = () => {
        setShowCreditModal(false)
        setSelectedCollector(null)
                fetchData()
    }

    const handleAddAmountSuccess = () => {
        setShowAddAmountModal(false)
        fetchData()
    }

    const totalCollectorBalance = accounts.reduce((sum, acc) => sum + acc.currentBalance, 0)
    const filteredTransactions = adminTransactions.filter(tx => {
        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            const matchesSearch = (
                tx.description?.toLowerCase().includes(query) ||
                tx.referenceType?.toLowerCase().includes(query) ||
                formatCurrency(tx.amount).toLowerCase().includes(query)
            )
            if (!matchesSearch) return false
        }
        // Type filter
        if (typeFilter !== 'all' && tx.transactionType !== typeFilter) {
            return false
        }
        // Date filter
        if (startDate || endDate) {
            const txDate = new Date(tx.transactionDate)
            if (startDate && txDate < new Date(startDate)) return false
            if (endDate) {
                const end = new Date(endDate)
                end.setHours(23, 59, 59, 999)
                if (txDate > end) return false
            }
        }
        return true
    })

    if (loading && !adminAccount) {
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
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Account Management</h1>
                <p className="text-slate-500 text-sm mt-1">Complete account management system for admin and collectors</p>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-orange-600 to-orange-500 text-white rounded-2xl p-6 border shadow-lg">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-6">
                        <Wallet className="w-6 h-6" />
                    </div>
                    <h4 className="text-xs font-black text-orange-100 uppercase tracking-widest mb-1">Admin Balance</h4>
                    <p className="text-3xl font-black tracking-tight mb-3 font-mono">
                        {adminAccount ? formatCurrency(adminAccount.stats.currentBalance) : formatCurrency(0)}
                    </p>
                </div>

                <div className="bg-white rounded-2xl p-6 border-2 border-slate-200 shadow-lg">
                    <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mb-6 border-2 border-emerald-200">
                        <TrendingUp className="w-6 h-6 text-emerald-600" />
                    </div>
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Total Collector Balance</h4>
                    <p className="text-3xl font-black tracking-tight mb-3 font-mono text-emerald-600">{formatCurrency(totalCollectorBalance)}</p>
                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest pt-4 border-t border-slate-100">
                        {accounts.length} Collectors
                    </p>
                </div>

                <div className="bg-white rounded-2xl p-6 border-2 border-slate-200 shadow-lg">
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-6 border-2 border-blue-200">
                        <TrendingDown className="w-6 h-6 text-blue-600" />
                    </div>
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Combined Balance</h4>
                    <p className="text-3xl font-black tracking-tight mb-3 font-mono text-blue-600">
                        {formatCurrency((adminAccount?.stats.currentBalance || 0) + totalCollectorBalance)}
                    </p>
                </div>

                <div className="bg-white rounded-2xl p-6 border-2 border-slate-200 shadow-lg">
                    <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mb-6 border-2 border-purple-200">
                        <BarChart3 className="w-6 h-6 text-purple-600" />
                    </div>
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Today Credits</h4>
                    <p className="text-3xl font-black tracking-tight mb-3 font-mono text-purple-600">
                        {formatCurrency(adminAccount?.stats.todayCredits || 0)}
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-slate-200/50 p-1.5 rounded-2xl flex gap-1.5 inline-flex">
                {[
                    { id: 'dashboard', label: 'Dashboard' },
                    { id: 'collectors', label: `Collectors (${accounts.length})` },
                    { id: 'admin', label: 'Admin Account' },
                    { id: 'reports', label: 'Reports' }
                ].map((tab) => (
                <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                    className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                            activeTab === tab.id
                            ? 'bg-white text-orange-600 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                        {tab.label}
                </button>
                ))}
            </div>

            {/* Dashboard Tab */}
            {activeTab === 'dashboard' && adminAccount && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-lg p-6">
                        <h3 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2">
                            <Wallet className="w-5 h-5 text-orange-600" />
                            Admin Account Summary
                        </h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Current Balance</span>
                                <span className="text-xl font-black text-orange-600">{formatCurrency(adminAccount.stats.currentBalance)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Credits</span>
                                <span className="text-lg font-black text-emerald-600">{formatCurrency(adminAccount.stats.totalCredits)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Debits</span>
                                <span className="text-lg font-black text-red-600">{formatCurrency(adminAccount.stats.totalDebits)}</span>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-4">
                            <button
                                onClick={() => setShowAddAmountModal(true)}
                                className="flex-1 py-3 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:from-orange-700 hover:to-orange-600 transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                Credit
                </button>
                <button
                                onClick={() => setShowAdminDebitModal(true)}
                                className="flex-1 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:from-red-700 hover:to-red-600 transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <ArrowDown className="w-4 h-4" />
                                Debit
                </button>
            </div>
                    </div>

                    <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-lg p-6">
                        <h3 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2">
                            <User className="w-5 h-5 text-orange-600" />
                            Collector Accounts Summary
                        </h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Collectors</span>
                                <span className="text-xl font-black text-slate-900">{accounts.length}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Balance</span>
                                <span className="text-xl font-black text-emerald-600">{formatCurrency(totalCollectorBalance)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Average Balance</span>
                                <span className="text-lg font-black text-slate-600">
                                    {accounts.length > 0 ? formatCurrency(totalCollectorBalance / accounts.length) : formatCurrency(0)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Collectors Tab */}
            {activeTab === 'collectors' && (
                <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-lg overflow-hidden">
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                        <div>
                            <h3 className="text-sm font-black text-slate-900">Collector Accounts</h3>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">
                                Manage collector account balances
                            </p>
                        </div>
                        <button
                            onClick={fetchData}
                            className="p-2 hover:bg-slate-100 rounded-xl transition-all"
                            title="Refresh"
                        >
                            <RefreshCw className="w-5 h-5 text-slate-400" />
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50/30 border-b border-slate-100">
                                    <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-widest">
                                        Collector
                                    </th>
                                    <th className="px-6 py-4 text-right text-xs font-black text-orange-600 uppercase tracking-widest">
                                        Current Balance
                                    </th>
                                    <th className="px-6 py-4 text-right text-xs font-black text-slate-400 uppercase tracking-widest">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {accounts.map((account) => (
                                    <tr key={account.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl flex items-center justify-center border-2 border-orange-200">
                                                    <User className="w-5 h-5 text-orange-600" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-900">{account.name}</p>
                                                    <p className="text-xs text-slate-400 font-mono">{account.collectorId}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <p className="text-base font-black text-orange-600 font-mono">
                                                {formatCurrency(account.currentBalance)}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleCredit(account)}
                                                    className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all border-2 border-emerald-200 hover:border-emerald-300"
                                                    title="Credit Account"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => router.push(`/admin/cash-management/${account.id}`)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-all border-2 border-blue-200 hover:border-blue-300"
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
            )}

            {/* Admin Account Tab */}
            {activeTab === 'admin' && (
                <div className="space-y-6">
                    {/* Action Buttons - Always Visible */}
                    <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-lg p-6">
                        <h3 className="text-sm font-black text-slate-900 mb-4">Admin Account Actions</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button
                                onClick={() => setShowAddAmountModal(true)}
                                className="w-full py-4 px-6 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:from-orange-700 hover:to-orange-600 transition-all active:scale-95 flex items-center justify-center gap-3 shadow-lg shadow-orange-500/30"
                            >
                                <Plus className="w-5 h-5" />
                                <span>Credit (Add Amount)</span>
                            </button>
                            <button
                                onClick={() => setShowAdminDebitModal(true)}
                                className="w-full py-4 px-6 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:from-red-700 hover:to-red-600 transition-all active:scale-95 flex items-center justify-center gap-3 shadow-lg shadow-red-500/30"
                            >
                                <ArrowDown className="w-5 h-5" />
                                <span>Debit (Withdraw)</span>
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-lg p-12 flex flex-col items-center justify-center">
                            <div className="w-12 h-12 border-4 border-slate-100 border-t-orange-600 rounded-full animate-spin mb-4"></div>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Loading account data...</p>
                        </div>
                    ) : adminAccount ? (
                    <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-lg overflow-hidden">
                        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                            <div>
                                <h3 className="text-sm font-black text-slate-900">Account Details</h3>
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">
                                    Current balance and transaction history
                                </p>
                            </div>
                            <button
                                onClick={fetchData}
                                className="p-2 hover:bg-slate-100 rounded-xl transition-all"
                                title="Refresh"
                            >
                                <RefreshCw className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-50 rounded-2xl p-4 border-2 border-slate-200">
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Current Balance</p>
                                <p className="text-2xl font-black text-slate-900">{formatCurrency(adminAccount.stats.currentBalance)}</p>
                            </div>
                            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-4 border-2 border-orange-200">
                                <p className="text-xs font-black text-orange-600 uppercase tracking-widest mb-2">Today Credits</p>
                                <p className="text-2xl font-black text-orange-600">{formatCurrency(adminAccount.stats.todayCredits)}</p>
                            </div>
                            <div className="bg-emerald-50 rounded-2xl p-4 border-2 border-emerald-200">
                                <p className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-2">Total Credits</p>
                                <p className="text-2xl font-black text-emerald-600">{formatCurrency(adminAccount.stats.totalCredits)}</p>
                            </div>
                            <div className="bg-red-50 rounded-2xl p-4 border-2 border-red-200">
                                <p className="text-xs font-black text-red-600 uppercase tracking-widest mb-2">Total Debits</p>
                                <p className="text-2xl font-black text-red-600">{formatCurrency(adminAccount.stats.totalDebits)}</p>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-sm font-black text-slate-900 mb-4">Recent Transactions</h4>
                            <div className="space-y-2">
                                {adminTransactions.slice(0, 10).map((tx) => (
                                    <div key={tx.id} className="bg-slate-50 rounded-xl p-4 border-2 border-slate-200 flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 ${
                                                tx.transactionType === 'credit'
                                                    ? 'bg-emerald-50 border-emerald-200'
                                                    : 'bg-red-50 border-red-200'
                                            }`}>
                                                {tx.transactionType === 'credit' ? (
                                                    <ArrowUp className="w-5 h-5 text-emerald-600" />
                                                ) : (
                                                    <ArrowDown className="w-5 h-5 text-red-600" />
                                                )}
                                            </div>
                                            <div>
                                                <p className={`text-sm font-black ${
                                                    tx.transactionType === 'credit' ? 'text-emerald-600' : 'text-red-600'
                                                }`}>
                                                    {tx.transactionType === 'credit' ? '+' : '-'}{formatCurrency(tx.amount)}
                                                </p>
                                                <p className="text-xs text-slate-500 font-medium">{tx.description || 'Transaction'}</p>
                                                <p className="text-xs text-slate-400">{format(new Date(tx.transactionDate), 'dd MMM yyyy, hh:mm a')}</p>
                                            </div>
                                        </div>
                                        <p className="text-sm font-black text-slate-900">{formatCurrency(tx.balanceAfter)}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        </div>
                    </div>
                    ) : (
                        <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-lg p-12 flex flex-col items-center justify-center text-center">
                            <Wallet className="w-16 h-16 text-slate-300 mb-4" />
                            <p className="text-lg font-black text-slate-900 mb-2">No Account Data</p>
                            <p className="text-sm text-slate-500 mb-6">Account data will appear here once transactions are recorded</p>
                                        <button
                                onClick={() => setShowAddAmountModal(true)}
                                className="px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-xl font-black text-sm uppercase tracking-widest hover:from-orange-700 hover:to-orange-600 transition-all active:scale-95"
                                        >
                                <Plus className="w-4 h-4 inline mr-2" />
                                Create Account (Add Initial Amount)
                                        </button>
                        </div>
                    )}
                </div>
            )}

            {/* Reports Tab */}
            {activeTab === 'reports' && (
                <div className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-5 border-2 border-emerald-200 shadow-lg">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-xs font-black text-emerald-600 uppercase tracking-widest">Total Credits</p>
                                <TrendingUp className="w-5 h-5 text-emerald-600" />
                            </div>
                            <p className="text-2xl font-black text-emerald-700">
                                {formatCurrency(adminAccount?.stats?.totalCredits || 0)}
                            </p>
                        </div>
                        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-5 border-2 border-red-200 shadow-lg">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-xs font-black text-red-600 uppercase tracking-widest">Total Debits</p>
                                <TrendingDown className="w-5 h-5 text-red-600" />
                            </div>
                            <p className="text-2xl font-black text-red-700">
                                {formatCurrency(adminAccount?.stats?.totalDebits || 0)}
                            </p>
                        </div>
                        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-5 border-2 border-orange-200 shadow-lg">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-xs font-black text-orange-600 uppercase tracking-widest">Today Credits</p>
                                <ArrowUp className="w-5 h-5 text-orange-600" />
                            </div>
                            <p className="text-2xl font-black text-orange-700">
                                {formatCurrency(adminAccount?.stats?.todayCredits || 0)}
                            </p>
                        </div>
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-5 border-2 border-blue-200 shadow-lg">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-xs font-black text-blue-600 uppercase tracking-widest">Today Debits</p>
                                <ArrowDown className="w-5 h-5 text-blue-600" />
                            </div>
                            <p className="text-2xl font-black text-blue-700">
                                {formatCurrency(adminAccount?.stats?.todayDebits || 0)}
                            </p>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-white rounded-2xl p-5 shadow-lg border-2 border-slate-100">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Filter className="w-5 h-5 text-orange-600" />
                                <h3 className="text-sm font-black text-slate-900">Filters & Search</h3>
                            </div>
                                        <button
                                onClick={() => {
                                    setSearchQuery('')
                                    setTypeFilter('all')
                                    setStartDate('')
                                    setEndDate('')
                                    setPage(1)
                                }}
                                className="px-4 py-2 text-xs font-black text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all"
                            >
                                <RefreshCw className="w-4 h-4 inline mr-1" />
                                Reset
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => {
                                    setStartDate(e.target.value)
                                    setPage(1)
                                }}
                                className="px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none font-bold text-sm"
                                placeholder="Start Date"
                            />
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => {
                                    setEndDate(e.target.value)
                                    setPage(1)
                                }}
                                className="px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none font-bold text-sm"
                                placeholder="End Date"
                            />
                        </div>
                    </div>

                    {/* Consolidated Report */}
                    <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-lg overflow-hidden">
                        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                            <div>
                                <h3 className="text-sm font-black text-slate-900 flex items-center gap-3">
                                    <FileText className="w-5 h-5 text-orange-600" />
                                    Consolidated Transaction Report
                                </h3>
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">
                                    {filteredTransactions.length} Transactions
                                </p>
                            </div>
                            <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-all">
                                <Download className="w-5 h-5" />
                                        </button>
                        </div>

                        <div className="p-5 space-y-3">
                            {filteredTransactions.length === 0 ? (
                                <div className="text-center py-10 text-slate-400">
                                    <FileText className="w-12 h-12 mx-auto mb-3 text-slate-200" />
                                    <p className="text-sm font-black">No transactions found</p>
                                </div>
                            ) : (
                                <>
                                    {filteredTransactions.map((tx) => (
                                        <div key={tx.id} className="bg-slate-50 rounded-xl p-4 border-2 border-slate-200">
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 ${
                                                        tx.transactionType === 'credit'
                                                            ? 'bg-emerald-50 border-emerald-200'
                                                            : 'bg-red-50 border-red-200'
                                                    }`}>
                                                        {tx.transactionType === 'credit' ? (
                                                            <ArrowUp className="w-5 h-5 text-emerald-600" />
                                                        ) : (
                                                            <ArrowDown className="w-5 h-5 text-red-600" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className={`text-sm font-black ${
                                                            tx.transactionType === 'credit' ? 'text-emerald-600' : 'text-red-600'
                                                        }`}>
                                                            {tx.transactionType === 'credit' ? '+' : '-'}{formatCurrency(tx.amount)}
                                                        </p>
                                                        <p className="text-xs text-slate-500 font-medium">{tx.description || 'Transaction'}</p>
                                                        <p className="text-xs text-slate-400">{format(new Date(tx.transactionDate), 'dd MMM yyyy, hh:mm a')}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Balance</p>
                                                    <p className="text-sm font-black text-slate-900">{formatCurrency(tx.balanceAfter)}</p>
                                                </div>
                                            </div>
                                            <div className="pt-3 border-t border-slate-200">
                                            <div className="flex items-center gap-2">
                                                <User className="w-4 h-4 text-slate-400" />
                                                <p className="text-xs font-medium text-slate-600">
                                                    <span className="font-black text-slate-400 uppercase tracking-widest">Created by: </span>
                                                    <span className="font-bold text-slate-700">{tx.creatorName || 'System'}</span>
                                                    {tx.createdByType && (
                                                        <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                                            tx.createdByType === 'admin' 
                                                                ? 'bg-orange-100 text-orange-700 border border-orange-200' 
                                                                : 'bg-blue-100 text-blue-700 border border-blue-200'
                                                        }`}>
                                                            {tx.createdByType}
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                    </div>
                                </div>
                            ))}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Credit Modal */}
            {showCreditModal && selectedCollector && (
                <CreditModal
                    collector={selectedCollector}
                    adminBalance={adminAccount?.stats.currentBalance || 0}
                    onClose={() => {
                        setShowCreditModal(false)
                        setSelectedCollector(null)
                    }}
                    onSuccess={handleCreditSuccess}
                />
            )}

            {/* Add Amount Modal */}
            {showAddAmountModal && (
                <AddAmountModal
                    onClose={() => setShowAddAmountModal(false)}
                    onSuccess={handleAddAmountSuccess}
                />
            )}

            {/* Admin Debit Modal */}
            {showAdminDebitModal && adminAccount && (
                <AdminDebitModal
                    adminBalance={adminAccount.stats.currentBalance}
                    onClose={() => setShowAdminDebitModal(false)}
                    onSuccess={() => {
                        setShowAdminDebitModal(false)
                        fetchData()
                    }}
                />
            )}
        </div>
    )
}

function AdminDebitModal({ adminBalance, onClose, onSuccess }: { adminBalance: number; onClose: () => void; onSuccess: () => void }) {
    const [amount, setAmount] = useState('')
    const [description, setDescription] = useState('')
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

        if (parseFloat(amount) > adminBalance) {
            setError(`Insufficient balance. Available: ${formatCurrency(adminBalance)}`)
            setLoading(false)
            return
        }

        try {
            const response = await fetch('/api/admin/account/debit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: parseFloat(amount),
                    description: description || 'Manual debit'
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
                        <h2 className="text-xl font-black text-slate-900">Debit from Admin Account</h2>
                        <p className="text-slate-500 text-xs mt-1 font-medium">Withdraw amount from admin account</p>
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
                        <p className="text-2xl font-black text-slate-900">{formatCurrency(adminBalance)}</p>
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
                                max={adminBalance}
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-slate-900 font-black transition-all text-lg"
                                placeholder="0.00"
                            />
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
                            className="flex-[2] px-4 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:from-red-700 hover:to-red-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-red-500/30 active:scale-95"
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

function CreditModal({ collector, adminBalance, onClose, onSuccess }: { collector: CollectorAccount; adminBalance: number; onClose: () => void; onSuccess: () => void }) {
    const [amount, setAmount] = useState('')
    const [description, setDescription] = useState('')
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

        if (parseFloat(amount) > adminBalance) {
            setError(`Insufficient admin balance. Available: ${formatCurrency(adminBalance)}`)
            setLoading(false)
            return
        }

        try {
            const response = await fetch('/api/admin/collector-accounts/credit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    collectorId: collector.id,
                    amount: parseFloat(amount),
                    description: description || `Credit to ${collector.name}`
                })
            })

            const result = await response.json()

            if (response.ok && result.success) {
                onSuccess()
            } else {
                setError(result.error || 'Failed to credit account')
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
                        <h2 className="text-xl font-black text-slate-900">Credit to Collector</h2>
                        <p className="text-slate-500 text-xs mt-1 font-medium">{collector.name} ({collector.collectorId})</p>
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
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Available Admin Balance</p>
                        <p className="text-2xl font-black text-slate-900">{formatCurrency(adminBalance)}</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                            Credit Amount (₹) <span className="text-red-500">*</span>
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
                                max={adminBalance}
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-slate-900 font-black transition-all text-lg"
                                placeholder="0.00"
                            />
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
                            placeholder="Add description for this credit..."
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
                                'Credit Account'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

function AddAmountModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
    const [amount, setAmount] = useState('')
    const [description, setDescription] = useState('')
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

        try {
            const response = await fetch('/api/admin/account', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: parseFloat(amount),
                    description: description || 'Manual amount addition'
                })
            })

            const result = await response.json()

            if (response.ok && result.success) {
                onSuccess()
            } else {
                setError(result.error || 'Failed to add amount')
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
                        <h2 className="text-xl font-black text-slate-900">Add Amount to Admin Account</h2>
                        <p className="text-slate-500 text-xs mt-1 font-medium">Add funds to admin account</p>
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

                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                            Amount to Add (₹) <span className="text-red-500">*</span>
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
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-slate-900 font-black transition-all text-lg"
                            placeholder="0.00"
                        />
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
                            placeholder="Add description for this addition..."
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
                                'Add Amount'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
