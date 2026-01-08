'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
    ArrowLeft,
    ChevronRight,
    Search,
    User,
    Briefcase,
    IndianRupee,
    Calendar,
    Clock,
    Calculator,
    ShieldCheck,
    AlertCircle,
    Activity,
    CheckCircle2,
    ArrowRight
} from 'lucide-react'
import { formatCurrency, calculateTokenDetails } from '@/utils/calculations'
import { format } from 'date-fns'

interface Customer {
    id: number
    name: string
    mobile: string
}

interface Collector {
    id: number
    name: string
}

export default function CreateTokenPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [fetching, setFetching] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Form State
    const [customers, setCustomers] = useState<Customer[]>([])
    const [collectors, setCollectors] = useState<Collector[]>([])
    const [searchCustomer, setSearchCustomer] = useState('')
    const [searchCollector, setSearchCollector] = useState('')

    const [formData, setFormData] = useState({
        customerId: '',
        collectorId: '',
        loanAmount: '',
        interestType: 'percentage', // percentage or fixed
        interestValue: '',
        durationDays: '100',
        startDate: format(new Date(), 'yyyy-MM-dd'),
        quantity: '1' // Number of tokens to create
    })

    // Calculation Results
    const [calculations, setCalculations] = useState<{
        totalAmount: number
        dailyInstallment: number
        endDate: Date
    } | null>(null)

    useEffect(() => {
        fetchInitialData()
    }, [])

    useEffect(() => {
        if (formData.loanAmount && formData.interestValue && formData.durationDays) {
            try {
                const calcs = calculateTokenDetails({
                    loanAmount: parseFloat(formData.loanAmount),
                    interestType: formData.interestType as 'percentage' | 'fixed',
                    interestValue: parseFloat(formData.interestValue),
                    durationDays: parseInt(formData.durationDays),
                    startDate: new Date(formData.startDate)
                })
                setCalculations(calcs)
            } catch (e) {
                setCalculations(null)
            }
        } else {
            setCalculations(null)
        }
    }, [formData])

    const fetchInitialData = async () => {
        setFetching(true)
        try {
            const [custRes, collRes] = await Promise.all([
                fetch('/api/customers?pageSize=100&isActive=true'),
                fetch('/api/collectors?pageSize=100&isActive=true')
            ])

            const custData = await custRes.json()
            const collData = await collRes.json()

            if (custData.success) setCustomers(custData.data)
            if (collData.success) setCollectors(collData.data)
        } catch (err) {
            console.error('Failed to fetch data:', err)
            setError('Failed to load customers or collectors')
        } finally {
            setFetching(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.customerId || !formData.collectorId) {
            setError('Please select both a customer and a collector')
            return
        }

        setLoading(true)
        setError(null)

        try {
            const response = await fetch('/api/token-batches', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            const result = await response.json()

            if (result.success) {
                router.push('/admin/tokens')
            } else {
                setError(result.error || 'Failed to initialize token batch')
            }
        } catch (err) {
            setError('An unexpected error occurred')
        } finally {
            setLoading(false)
        }
    }

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchCustomer.toLowerCase()) ||
        c.mobile.includes(searchCustomer)
    )

    const filteredCollectors = collectors.filter(c =>
        c.name.toLowerCase().includes(searchCollector.toLowerCase())
    )

    if (fetching) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="w-12 h-12 border-4 border-slate-100 border-t-orange-600 rounded-full animate-spin"></div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 animate-pulse">Loading initialization data...</p>
            </div>
        )
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => router.back()}
                        className="p-3 text-slate-400 hover:text-slate-900 hover:bg-slate-50 border border-transparent hover:border-slate-200 rounded-xl transition-all active:scale-95"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Initialize New Token Batch</h1>
                        <p className="text-slate-500 text-sm mt-1">Create single or multiple tokens as a unified loan entity.</p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Form Section */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Customer Selection */}
                    <section className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center text-orange-600 border border-orange-100">
                                <User className="w-5 h-5" />
                            </div>
                            <h2 className="text-lg font-bold text-slate-900">1. Select Customer</h2>
                        </div>

                        <div className="space-y-6">
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Search by name or mobile number..."
                                    value={searchCustomer}
                                    onChange={(e) => setSearchCustomer(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-slate-900 font-medium placeholder:text-slate-400 transition-all text-sm"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {filteredCustomers.map((cust) => (
                                    <button
                                        key={cust.id}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, customerId: cust.id.toString() })}
                                        className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left group ${formData.customerId === cust.id.toString()
                                            ? 'bg-orange-50 border-orange-500 text-orange-900'
                                            : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                                            }`}
                                    >
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs border ${formData.customerId === cust.id.toString()
                                            ? 'bg-orange-500 text-white'
                                            : 'bg-slate-100 text-slate-400 group-hover:bg-white'
                                            }`}>
                                            {cust.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-sm truncate uppercase tracking-tight">
                                                {cust.name}
                                            </p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                {cust.mobile}
                                            </p>
                                        </div>
                                        {formData.customerId === cust.id.toString() && (
                                            <CheckCircle2 className="w-5 h-5 text-orange-500" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* Loan Parameters */}
                    <section className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center text-orange-600 border border-orange-100">
                                <IndianRupee className="w-5 h-5" />
                            </div>
                            <h2 className="text-lg font-bold text-slate-900">2. Loan Details</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Loan Amount (₹)</label>
                                <div className="relative group">
                                    <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                                    <input
                                        type="number"
                                        required
                                        placeholder="0"
                                        value={formData.loanAmount}
                                        onChange={(e) => setFormData({ ...formData, loanAmount: e.target.value })}
                                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-slate-900 font-bold transition-all text-sm"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Duration (Days)</label>
                                <div className="relative group">
                                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                                    <input
                                        type="number"
                                        required
                                        placeholder="100"
                                        value={formData.durationDays}
                                        onChange={(e) => setFormData({ ...formData, durationDays: e.target.value })}
                                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-slate-900 font-bold transition-all text-sm"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Interest Calculation</label>
                                <div className="flex p-1 bg-slate-50 rounded-xl border border-slate-200">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, interestType: 'percentage' })}
                                        className={`flex-1 py-2 px-4 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${formData.interestType === 'percentage'
                                            ? 'bg-white text-orange-600 shadow-sm'
                                            : 'text-slate-400 hover:text-slate-600'
                                            }`}
                                    >
                                        Percentage (%)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, interestType: 'fixed' })}
                                        className={`flex-1 py-2 px-4 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${formData.interestType === 'fixed'
                                            ? 'bg-white text-orange-600 shadow-sm'
                                            : 'text-slate-400 hover:text-slate-600'
                                            }`}
                                    >
                                        Fixed (₹)
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">
                                    {formData.interestType === 'percentage' ? 'Interest Rate (%)' : 'Interest Amount (₹)'}
                                </label>
                                <div className="relative group">
                                    <Calculator className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        placeholder="0.00"
                                        value={formData.interestValue}
                                        onChange={(e) => setFormData({ ...formData, interestValue: e.target.value })}
                                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-slate-900 font-bold transition-all text-sm"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Start Date</label>
                                <div className="relative group">
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                                    <input
                                        type="date"
                                        required
                                        value={formData.startDate}
                                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-slate-900 font-bold transition-all text-sm"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Quantity (Same Token)</label>
                                <div className="relative group">
                                    <Activity className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        max="50"
                                        value={formData.quantity}
                                        onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-slate-900 font-bold transition-all text-sm"
                                        placeholder="1"
                                    />
                                </div>
                                <p className="text-xs text-slate-500 ml-1">Number of identical tokens to create (max 50)</p>
                            </div>
                        </div>
                    </section>

                    {/* Collector Assignment */}
                    <section className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center text-orange-600 border border-orange-100">
                                <Briefcase className="w-5 h-5" />
                            </div>
                            <h2 className="text-lg font-bold text-slate-900">3. Assign Collector</h2>
                        </div>

                        <div className="space-y-6">
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Search active agents..."
                                    value={searchCollector}
                                    onChange={(e) => setSearchCollector(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-slate-900 font-medium placeholder:text-slate-400 transition-all text-sm"
                                />
                            </div>

                            <div className="flex flex-wrap gap-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                                {filteredCollectors.map((coll) => (
                                    <button
                                        key={coll.id}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, collectorId: coll.id.toString() })}
                                        className={`px-4 py-3 rounded-lg border transition-all text-left flex items-center gap-3 ${formData.collectorId === coll.id.toString()
                                            ? 'bg-slate-900 border-slate-900 text-white shadow-md'
                                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-600'
                                            }`}
                                    >
                                        <div className={`w-8 h-8 rounded flex items-center justify-center font-bold text-[10px] ${formData.collectorId === coll.id.toString()
                                            ? 'bg-white/10 text-white'
                                            : 'bg-slate-100 text-slate-400'
                                            }`}>
                                            {coll.name.substring(0, 1).toUpperCase()}
                                        </div>
                                        <span className="font-bold text-xs uppercase tracking-wider">{coll.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </section>
                </div>

                {/* Sidebar Summary & Finalize */}
                <div className="space-y-8">
                    <div className="sticky top-28 space-y-6">
                        {/* Summary Card */}
                        <div className="bg-slate-900 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden group">
                            <div className="relative z-10 flex flex-col h-full">
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center text-orange-500 border border-white/10">
                                        <Calculator className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-lg font-bold">Loan Summary</h3>
                                </div>

                                {calculations ? (
                                    <div className="space-y-6 flex-1">
                                        <div className="p-6 bg-white/5 rounded-xl border border-white/5">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Total Payable Amount</p>
                                            {/* Fix for large font overflow: Reduced from 5xl to 3xl and added flex/wrap */}
                                            <p className="text-3xl font-bold tracking-tight text-orange-400 overflow-hidden text-ellipsis whitespace-nowrap">
                                                {formatCurrency(calculations.totalAmount)}
                                            </p>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between py-3 border-b border-white/5">
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Quantity</p>
                                                <p className="text-sm font-bold text-orange-400">{formData.quantity} Token{parseInt(formData.quantity) > 1 ? 's' : ''}</p>
                                            </div>

                                            <div className="flex items-center justify-between py-3 border-b border-white/5">
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Combined Total</p>
                                                <p className="text-sm font-bold text-green-400">{formatCurrency(calculations.totalAmount * parseInt(formData.quantity || '1'))}</p>
                                            </div>

                                            <div className="flex items-center justify-between py-3 border-b border-white/5">
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Daily Payment (Each)</p>
                                                <p className="text-sm font-bold text-white">{formatCurrency(calculations.dailyInstallment)}</p>
                                            </div>

                                            <div className="flex items-center justify-between py-3 border-b border-white/5">
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">End Date</p>
                                                <p className="text-sm font-bold text-white">{format(calculations.endDate, 'dd MMM yyyy')}</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center py-10 text-center opacity-40">
                                        <Calculator className="w-10 h-10 text-slate-600 mb-4" />
                                        <p className="text-[10px] font-bold uppercase tracking-widest leading-relaxed">Enter loan details to view<br />financial summary</p>
                                    </div>
                                )}

                                <div className="mt-8">
                                    {error && (
                                        <div className="flex items-start gap-2 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl mb-6">
                                            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                                            <p className="text-[10px] font-bold text-rose-300 leading-normal uppercase tracking-wider">{error}</p>
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={loading || !calculations}
                                        className="w-full flex items-center justify-center gap-3 py-4 bg-orange-600 hover:bg-orange-500 disabled:bg-slate-800 disabled:opacity-50 text-white rounded-xl font-bold text-sm uppercase tracking-widest transition-all active:scale-95 shadow-md"
                                    >
                                        {loading ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        ) : (
                                            <>
                                                Create Token Batch
                                                <ArrowRight className="w-4 h-4" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-orange-600/10 rounded-full blur-2xl"></div>
                        </div>

                        {/* Note Card */}
                        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-3">Batch System Notes</h4>
                            <ul className="space-y-3">
                                <li className="flex items-start gap-3 text-[10px] font-medium text-slate-500 leading-relaxed">
                                    <div className="w-1 h-1 bg-slate-300 rounded-full shrink-0 mt-1.5"></div>
                                    <span>Multiple tokens treated as single loan entity for collection.</span>
                                </li>
                                <li className="flex items-start gap-3 text-[10px] font-medium text-slate-500 leading-relaxed">
                                    <div className="w-1 h-1 bg-slate-300 rounded-full shrink-0 mt-1.5"></div>
                                    <span>Combined daily amount collected as one payment.</span>
                                </li>
                                <li className="flex items-start gap-3 text-[10px] font-medium text-slate-500 leading-relaxed">
                                    <div className="w-1 h-1 bg-slate-300 rounded-full shrink-0 mt-1.5"></div>
                                    <span>Penalties calculated per token, waivable at collection time.</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    )
}
