'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ArrowLeft, IndianRupee, Calendar, User, Activity, TrendingUp, AlertCircle, CheckCircle2, Clock, Package, FileText, Wallet } from 'lucide-react'
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

export default function CollectorBatchDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const { data: session, status: sessionStatus } = useSession()
  const batchId = params.id as string

  const [loading, setLoading] = useState(true)
  const [batchData, setBatchData] = useState<BatchDetails | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  useEffect(() => {
    if (sessionStatus === 'loading') return

    if (!session || session?.user?.userType !== 'collector') {
      router.push('/login')
      return
    }

    fetchBatchDetails()
  }, [batchId, session, sessionStatus])

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

  if (loading || sessionStatus === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 animate-pulse">Loading...</p>
        </div>
      </div>
    )
  }

  if (error || !batchData) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-8 text-center max-w-md w-full border border-slate-200 shadow-sm">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <p className="text-lg font-bold text-slate-900 mb-2">{error || 'Batch not found'}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm transition-all hover:bg-blue-600"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  const { batch, summary } = batchData

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-32">
      {/* Header - Orange/Gray Theme to match collector panel */}
      <div className="bg-gradient-to-br from-orange-600 to-orange-500 pt-8 pb-12 px-6 relative overflow-hidden text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => router.back()}
              className="p-2 text-orange-100 hover:text-white hover:bg-white/10 rounded-xl transition-all active:scale-95"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-black tracking-tight">{batch.batchNo}</h1>
              <p className="text-orange-100 text-xs font-medium uppercase tracking-widest mt-1">
                {batch.quantity} Tokens Bundle
              </p>
            </div>
          </div>

          {batch.status !== 'closed' && (
            <button
              onClick={() => setShowPaymentModal(true)}
              className="w-full mt-4 px-6 py-3.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-xl font-bold text-sm transition-all active:scale-95 shadow-lg shadow-white/20 border border-white/20"
            >
              Record Payment
            </button>
          )}
        </div>
      </div>

      <div className="px-5 -mt-6 space-y-4">
        {/* Payment Summary Card */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-xl border border-white/10">
          <h3 className="text-sm font-bold mb-4 text-slate-400 uppercase tracking-widest">Payment Summary</h3>

          <div className="mb-6 p-5 bg-white/5 rounded-xl border border-white/10">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Outstanding</p>
            <p className="text-3xl font-black text-orange-400">{formatCurrency(summary.totalOutstanding)}</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-white/5">
              <p className="text-xs text-slate-400">Total Loan</p>
              <p className="text-sm font-bold">{formatCurrency(summary.totalScheduled)}</p>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-white/5">
              <p className="text-xs text-slate-400">Paid</p>
              <p className="text-sm font-bold text-green-400">{formatCurrency(summary.totalPaid)}</p>
            </div>

            {summary.totalPenaltyWaived > 0 && (
              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <p className="text-xs text-slate-400">Penalty Waived</p>
                <p className="text-sm font-bold text-amber-400">{formatCurrency(summary.totalPenaltyWaived)}</p>
              </div>
            )}

            <div className="flex items-center justify-between py-2 border-b border-white/5">
              <p className="text-xs text-slate-400">Pending Schedules</p>
              <p className="text-sm font-bold text-blue-400">{summary.pendingCount}</p>
            </div>

            {summary.overdueCount > 0 && (
              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <p className="text-xs text-slate-400">Overdue Schedules</p>
                <p className="text-sm font-bold text-rose-400">{summary.overdueCount}</p>
              </div>
            )}
          </div>

          {summary.todaySchedule && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Today's Due</p>
              <p className="text-2xl font-black text-orange-400">{formatCurrency(summary.todaySchedule.totalDue)}</p>
            </div>
          )}
        </div>

        {/* Batch Information */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-widest">Batch Info</h2>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Customer</p>
                <p className="text-sm font-bold text-slate-900">{batch.customer.name}</p>
                <p className="text-xs text-slate-500">{batch.customer.mobile}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center shrink-0">
                <Package className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Quantity</p>
                <p className="text-sm font-bold text-purple-600">{batch.quantity} Tokens</p>
                <p className="text-xs text-slate-500">{formatCurrency(batch.loanAmount)} each</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center shrink-0">
                <IndianRupee className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Daily Collection</p>
                <p className="text-sm font-bold text-orange-600">{formatCurrency(batch.totalDailyAmount)}</p>
                <p className="text-xs text-slate-500">Combined amount</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Total Loan</p>
                <p className="text-sm font-bold text-green-600">{formatCurrency(batch.totalBatchAmount)}</p>
                <p className="text-xs text-slate-500">All tokens combined</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Duration</p>
                <p className="text-sm font-bold text-slate-900">{batch.durationDays} Days</p>
                <p className="text-xs text-slate-500">
                  {format(new Date(batch.startDate), 'dd MMM')} - {format(new Date(batch.endDate), 'dd MMM yyyy')}
                </p>
              </div>
            </div>
          </div>

          {/* Token Numbers */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Token Numbers</p>
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

          {/* Status */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Status</p>
            <span
              className={`inline-flex items-center px-4 py-2 rounded-full text-xs font-bold ${
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

        {/* Recent Payments */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-widest">Recent Payments</h2>

          {batch.batchPayments.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Activity className="w-10 h-10 mx-auto mb-3 text-slate-300" />
              <p className="text-sm font-bold">No payments yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {batch.batchPayments.slice(0, 10).map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                      <IndianRupee className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{formatCurrency(payment.amount)}</p>
                      <p className="text-xs text-slate-500">{format(new Date(payment.paymentDate), 'dd MMM yyyy')}</p>
                    </div>
                  </div>
                  {payment.penaltyWaived > 0 && (
                    <span className="px-2 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-bold">
                      Waived: {formatCurrency(payment.penaltyWaived)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Nav - Consistent with collector panel */}
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
            className="flex flex-col items-center gap-1 text-orange-600"
          >
            <div className="p-2.5 rounded-2xl bg-orange-50 border-2 border-orange-200">
              <FileText className="w-5 h-5" />
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
