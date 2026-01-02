'use client'

import { useEffect, useState } from 'react'
import { Search, Plus, Calendar, IndianRupee, CreditCard, Smartphone, Building, X, FileText, ChevronRight, UserCog, AlertCircle, TrendingUp, Activity, Zap, CheckCircle2, Printer } from 'lucide-react'
import { formatCurrency } from '@/utils/calculations'
import { format } from 'date-fns'

interface Payment {
  id: number
  amount: number
  paymentDate: string
  paymentMode: string
  remarks: string | null
  token: {
    tokenNo: string
    customer: {
      name: string
      mobile: string
    }
  }
  collector: {
    name: string
  }
  photoUrl: string | null
}

interface Token {
  id: number
  tokenNo: string
  customerId: number
  customer: {
    name: string
    mobile: string
  }
  schedules: Array<{
    id: number
    scheduleDate: string
    installmentAmount: number
    penaltyAmount: number
    totalDue: number
    paidAmount: number
    status: string
  }>
  dailyInstallment: number
  totalAmount: number
}

interface Collector {
  id: number
  name: string
  collectorId: string
  isActive: boolean
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dateFilter, setDateFilter] = useState<string>('all')
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const [todayTotal, setTodayTotal] = useState(0)
  const [weekTotal, setWeekTotal] = useState(0)
  const [monthTotal, setMonthTotal] = useState(0)

  // Details Modal State
  const [selectedPaymentForView, setSelectedPaymentForView] = useState<Payment | null>(null)
  const [showViewModal, setShowViewModal] = useState(false)

  useEffect(() => {
    fetchPayments()
    fetchSummary()
  }, [page, search, dateFilter])

  const fetchPayments = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: '20',
      })

      if (search) params.append('search', search)
      if (dateFilter !== 'all') params.append('dateFilter', dateFilter)

      const response = await fetch(`/api/payments?${params}`)
      const result = await response.json()

      if (result.success) {
        setPayments(result.data)
        setTotalPages(result.pagination?.totalPages || 1)
      }
    } catch (error) {
      console.error('Failed to fetch payments:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSummary = async () => {
    try {
      const response = await fetch('/api/payments/summary')
      const result = await response.json()
      if (result.success) {
        setTodayTotal(result.data.today)
        setWeekTotal(result.data.week)
        setMonthTotal(result.data.month)
      }
    } catch (error) {
      console.error('Failed to fetch summary:', error)
    }
  }

  const getPaymentModeIcon = (mode: string) => {
    switch (mode) {
      case 'cash':
        return <IndianRupee className="w-3.5 h-3.5" />
      case 'upi':
        return <Smartphone className="w-3.5 h-3.5" />
      case 'bank_transfer':
        return <Building className="w-3.5 h-3.5" />
      default:
        return <CreditCard className="w-3.5 h-3.5" />
    }
  }

  const getPaymentModeBadge = (mode: string) => {
    const styles = {
      cash: 'bg-orange-50 text-orange-600 border-orange-100',
      upi: 'bg-slate-100 text-slate-700 border-slate-200',
      bank_transfer: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    }

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${styles[mode as keyof typeof styles] || styles.cash}`}>
        {getPaymentModeIcon(mode)}
        {mode.replace('_', ' ')}
      </span>
    )
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Payments</h1>
          <p className="text-slate-500 text-sm mt-1">Track collections, record payments, and monitor daily financial inflow.</p>
        </div>
        <button
          onClick={() => setShowPaymentModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white rounded-xl font-bold text-sm transition-all hover:bg-orange-600 active:scale-95 shadow-md"
        >
          <Plus className="w-5 h-5" />
          Record Payment
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Today's Collection", value: todayTotal, icon: IndianRupee, variant: "orange" },
          { label: "This Week", value: weekTotal, icon: Calendar, variant: "neutral" },
          { label: "This Month", value: monthTotal, icon: TrendingUp, variant: "neutral" }
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center gap-6">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.variant === 'orange' ? 'bg-orange-50 text-orange-600' : 'bg-slate-50 text-slate-600'}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
              <p className="text-xl font-bold text-slate-900 font-mono">{formatCurrency(stat.value)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by token, customer or mobile..."
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
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value)
                setPage(1)
              }}
              className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-slate-900 font-bold text-xs uppercase tracking-widest appearance-none transition-all cursor-pointer"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
            <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Content Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-20 gap-4">
            <div className="w-12 h-12 border-4 border-slate-100 border-t-orange-600 rounded-full animate-spin"></div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 animate-pulse">Loading Payments...</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-20 text-slate-400 text-center">
            <IndianRupee className="w-12 h-12 text-slate-200 mb-4" />
            <p className="text-lg font-bold text-slate-900">No Payments Found</p>
            <p className="text-sm text-slate-500 mt-1">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Timestamp
                    </th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Token / Customer
                    </th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Collector
                    </th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Mode
                    </th>
                    <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.map((payment) => (
                    <tr key={payment.id} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-5">
                        <div>
                          <p className="text-xs font-bold text-slate-900 uppercase">
                            {format(new Date(payment.paymentDate), 'dd MMM, hh:mm a')}
                          </p>
                          <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest">
                            {format(new Date(payment.paymentDate), 'yyyy')}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div>
                          <p className="text-sm font-bold text-slate-900 tracking-tight uppercase">{payment.token.tokenNo}</p>
                          <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest">{payment.token.customer.name}</p>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                            <UserCog className="w-4 h-4" />
                          </div>
                          <p className="text-xs font-bold text-slate-600 uppercase tracking-tight">{payment.collector.name}</p>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-sm font-bold text-emerald-600 font-mono">
                          {formatCurrency(payment.amount)}
                        </p>
                      </td>
                      <td className="px-6 py-5">{getPaymentModeBadge(payment.paymentMode)}</td>
                      <td className="px-6 py-5 text-right whitespace-nowrap">
                        <button
                          onClick={() => {
                            setSelectedPaymentForView(payment)
                            setShowViewModal(true)
                          }}
                          className="px-4 py-2 bg-zinc-100 text-zinc-900 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-zinc-200 transition-all border border-slate-200"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
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

      {/* Record Payment Modal */}
      {showPaymentModal && (
        <RecordPaymentModal
          onClose={() => setShowPaymentModal(false)}
          onSuccess={() => {
            setShowPaymentModal(false)
            fetchPayments()
            fetchSummary()
          }}
        />
      )}

      {/* View Details Modal */}
      {showViewModal && selectedPaymentForView && (
        <ViewPaymentModal
          payment={selectedPaymentForView}
          onClose={() => {
            setShowViewModal(false)
            setSelectedPaymentForView(null)
          }}
        />
      )}
    </div>
  )
}

function ViewPaymentModal({ payment, onClose }: { payment: Payment; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Payment Details</h2>
            <p className="text-slate-500 text-xs mt-1">Receipt for token {payment.token.tokenNo}</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 space-y-8">
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Payment Date</p>
              <p className="text-sm font-bold text-slate-900 uppercase">
                {format(new Date(payment.paymentDate), 'dd MMM yyyy')}
              </p>
              <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">
                at {format(new Date(payment.paymentDate), 'hh:mm a')}
              </p>
            </div>
            <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100">
              <p className="text-[10px] font-bold text-orange-400 uppercase tracking-widest mb-2">Amount Paid</p>
              <p className="text-2xl font-bold text-orange-600 font-mono leading-none">
                {formatCurrency(payment.amount)}
              </p>
              <p className="text-[10px] font-bold text-orange-400 uppercase mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Verified
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Collector</p>
              <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center text-orange-500 font-bold text-xs">
                  {payment.collector.name.charAt(0).toUpperCase()}
                </div>
                <p className="text-xs font-bold text-slate-900 uppercase">{payment.collector.name}</p>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Payment Mode</p>
              <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center text-white">
                  {payment.paymentMode === 'cash' ? <IndianRupee className="w-4 h-4" /> : payment.paymentMode === 'upi' ? <Smartphone className="w-4 h-4" /> : <Building className="w-4 h-4" />}
                </div>
                <p className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">{payment.paymentMode.replace('_', ' ')}</p>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Remarks</p>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 italic text-slate-600 text-xs leading-relaxed">
              {payment.remarks || 'No remarks provided.'}
            </div>
          </div>

          {payment.photoUrl && (
            <div className="space-y-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Receipt Image</p>
              <div className="rounded-2xl overflow-hidden border border-slate-100 shadow-sm relative group bg-slate-50">
                <img
                  src={payment.photoUrl}
                  alt="Receipt"
                  className="w-full h-auto object-contain max-h-[300px]"
                />
              </div>
            </div>
          )}
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-white hover:bg-slate-100 text-slate-600 rounded-xl font-bold text-xs uppercase tracking-widest border border-slate-200 transition-all"
          >
            Close
          </button>
          <button
            onClick={() => window.print()}
            className="flex-1 py-3 bg-zinc-900 hover:bg-orange-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Print Receipt
          </button>
        </div>
      </div>
    </div>
  )
}

function RecordPaymentModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeTokens, setActiveTokens] = useState<Token[]>([])
  const [collectors, setCollectors] = useState<Collector[]>([])
  const [selectedToken, setSelectedToken] = useState<Token | null>(null)
  const [pendingSchedules, setPendingSchedules] = useState<Token['schedules']>([])

  const [formData, setFormData] = useState({
    tokenId: '',
    scheduleId: '',
    collectorId: '',
    amount: '',
    paymentMode: 'cash' as 'cash' | 'upi' | 'bank_transfer',
    paymentDate: format(new Date(), 'yyyy-MM-dd'),
    remarks: '',
  })

  useEffect(() => {
    fetchActiveTokens()
    fetchCollectors()
  }, [])

  useEffect(() => {
    if (formData.tokenId) {
      const token = activeTokens.find((t) => t.id === parseInt(formData.tokenId))
      setSelectedToken(token || null)
      if (token) {
        const pending = token.schedules.filter((s) => s.status === 'pending' || s.status === 'overdue')
        setPendingSchedules(pending)
        const today = format(new Date(), 'yyyy-MM-dd')
        const todaySchedule = pending.find((s) => {
          try {
            const scheduleDate = new Date(s.scheduleDate)
            if (isNaN(scheduleDate.getTime())) return false
            return format(scheduleDate, 'yyyy-MM-dd') === today
          } catch {
            return false
          }
        })
        if (todaySchedule) {
          setFormData((prev) => ({
            ...prev,
            scheduleId: todaySchedule.id.toString(),
            amount: todaySchedule.totalDue.toString(),
          }))
        }
      }
    }
  }, [formData.tokenId, activeTokens])

  useEffect(() => {
    if (formData.scheduleId && selectedToken) {
      const schedule = pendingSchedules.find((s) => s.id === parseInt(formData.scheduleId))
      if (schedule) {
        setFormData((prev) => ({ ...prev, amount: schedule.totalDue.toString() }))
      }
    }
  }, [formData.scheduleId, selectedToken, pendingSchedules])

  const fetchActiveTokens = async () => {
    try {
      const response = await fetch('/api/tokens?status=active&pageSize=1000')
      const result = await response.json()
      if (result.success) {
        const tokensWithSchedules = await Promise.all(
          result.data.map(async (token: any) => {
            const detailResponse = await fetch(`/api/tokens/${token.id}`)
            const detailResult = await detailResponse.json()
            return detailResult.success ? detailResult.data : token
          })
        )
        setActiveTokens(tokensWithSchedules)
      }
    } catch (error) {
      console.error('Failed to fetch active tokens:', error)
    }
  }

  const fetchCollectors = async () => {
    try {
      const response = await fetch('/api/collectors?pageSize=100')
      const result = await response.json()
      if (result.success) {
        setCollectors(result.data.filter((c: Collector) => c.isActive))
      }
    } catch (error) {
      console.error('Failed to fetch collectors:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (response.ok) {
        onSuccess()
      } else {
        setError(result.error || 'Failed to record payment')
      }
    } catch (err) {
      setError('Failed to record payment')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Record Payment</h2>
            <p className="text-slate-500 text-xs mt-1">Enter transaction details below.</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-[10px] font-bold uppercase tracking-widest flex items-center gap-3">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Token Selection */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                Select Token <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select
                  required
                  value={formData.tokenId}
                  onChange={(e) => setFormData({ ...formData, tokenId: e.target.value, scheduleId: '' })}
                  className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-slate-900 font-bold transition-all text-sm appearance-none cursor-pointer uppercase"
                >
                  <option value="">Choose token...</option>
                  {activeTokens.map((token) => (
                    <option key={token.id} value={token.id}>
                      {token.tokenNo} — {token.customer.name}
                    </option>
                  ))}
                </select>
                <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90 pointer-events-none" />
              </div>
            </div>

            {/* Schedule Selection */}
            {pendingSchedules.length > 0 && (
              <div className="space-y-1.5 animate-in slide-in-from-top-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                  Select Installment <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    required
                    value={formData.scheduleId}
                    onChange={(e) => setFormData({ ...formData, scheduleId: e.target.value })}
                    className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-slate-900 font-bold transition-all text-sm appearance-none cursor-pointer uppercase"
                  >
                    <option value="">Select date...</option>
                    {pendingSchedules.map((schedule) => (
                      <option key={schedule.id} value={schedule.id}>
                        {format(new Date(schedule.scheduleDate), 'dd MMM yyyy')} — DUE: {formatCurrency(schedule.totalDue)}
                      </option>
                    ))}
                  </select>
                  <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90 pointer-events-none" />
                </div>
              </div>
            )}

            {/* Collector Selection */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                Select Collector <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select
                  required
                  value={formData.collectorId}
                  onChange={(e) => setFormData({ ...formData, collectorId: e.target.value })}
                  className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-slate-900 font-bold transition-all text-sm appearance-none cursor-pointer uppercase"
                >
                  <option value="">Choose collector...</option>
                  {collectors.map((collector) => (
                    <option key={collector.id} value={collector.id}>
                      {collector.name} ({collector.collectorId})
                    </option>
                  ))}
                </select>
                <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90 pointer-events-none" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                  Payment Amount <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                  <input
                    type="number"
                    required
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-emerald-50 border border-emerald-100 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-emerald-700 text-lg font-bold transition-all font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                  Payment Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.paymentDate}
                  onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-slate-900 font-bold transition-all text-sm"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                Payment Mode <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'cash', label: 'Cash', icon: IndianRupee },
                  { id: 'upi', label: 'UPI', icon: Smartphone },
                  { id: 'bank_transfer', label: 'Bank', icon: Building }
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, paymentMode: m.id as any })}
                    className={`py-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${formData.paymentMode === m.id
                      ? 'bg-zinc-900 border-zinc-900 text-orange-500 shadow-md'
                      : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-300'
                      }`}
                  >
                    <m.icon className="w-5 h-5" />
                    <span className="font-bold text-[10px] uppercase tracking-widest">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Remarks</label>
              <textarea
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                rows={2}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-slate-900 font-medium transition-all text-sm resize-none"
                placeholder="Optional notes..."
              />
            </div>
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
              className="flex-[2] px-4 py-3 bg-zinc-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-orange-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <Activity className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Save Payment
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}