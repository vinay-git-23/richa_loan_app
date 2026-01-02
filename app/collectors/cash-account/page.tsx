'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
    Wallet,
    TrendingUp,
    TrendingDown,
    Calendar,
    IndianRupee,
    Plus,
    X,
    CreditCard,
    Smartphone,
    Landmark,
    FileText,
    CheckCircle,
    Clock,
    AlertCircle
} from 'lucide-react'
import { formatCurrency } from '@/utils/calculations'
import { format } from 'date-fns'

interface CashDeposit {
    id: number
    amount: number
    depositDate: string
    receiptUrl: string | null
    status: 'pending' | 'verified' | 'rejected'
    verifiedBy: number | null
    verificationDate: string | null
    createdAt: string
}

interface AccountStats {
    totalCollected: number
    totalDeposited: number
    currentBalance: number
    pendingDeposits: number
    verifiedDeposits: number
}

export default function CashAccountPage() {
    const { data: session, status: authStatus } = useSession()
    const router = useRouter()
    const [deposits, setDeposits] = useState<CashDeposit[]>([])
    const [stats, setStats] = useState<AccountStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [showDepositModal, setShowDepositModal] = useState(false)

    useEffect(() => {
        if (authStatus === 'loading') return
        if (!session || session?.user?.userType !== 'collector') {
            router.push('/login')
            return
        }
        fetchAccountData()
    }, [session, authStatus])

    const fetchAccountData = async () => {
        setLoading(true)
        try {
            const response = await fetch('/api/collectors/cash-account')
            const result = await response.json()

            if (result.success) {
                setDeposits(result.data.deposits)
                setStats(result.data.stats)
            }
        } catch (error) {
            console.error('Failed to fetch account data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleDepositSuccess = () => {
        setShowDepositModal(false)
        fetchAccountData()
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

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-32 font-sans text-slate-900">
            {/* Professional Header */}
            <div className="bg-[#0F172A] pt-8 pb-20 px-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>

                <div className="relative z-10 mb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <Wallet className="w-6 h-6 text-blue-400" />
                        <h1 className="text-xl font-bold text-white tracking-tight">Cash Account</h1>
                    </div>
                    <p className="text-blue-300 text-xs font-bold uppercase tracking-widest">Your Collection Balance</p>
                </div>

                {/* Balance Card */}
                {stats && (
                    <div className="relative z-10 bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-2xl">
                        <div className="text-center mb-6">
                            <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-2">Current Balance</p>
                            <p className="text-5xl font-black text-white mb-1">
                                {formatCurrency(stats.currentBalance)}
                            </p>
                            <p className="text-xs text-slate-400 font-medium">
                                Outstanding amount to deposit
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                            <div className="text-center">
                                <div className="flex items-center justify-center gap-2 mb-1">
                                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Collected</p>
                                </div>
                                <p className="text-lg font-bold text-emerald-400">{formatCurrency(stats.totalCollected)}</p>
                            </div>
                            <div className="text-center">
                                <div className="flex items-center justify-center gap-2 mb-1">
                                    <TrendingDown className="w-4 h-4 text-blue-400" />
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Deposited</p>
                                </div>
                                <p className="text-lg font-bold text-blue-400">{formatCurrency(stats.totalDeposited)}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="px-5 -mt-8 relative z-10 space-y-6">
                {/* Quick Stats */}
                {stats && (
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                            <div className="flex items-center gap-2 mb-2">
                                <Clock className="w-4 h-4 text-amber-500" />
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Pending</p>
                            </div>
                            <p className="text-2xl font-black text-slate-900">{stats.pendingDeposits}</p>
                        </div>
                        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                            <div className="flex items-center gap-2 mb-2">
                                <CheckCircle className="w-4 h-4 text-emerald-500" />
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Verified</p>
                            </div>
                            <p className="text-2xl font-black text-slate-900">{stats.verifiedDeposits}</p>
                        </div>
                    </div>
                )}

                {/* Deposit History */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                        <div>
                            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-3">
                                <FileText className="w-5 h-5 text-orange-600" />
                                Deposit History
                            </h3>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                                {deposits.length} Total Deposits
                            </p>
                        </div>
                    </div>

                    <div className="p-5 space-y-3">
                        {deposits.length === 0 ? (
                            <div className="text-center py-10 text-slate-400">
                                <Wallet className="w-12 h-12 mx-auto mb-3 text-slate-200" />
                                <p className="text-sm font-bold">No deposits yet</p>
                                <p className="text-xs mt-1">Your deposit history will appear here</p>
                            </div>
                        ) : (
                            deposits.map((deposit) => (
                                <div
                                    key={deposit.id}
                                    className="bg-slate-50 rounded-xl p-4 border border-slate-100"
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100">
                                                <IndianRupee className="w-5 h-5 text-blue-600" />
                                            </div>
                                            <div>
                                                <p className="text-lg font-black text-slate-900">{formatCurrency(deposit.amount)}</p>
                                                <p className="text-xs text-slate-500 font-medium">
                                                    {format(new Date(deposit.depositDate), 'dd MMM yyyy')}
                                                </p>
                                            </div>
                                        </div>
                                        <span
                                            className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest ${
                                                deposit.status === 'verified'
                                                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                                    : deposit.status === 'rejected'
                                                    ? 'bg-rose-50 text-rose-600 border border-rose-100'
                                                    : 'bg-amber-50 text-amber-600 border border-amber-100'
                                            }`}
                                        >
                                            {deposit.status}
                                        </span>
                                    </div>
                                    {deposit.verificationDate && (
                                        <div className="text-xs text-slate-500 pt-2 border-t border-slate-200">
                                            Verified on {format(new Date(deposit.verificationDate), 'dd MMM yyyy, hh:mm a')}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Floating Deposit Button */}
            <div className="fixed bottom-0 left-0 right-0 p-5 bg-white/80 backdrop-blur-md border-t border-slate-100 z-50">
                <button
                    onClick={() => setShowDepositModal(true)}
                    className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-xl shadow-blue-600/20 active:scale-95 transition-all hover:bg-black"
                >
                    <Plus className="w-5 h-5" />
                    RECORD DEPOSIT
                </button>
            </div>

            {/* Deposit Modal */}
            {showDepositModal && (
                <DepositModal
                    onClose={() => setShowDepositModal(false)}
                    onSuccess={handleDepositSuccess}
                />
            )}
        </div>
    )
}

function DepositModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
    const [depositDate, setDepositDate] = useState(format(new Date(), 'yyyy-MM-dd'))
    const [amount, setAmount] = useState('')
    const [remarks, setRemarks] = useState('')
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
            const response = await fetch('/api/collectors/cash-deposits', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: parseFloat(amount),
                    depositDate,
                    remarks
                })
            })

            const result = await response.json()

            if (response.ok) {
                onSuccess()
            } else {
                setError(result.error || 'Failed to record deposit')
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
                        <h2 className="text-xl font-bold text-slate-900">Record Cash Deposit</h2>
                        <p className="text-slate-500 text-xs mt-1">Submit your collected amount</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-xs font-bold flex items-center gap-3">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                            Deposit Date <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="date"
                            required
                            value={depositDate}
                            onChange={(e) => setDepositDate(e.target.value)}
                            max={format(new Date(), 'yyyy-MM-dd')}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-slate-900 font-bold transition-all"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                            Deposit Amount (₹) <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2">
                                <IndianRupee className="w-5 h-5 text-blue-600" />
                            </div>
                            <input
                                type="number"
                                step="0.01"
                                required
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-slate-900 font-bold transition-all text-lg"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                            Remarks (Optional)
                        </label>
                        <textarea
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-slate-900 font-medium transition-all resize-none"
                            placeholder="Add any notes about this deposit..."
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
                            className="flex-[2] px-4 py-3 bg-blue-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                'Submit Deposit'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
