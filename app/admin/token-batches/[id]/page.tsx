'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, IndianRupee, Calendar, User, Activity, TrendingUp, AlertCircle, CheckCircle2, Clock, Package } from 'lucide-react'
import { formatCurrency } from '@/utils/calculations'
import { format } from 'date-fns'

interface BatchDetails {
  batch: {
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
      id: number
      name: string
      mobile: string
      address: string
    }
    collector: {
      id: number
      name: string
      collectorId: string
      mobile: string
    }
    tokens: {
      id: number
      tokenNo: string
      status: string
    }[]
    batchSchedules: {
      id: number
      scheduleDate: string
      installmentAmount: number
      penaltyPerToken: number
      totalPenalty: number
      totalDue: number
      paidAmount: number
      penaltyWaived: number
      status: string
    }[]
    batchPayments: {
      id: number
      amount: number
      penaltyWaived: number
      paymentMode: string
      paymentDate: string
      createdAt: string
      schedule: {
        scheduleDate: string
      }
    }[]
  }
  summary: {
    totalScheduled: number
    totalPaid: number
    totalPenaltyWaived: number
    totalOutstanding: number
    pendingCount: number
    overdueCount: number
    paidCount: number
    todaySchedule: any
    nextSchedule: any
  }
}

export default function BatchDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const batchId = params.id as string

  const [loading, setLoading] = useState(true)
  const [batchData, setBatchData] = useState<BatchDetails | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  useEffect(() => {
    fetchBatchDetails()
  }, [batchId])

  const fetchBatchDetails = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/token-batches/${batchId}`)
      const result = await response.json()

      if (result.success) {
        setBatchData(result.data)
      } else {
        setError(result.error || 'Failed to fetch batch details')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-slate-100 border-t-orange-600 rounded-full animate-spin"></div>
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 animate-pulse">Loading batch details...</p>
      </div>
    )
  }

  if (error || !batchData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertCircle className="w-12 h-12 text-rose-500" />
        <p className="text-lg font-bold text-slate-900">{error || 'Batch not found'}</p>
        <button
          onClick={() => router.back()}
          className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm transition-all hover:bg-orange-600"
        >
          Go Back
        </button>
      </div>
    )
  }

  const { batch, summary } = batchData

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
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
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{batch.batchNo}</h1>
            <p className="text-slate-500 text-sm mt-1">Batch of {batch.quantity} tokens as single loan entity</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowPaymentModal(true)}
            disabled={batch.status === 'closed'}
            className="px-6 py-3 bg-orange-600 hover:bg-orange-500 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-bold text-sm transition-all active:scale-95 shadow-md"
          >
            Record Payment
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Customer & Batch Info */}
          <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-6">Batch Information</h2>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Customer</p>
                <p className="text-lg font-bold text-slate-900">{batch.customer.name}</p>
                <p className="text-sm text-slate-500">{batch.customer.mobile}</p>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Collector</p>
                <p className="text-lg font-bold text-slate-900">{batch.collector.name}</p>
                <p className="text-sm text-slate-500">{batch.collector.collectorId}</p>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Quantity</p>
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-purple-600" />
                  <p className="text-lg font-bold text-purple-600">{batch.quantity} Tokens</p>
                </div>
                <p className="text-sm text-slate-500">{formatCurrency(batch.loanAmount)} each</p>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Duration</p>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <p className="text-lg font-bold text-blue-600">{batch.durationDays} Days</p>
                </div>
                <p className="text-sm text-slate-500">{format(new Date(batch.startDate), 'dd MMM')} - {format(new Date(batch.endDate), 'dd MMM yyyy')}</p>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Daily Collection</p>
                <p className="text-lg font-bold text-orange-600">{formatCurrency(batch.totalDailyAmount)}</p>
                <p className="text-sm text-slate-500">Combined amount</p>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Total Loan</p>
                <p className="text-lg font-bold text-green-600">{formatCurrency(batch.totalBatchAmount)}</p>
                <p className="text-sm text-slate-500">All tokens combined</p>
              </div>
            </div>

            {/* Token Numbers */}
            <div className="mt-6 pt-6 border-t border-slate-100">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Individual Token Numbers</p>
              <div className="flex flex-wrap gap-2">
                {batch.tokens.map((token) => (
                  <span
                    key={token.id}
                    className="px-3 py-1 bg-slate-50 text-slate-600 rounded-lg text-xs font-bold border border-slate-200"
                  >
                    {token.tokenNo}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Payments */}
          <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-6">Recent Payments</h2>

            {batch.batchPayments.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Activity className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                <p className="text-sm font-bold">No payments recorded yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {batch.batchPayments.slice(0, 5).map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                        <IndianRupee className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{formatCurrency(payment.amount)}</p>
                        <p className="text-xs text-slate-500">{format(new Date(payment.paymentDate), 'dd MMM yyyy')}</p>
                      </div>
                    </div>
                    {payment.penaltyWaived > 0 && (
                      <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-xs font-bold">
                        Penalty waived: {formatCurrency(payment.penaltyWaived)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - Summary */}
        <div className="space-y-8">
          {/* Payment Summary */}
          <div className="bg-slate-900 rounded-2xl p-8 text-white shadow-xl">
            <h3 className="text-lg font-bold mb-6">Payment Summary</h3>

            <div className="space-y-6">
              <div className="p-6 bg-white/5 rounded-xl border border-white/10">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Total Outstanding</p>
                <p className="text-3xl font-bold text-orange-400">{formatCurrency(summary.totalOutstanding)}</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-white/5">
                  <p className="text-xs text-slate-400">Total Scheduled</p>
                  <p className="text-sm font-bold">{formatCurrency(summary.totalScheduled)}</p>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-white/5">
                  <p className="text-xs text-slate-400">Total Paid</p>
                  <p className="text-sm font-bold text-green-400">{formatCurrency(summary.totalPaid)}</p>
                </div>

                {summary.totalPenaltyWaived > 0 && (
                  <div className="flex items-center justify-between py-3 border-b border-white/5">
                    <p className="text-xs text-slate-400">Penalty Waived</p>
                    <p className="text-sm font-bold text-amber-400">{formatCurrency(summary.totalPenaltyWaived)}</p>
                  </div>
                )}

                <div className="flex items-center justify-between py-3 border-b border-white/5">
                  <p className="text-xs text-slate-400">Pending Schedules</p>
                  <p className="text-sm font-bold text-blue-400">{summary.pendingCount}</p>
                </div>

                {summary.overdueCount > 0 && (
                  <div className="flex items-center justify-between py-3 border-b border-white/5">
                    <p className="text-xs text-slate-400">Overdue Schedules</p>
                    <p className="text-sm font-bold text-rose-400">{summary.overdueCount}</p>
                  </div>
                )}

                <div className="flex items-center justify-between py-3">
                  <p className="text-xs text-slate-400">Paid Schedules</p>
                  <p className="text-sm font-bold text-emerald-400">{summary.paidCount}</p>
                </div>
              </div>
            </div>

            {summary.todaySchedule && (
              <div className="mt-6 pt-6 border-t border-white/10">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Today's Due</p>
                <p className="text-2xl font-bold text-orange-400">{formatCurrency(summary.todaySchedule.totalDue)}</p>
              </div>
            )}
          </div>

          {/* Status Badge */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Batch Status</p>
            <span
              className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold ${
                batch.status === 'active'
                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                  : batch.status === 'closed'
                  ? 'bg-slate-100 text-slate-600 border border-slate-200'
                  : 'bg-rose-50 text-rose-600 border border-rose-100'
              }`}
            >
              {batch.status.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          batch={batch}
          summary={summary}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={() => {
            setShowPaymentModal(false)
            fetchBatchDetails()
          }}
        />
      )}
    </div>
  )
}

// Payment Modal Component
function PaymentModal({ batch, summary, onClose, onSuccess }: any) {
  const [formData, setFormData] = useState({
    amount: summary.todaySchedule?.totalDue || summary.nextSchedule?.totalDue || batch.totalDailyAmount,
    paymentMode: 'cash',
    paymentDate: format(new Date(), 'yyyy-MM-dd'),
    penaltyWaived: '0',
    remarks: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/batch-payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId: batch.id,
          amount: parseFloat(formData.amount),
          paymentMode: formData.paymentMode,
          paymentDate: formData.paymentDate,
          penaltyWaived: parseFloat(formData.penaltyWaived),
          remarks: formData.remarks
        })
      })

      const result = await response.json()

      if (result.success) {
        onSuccess()
      } else {
        setError(result.error || 'Failed to record payment')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Record Batch Payment</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Amount */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1 block mb-2">
                Payment Amount (₹)
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-slate-900 font-bold"
              />
              <p className="text-xs text-slate-500 mt-2">Daily due: {formatCurrency(batch.totalDailyAmount)}</p>
            </div>

            {/* Payment Date */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1 block mb-2">
                Payment Date
              </label>
              <input
                type="date"
                required
                value={formData.paymentDate}
                onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-slate-900 font-bold"
              />
            </div>

            {/* Payment Mode */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1 block mb-2">
                Payment Mode
              </label>
              <select
                value={formData.paymentMode}
                onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-slate-900 font-bold"
              >
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="bank_transfer">Bank Transfer</option>
              </select>
            </div>

            {/* Penalty Waived */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1 block mb-2">
                Penalty Waived (₹)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.penaltyWaived}
                onChange={(e) => setFormData({ ...formData, penaltyWaived: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-slate-900 font-bold"
              />
              <p className="text-xs text-slate-500 mt-2">Enter amount of penalty to waive off</p>
            </div>

            {/* Remarks */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1 block mb-2">
                Remarks (Optional)
              </label>
              <textarea
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-slate-900 font-medium"
                placeholder="Add any notes..."
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 p-4 bg-rose-50 border border-rose-100 rounded-xl">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <p className="text-sm text-rose-600">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-xl font-bold text-sm transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-orange-600 hover:bg-orange-500 disabled:bg-slate-300 text-white rounded-xl font-bold text-sm transition-all"
              >
                {loading ? 'Recording...' : 'Record Payment'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
