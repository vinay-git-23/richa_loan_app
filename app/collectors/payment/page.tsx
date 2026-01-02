'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { IndianRupee, CheckCircle, AlertCircle, Camera, ArrowLeft, CreditCard, Smartphone, Landmark, Send } from 'lucide-react'
import { formatCurrency } from '@/utils/calculations'

interface Token {
    id: number
    tokenNo: string
    totalAmount: number
    dailyInstallment: number
    customer: {
        name: string
        mobile: string
    }
    todayDue: number
    status: string
}

function RecordPaymentContent() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const searchParams = useSearchParams()
    const preSelectedTokenId = searchParams.get('token')

    const [tokens, setTokens] = useState<Token[]>([])
    const [selectedTokenId, setSelectedTokenId] = useState<string>(preSelectedTokenId || '')
    const [selectedToken, setSelectedToken] = useState<Token | null>(null)
    const [amount, setAmount] = useState('')
    const [paymentMode, setPaymentMode] = useState('cash')
    const [remarks, setRemarks] = useState('')
    const [photo, setPhoto] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        if (status === 'loading') return

        if (!session || session?.user?.userType !== 'collector') {
            router.push('/login')
            return
        }
        fetchTokens()
    }, [session, status])

    useEffect(() => {
        if (selectedTokenId) {
            const token = tokens.find((t) => t.id.toString() === selectedTokenId)
            setSelectedToken(token || null)
            if (token) {
                setAmount(token.todayDue.toString())
            }
        } else {
            setSelectedToken(null)
            setAmount('')
        }
    }, [selectedTokenId, tokens])

    const fetchTokens = async () => {
        try {
            const response = await fetch('/api/collectors/tokens')
            const result = await response.json()

            if (result.success) {
                const activeTokens = result.data.filter(
                    (t: Token) => t.todayDue > 0 || t.status === 'active' || t.status === 'overdue'
                )
                setTokens(activeTokens)
                if (preSelectedTokenId) {
                    setSelectedTokenId(preSelectedTokenId)
                }
            }
        } catch (error) {
            console.error('Failed to fetch tokens:', error)
        }
    }

    const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                setPhoto(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setSuccess(false)

        if (!selectedTokenId) {
            setError('Please select a token')
            return
        }

        if (!amount || parseFloat(amount) <= 0) {
            setError('Please enter a valid amount')
            return
        }

        setLoading(true)

        try {
            const response = await fetch('/api/collectors/payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tokenId: parseInt(selectedTokenId),
                    amount: parseFloat(amount),
                    paymentMode,
                    remarks,
                    photoUrl: photo,
                }),
            })

            const result = await response.json()

            if (result.success) {
                setSuccess(true)
                setSelectedTokenId('')
                setAmount('')
                setRemarks('')
                setPaymentMode('cash')
                setPhoto(null)

                fetchTokens()

                setTimeout(() => {
                    setSuccess(false)
                    router.push('/collectors/dashboard')
                }, 2000)
            } else {
                setError(result.error || 'Failed to record payment')
            }
        } catch (error) {
            console.error('Payment error:', error)
            setError('Failed to record payment. Please check your internet connection or image size.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans text-slate-900">
            {/* Professional Header */}
            <div className="bg-[#0F172A] pt-8 pb-12 px-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="relative z-10 flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 bg-slate-800/50 rounded-xl border border-slate-700/50 text-slate-300 hover:text-white transition-all backdrop-blur-sm"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-white tracking-tight">Record Collection</h1>
                        <p className="text-blue-300 text-xs font-medium uppercase tracking-wider mt-0.5">Payment Entry</p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="px-5 -mt-6 relative z-10 space-y-6">
                {/* Token Selection with Professional Dropdown */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                        Customer Token <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <select
                            value={selectedTokenId}
                            onChange={(e) => setSelectedTokenId(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-900 font-bold appearance-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-inner"
                            required
                        >
                            <option value="" className="text-slate-400">Select Token</option>
                            {tokens.map((token) => (
                                <option key={token.id} value={token.id} className="font-sans py-2">
                                    {token.tokenNo} - {token.customer.name}
                                </option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                            <ChevronDown className="w-5 h-5" />
                        </div>
                    </div>
                </div>

                {/* Glassmorphic Customer Profile Card */}
                {selectedToken && (
                    <div className="bg-blue-600 rounded-2xl p-5 text-white shadow-xl shadow-blue-600/20 relative overflow-hidden group transition-all duration-500">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
                        <div className="relative z-10 flex justify-between items-start mb-4">
                            <div>
                                <h2 className="text-lg font-black tracking-tight">{selectedToken.customer.name}</h2>
                                <p className="text-blue-100 text-xs font-medium opacity-80">{selectedToken.customer.mobile}</p>
                            </div>
                            <div className="bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border border-white/20 tracking-tighter">
                                {selectedToken.tokenNo}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 relative z-10 p-3 bg-white/10 rounded-xl border border-white/5 backdrop-blur-sm">
                            <div>
                                <p className="text-blue-100 text-[10px] uppercase font-black tracking-widest opacity-60">Daily Plan</p>
                                <p className="text-lg font-black">{formatCurrency(selectedToken.dailyInstallment)}</p>
                            </div>
                            <div>
                                <p className="text-red-200 text-[10px] uppercase font-black tracking-widest opacity-60">Due Amount</p>
                                <p className="text-xl font-black text-red-100">{formatCurrency(selectedToken.todayDue)}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Premium Amount Input */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                        Collection Amount <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100">
                            <IndianRupee className="w-5 h-5 text-blue-600" />
                        </div>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0"
                            step="1"
                            min="0"
                            className="w-full pl-16 pr-4 py-4 text-2xl font-black bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-inner placeholder:text-slate-300"
                            required
                        />
                    </div>
                </div>

                {/* Professional Mode Switcher */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
                        Payment Mode <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { id: 'cash', label: 'Cash', icon: CreditCard, color: 'blue' },
                            { id: 'upi', label: 'UPI', icon: Smartphone, color: 'indigo' },
                            { id: 'bank_transfer', label: 'Bank', icon: Landmark, color: 'slate' }
                        ].map((mode) => (
                            <button
                                key={mode.id}
                                type="button"
                                onClick={() => setPaymentMode(mode.id)}
                                className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all group ${paymentMode === mode.id
                                    ? 'border-blue-600 bg-blue-50'
                                    : 'border-slate-50 bg-slate-50 hover:border-slate-200 text-slate-500'
                                    }`}
                            >
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${paymentMode === mode.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-white text-slate-400 border border-slate-100'
                                    }`}>
                                    <mode.icon className="w-5 h-5" />
                                </div>
                                <span className={`text-[10px] font-black uppercase tracking-widest ${paymentMode === mode.id ? 'text-blue-700' : 'text-slate-500'
                                    }`}>
                                    {mode.label}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Robust Photo & Remarks */}
                <div className="grid grid-cols-1 gap-6 pb-4">
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                            Remarks
                        </label>
                        <textarea
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            placeholder="Optional notes..."
                            rows={2}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none shadow-inner text-sm"
                        />
                    </div>

                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
                            Receipt Photo
                        </label>

                        {photo ? (
                            <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-lg group">
                                <img src={photo} alt="Receipt" className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-700" />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        type="button"
                                        onClick={() => setPhoto(null)}
                                        className="bg-white text-red-600 px-4 py-2 rounded-full font-black text-xs shadow-lg active:scale-95"
                                    >
                                        REPLACE PHOTO
                                    </button>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setPhoto(null)}
                                    className="absolute top-3 right-3 bg-red-600 text-white p-2 rounded-xl shadow-lg active:scale-90"
                                >
                                    ✕
                                </button>
                            </div>
                        ) : (
                            <label className="block w-full border-2 border-dashed border-slate-200 rounded-2xl p-8 hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer text-center group">
                                <input
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    onChange={handleCapture}
                                    className="hidden"
                                />
                                <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-100 transition-colors">
                                    <Camera className="w-6 h-6 text-slate-400 group-hover:text-blue-600" />
                                </div>
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest group-hover:text-blue-600">CAPture RECEIPT</p>
                            </label>
                        )}
                    </div>
                </div>

                {/* Professional Feedback & Submit */}
                <div className="fixed bottom-0 left-0 right-0 px-5 pb-6 pt-4 bg-white/80 backdrop-blur-md border-t border-slate-100 flex flex-col gap-3">
                    {error && (
                        <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex items-center gap-3 animate-shake">
                            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                            <p className="text-[10px] font-bold text-red-800 uppercase tracking-tight">{error}</p>
                        </div>
                    )}
                    {success && (
                        <div className="bg-green-50 border border-green-100 rounded-xl p-3 flex items-center gap-3">
                            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                            <p className="text-[10px] font-bold text-green-800 uppercase tracking-tight">Payment Recorded Successfully!</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !selectedTokenId || !amount}
                        className={`w-full py-4 rounded-2xl font-black text-white text-lg flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95 ${loading || !selectedTokenId || !amount
                            ? 'bg-slate-300 shadow-none cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-black shadow-blue-600/20'
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
        </div>
    )
}

export default function RecordPaymentPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center h-screen bg-white">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
            </div>
        }>
            <RecordPaymentContent />
        </Suspense>
    )
}

function ChevronDown(props: any) {
    return (
        <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
    )
}