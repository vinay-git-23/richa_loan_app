'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { IndianRupee, CheckCircle, AlertCircle, Camera, ArrowLeft, CreditCard, Smartphone, Landmark, Send, Package, ChevronDown, TrendingUp, Wallet, Clock } from 'lucide-react'
import { formatCurrency } from '@/utils/calculations'

interface TokenBatch {
    id: number
    batchNo: string
    quantity: number
    totalDailyAmount: number
    customer: {
        name: string
        mobile: string
    }
    todaySchedule?: {
        scheduleDate: string
        totalDue: number
        paidAmount: number
        status: string
    }
    nextSchedule?: {
        scheduleDate: string
        totalDue: number
    }
}

function RecordPaymentContent() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const searchParams = useSearchParams()
    const preSelectedBatchId = searchParams.get('batch')

    const [batches, setBatches] = useState<TokenBatch[]>([])
    const [selectedBatchId, setSelectedBatchId] = useState<string>(preSelectedBatchId || '')
    const [selectedBatch, setSelectedBatch] = useState<TokenBatch | null>(null)
    const [batchDetails, setBatchDetails] = useState<any>(null)
    const [amount, setAmount] = useState('')
    const [paymentMode, setPaymentMode] = useState('cash')
    const [remarks, setRemarks] = useState('')
    const [penaltyWaived, setPenaltyWaived] = useState('0')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        if (status === 'loading') return

        if (!session || session?.user?.userType !== 'collector') {
            router.push('/login')
            return
        }
        fetchBatches()
    }, [session, status])

    useEffect(() => {
        if (selectedBatchId) {
            const batch = batches.find((b) => b.id.toString() === selectedBatchId)
            setSelectedBatch(batch || null)
            if (batch) {
                fetchBatchDetails(batch.id)
            }
        } else {
            setSelectedBatch(null)
            setBatchDetails(null)
            setAmount('')
        }
    }, [selectedBatchId, batches])

    useEffect(() => {
        if (batchDetails) {
            const todaySchedule = batchDetails.summary?.todaySchedule
            const nextSchedule = batchDetails.summary?.nextSchedule
            const defaultAmount = todaySchedule?.totalDue || nextSchedule?.totalDue || batchDetails.batch?.totalDailyAmount || ''
            setAmount(defaultAmount.toString())
        }
    }, [batchDetails])

    const fetchBatches = async () => {
        try {
            const response = await fetch('/api/collectors/token-batches?status=active&pageSize=1000')
            const result = await response.json()

            if (result.success) {
                setBatches(result.data)
                if (preSelectedBatchId) {
                    setSelectedBatchId(preSelectedBatchId)
                }
            }
        } catch (error) {
            console.error('Failed to fetch batches:', error)
        }
    }

    const fetchBatchDetails = async (batchId: number) => {
        try {
            const response = await fetch(`/api/token-batches/${batchId}`)
            const result = await response.json()
            if (result.success) {
                setBatchDetails(result.data)
            }
        } catch (error) {
            console.error('Failed to fetch batch details:', error)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setSuccess(false)

        if (!selectedBatchId) {
            setError('Please select a batch')
            return
        }

        if (!amount || parseFloat(amount) <= 0) {
            setError('Please enter a valid amount')
            return
        }

        setLoading(true)

        try {
            const response = await fetch('/api/batch-payments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    batchId: parseInt(selectedBatchId),
                    amount: parseFloat(amount),
                    paymentMode,
                    paymentDate: new Date().toISOString().split('T')[0],
                    penaltyWaived: parseFloat(penaltyWaived || '0'),
                    remarks,
                }),
            })

            const result = await response.json()

            if (result.success) {
                setSuccess(true)
                setSelectedBatchId('')
                setAmount('')
                setRemarks('')
                setPenaltyWaived('0')
                setPaymentMode('cash')
                setBatchDetails(null)

                fetchBatches()

                setTimeout(() => {
                    setSuccess(false)
                    router.push('/collectors/dashboard')
                }, 2000)
            } else {
                setError(result.error || 'Failed to record payment')
            }
        } catch (error) {
            console.error('Payment error:', error)
            setError('Failed to record payment. Please check your internet connection.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-50 pb-32 font-sans text-slate-900">
            {/* Professional Header - Orange Theme */}
            <div className="bg-gradient-to-br from-orange-600 via-orange-500 to-orange-600 pt-8 pb-12 px-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="relative z-10 flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 text-white hover:bg-white/20 transition-all active:scale-95"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-xl font-black text-white tracking-tight">Record Collection</h1>
                        <p className="text-orange-100 text-xs font-bold uppercase tracking-wider mt-0.5">Batch Payment Entry</p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="px-5 -mt-6 relative z-10 space-y-6">
                {/* Batch Selection */}
                <div className="bg-white rounded-2xl p-5 shadow-lg border-2 border-slate-100">
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Package className="w-4 h-4 text-orange-600" />
                        Select Batch <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <select
                            value={selectedBatchId}
                            onChange={(e) => setSelectedBatchId(e.target.value)}
                            className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-4 py-3.5 text-slate-900 font-bold appearance-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all shadow-inner"
                            required
                        >
                            <option value="" className="text-slate-400">Select Batch</option>
                            {batches.map((batch) => (
                                <option key={batch.id} value={batch.id} className="font-sans py-2">
                                    {batch.batchNo} - {batch.customer.name} ({batch.quantity}x)
                                </option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                            <ChevronDown className="w-5 h-5" />
                        </div>
                    </div>
                </div>

                {/* Batch Details Card */}
                {selectedBatch && batchDetails && (
                    <div className="bg-gradient-to-br from-orange-600 to-orange-500 rounded-2xl p-5 text-white shadow-xl shadow-orange-500/20 relative overflow-hidden group transition-all duration-500">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
                        <div className="relative z-10 flex justify-between items-start mb-4">
                            <div>
                                <h2 className="text-lg font-black tracking-tight">{selectedBatch.customer.name}</h2>
                                <p className="text-orange-100 text-xs font-bold opacity-80">{selectedBatch.customer.mobile}</p>
                            </div>
                            <div className="bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-xl text-[10px] font-black uppercase border border-white/20 tracking-tighter">
                                {selectedBatch.batchNo}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 relative z-10 p-3 bg-white/10 rounded-xl border border-white/5 backdrop-blur-sm">
                            <div>
                                <p className="text-orange-100 text-[10px] uppercase font-black tracking-widest opacity-60">Daily Plan</p>
                                <p className="text-lg font-black">{formatCurrency(selectedBatch.totalDailyAmount)}</p>
                            </div>
                            <div>
                                <p className="text-orange-100 text-[10px] uppercase font-black tracking-widest opacity-60">Due Amount</p>
                                <p className="text-xl font-black text-white">
                                    {batchDetails.summary?.todaySchedule
                                        ? formatCurrency(batchDetails.summary.todaySchedule.totalDue)
                                        : batchDetails.summary?.nextSchedule
                                        ? formatCurrency(batchDetails.summary.nextSchedule.totalDue)
                                        : formatCurrency(selectedBatch.totalDailyAmount)}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Amount Input */}
                <div className="bg-white rounded-2xl p-5 shadow-lg border-2 border-slate-100">
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                        Collection Amount <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl flex items-center justify-center border-2 border-orange-200">
                            <IndianRupee className="w-6 h-6 text-orange-600" />
                        </div>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0"
                            step="0.01"
                            min="0"
                            className="w-full pl-20 pr-4 py-4 text-2xl font-black bg-slate-50 border-2 border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all shadow-inner placeholder:text-slate-300"
                            required
                        />
                    </div>
                </div>

                {/* Payment Mode */}
                <div className="bg-white rounded-2xl p-5 shadow-lg border-2 border-slate-100">
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
                        Payment Mode <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { id: 'cash', label: 'Cash', icon: CreditCard, color: 'orange' },
                            { id: 'upi', label: 'UPI', icon: Smartphone, color: 'indigo' },
                            { id: 'bank_transfer', label: 'Bank', icon: Landmark, color: 'slate' }
                        ].map((mode) => (
                            <button
                                key={mode.id}
                                type="button"
                                onClick={() => setPaymentMode(mode.id)}
                                className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all group ${
                                    paymentMode === mode.id
                                        ? 'border-orange-600 bg-orange-50 shadow-md'
                                        : 'border-slate-100 bg-slate-50 hover:border-slate-200 text-slate-500'
                                }`}
                            >
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                                    paymentMode === mode.id 
                                        ? 'bg-gradient-to-br from-orange-600 to-orange-500 text-white shadow-lg shadow-orange-500/30' 
                                        : 'bg-white text-slate-400 border-2 border-slate-100'
                                }`}>
                                    <mode.icon className="w-5 h-5" />
                                </div>
                                <span className={`text-[10px] font-black uppercase tracking-widest ${
                                    paymentMode === mode.id ? 'text-orange-700' : 'text-slate-500'
                                }`}>
                                    {mode.label}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Penalty Waived */}
                <div className="bg-white rounded-2xl p-5 shadow-lg border-2 border-slate-100">
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                        Penalty Waived (₹)
                    </label>
                    <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={penaltyWaived}
                        onChange={(e) => setPenaltyWaived(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-slate-900 font-bold transition-all shadow-inner"
                        placeholder="0.00"
                    />
                    <p className="text-xs text-slate-500 mt-2 font-medium">Enter penalty amount to waive off</p>
                </div>

                {/* Remarks */}
                <div className="bg-white rounded-2xl p-5 shadow-lg border-2 border-slate-100">
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                        Remarks
                    </label>
                    <textarea
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        placeholder="Optional notes..."
                        rows={3}
                        className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-4 py-3 text-slate-900 font-bold focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all resize-none shadow-inner text-sm"
                    />
                </div>

                {/* Professional Feedback & Submit */}
                <div className="fixed bottom-20 left-0 right-0 px-5 pb-4 pt-4 bg-white/90 backdrop-blur-md border-t-2 border-slate-100 flex flex-col gap-3 z-40">
                    {error && (
                        <div className="bg-red-50 border-2 border-red-100 rounded-2xl p-4 flex items-center gap-3 animate-shake">
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                            <p className="text-xs font-black text-red-800 uppercase tracking-tight">{error}</p>
                        </div>
                    )}
                    {success && (
                        <div className="bg-emerald-50 border-2 border-emerald-100 rounded-2xl p-4 flex items-center gap-3">
                            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                            <p className="text-xs font-black text-emerald-800 uppercase tracking-tight">Payment Recorded Successfully!</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !selectedBatchId || !amount}
                        className={`w-full py-4 rounded-2xl font-black text-white text-lg flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95 ${
                            loading || !selectedBatchId || !amount
                                ? 'bg-slate-300 shadow-none cursor-not-allowed'
                                : 'bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 shadow-orange-500/30'
                        }`}
                    >
                        {loading ? (
                            <div className="flex items-center gap-2">
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                <span>PROCESSING...</span>
                            </div>
                        ) : (
                            <>
                                <span>SUBMIT COLLECTION</span>
                                <Send className="w-5 h-5" />
                            </>
                        )}
                    </button>
                </div>
            </form>

            {/* Fixed Bottom Menu */}
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
                        className="flex flex-col items-center gap-1 text-orange-600"
                    >
                        <div className="p-2.5 rounded-2xl bg-orange-50 border-2 border-orange-200">
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

export default function RecordPaymentPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center h-screen bg-gradient-to-br from-orange-50 to-slate-50">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-orange-600"></div>
            </div>
        }>
            <RecordPaymentContent />
        </Suspense>
    )
}
