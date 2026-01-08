'use client'

import { useEffect, useState } from 'react'
import { Search, Plus, Calendar, IndianRupee, CreditCard, Smartphone, Building, X, FileText, ChevronRight, UserCog, AlertCircle, TrendingUp, Activity, Zap, CheckCircle2, Printer, Clock, AlertTriangle, History, Eye } from 'lucide-react'
import { formatCurrency } from '@/utils/calculations'
import { format } from 'date-fns'

interface Payment {
  id: number
  amount: number
  paymentDate: string
  paymentMode: string
  remarks: string | null
  penaltyWaived?: number
  token?: {
    tokenNo: string
    customer: {
      name: string
      mobile: string
    }
  }
  batch?: {
    batchNo: string
    quantity: number
    customer: {
      name: string
      mobile: string
    }
  }
  collector: {
    name: string
  }
  photoUrl: string | null
  schedule?: {
    scheduleDate: string
    totalPenalty?: number
  }
}

interface UpcomingPayment {
  id: number
  scheduleDate: string
  totalDue: number
  paidAmount: number
  outstanding: number
  status: string
  batch: {
    id: number
    batchNo: string
    quantity: number
    customer: {
      name: string
      mobile: string
    }
    collector: {
      name: string
      collectorId: string
    }
  }
  type: string
}

type TabType = 'history' | 'upcoming' | 'penalty-history' | 'penalty-collections'

export default function PaymentsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('history')
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dateFilter, setDateFilter] = useState<string>('all')
  const [collectorFilter, setCollectorFilter] = useState<string>('all')
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Data states
  const [payments, setPayments] = useState<Payment[]>([])
  const [upcomingPayments, setUpcomingPayments] = useState<UpcomingPayment[]>([])
  const [penaltyHistory, setPenaltyHistory] = useState<Payment[]>([])
  const [penaltyCollections, setPenaltyCollections] = useState<Payment[]>([])

  // Summary states
  const [todayTotal, setTodayTotal] = useState(0)
  const [weekTotal, setWeekTotal] = useState(0)
  const [monthTotal, setMonthTotal] = useState(0)
  const [penaltySummary, setPenaltySummary] = useState({ totalPenaltyWaived: 0, totalAmount: 0, count: 0 })

  // Details Modal State
  const [selectedPaymentForView, setSelectedPaymentForView] = useState<Payment | null>(null)
  const [showViewModal, setShowViewModal] = useState(false)

  const [collectors, setCollectors] = useState<Array<{ id: number; name: string; collectorId: string }>>([])

  useEffect(() => {
    fetchCollectors()
    fetchSummary()
  }, [])

  useEffect(() => {
    fetchData()
  }, [activeTab, page, search, dateFilter, collectorFilter])

  const fetchCollectors = async () => {
    try {
      const response = await fetch('/api/collectors?pageSize=100')
      const result = await response.json()
      if (result.success) {
        setCollectors(result.data.filter((c: any) => c.isActive))
      }
    } catch (error) {
      console.error('Failed to fetch collectors:', error)
    }
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: '20',
      })

      if (search) params.append('search', search)
      if (dateFilter !== 'all') params.append('dateFilter', dateFilter)
      if (collectorFilter !== 'all') params.append('collectorId', collectorFilter)

      let response
      if (activeTab === 'history') {
        // Fetch both batch payments and individual payments
        const [batchResponse, individualResponse] = await Promise.all([
          fetch(`/api/batch-payments?${params}`),
          fetch(`/api/payments?${params}`),
        ])
        const batchResult = await batchResponse.json()
        const individualResult = await individualResponse.json()

        const combined: Payment[] = []
        if (batchResult.success) {
          combined.push(...batchResult.data.map((p: any) => ({
            id: p.id,
            amount: Number(p.amount),
            paymentDate: p.paymentDate,
            paymentMode: p.paymentMode,
            remarks: p.remarks,
            penaltyWaived: Number(p.penaltyWaived || 0),
            batch: {
              batchNo: p.batch.batchNo,
              quantity: p.batch.quantity,
              customer: p.batch.customer,
            },
            collector: { name: p.batch.collector?.name || 'N/A' },
            photoUrl: null,
            schedule: p.schedule,
          })))
        }
        if (individualResult.success) {
          combined.push(...individualResult.data.map((p: any) => ({
            id: p.id,
            amount: Number(p.amount),
            paymentDate: p.paymentDate,
            paymentMode: p.paymentMode,
            remarks: p.remarks,
            token: p.token,
            collector: p.collector,
            photoUrl: p.photoUrl,
          })))
        }
        // Sort by date descending
        combined.sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
        setPayments(combined)
        setTotalPages(Math.max(batchResult.pagination?.totalPages || 1, individualResult.pagination?.totalPages || 1))
      } else if (activeTab === 'upcoming') {
        response = await fetch(`/api/payments/upcoming?${params}`)
        const result = await response.json()
        if (result.success) {
          setUpcomingPayments(result.data)
          setTotalPages(result.pagination?.totalPages || 1)
        }
      } else if (activeTab === 'penalty-history') {
        response = await fetch(`/api/payments/penalty-history?${params}`)
        const result = await response.json()
        if (result.success) {
          setPenaltyHistory(result.data.map((p: any) => ({
            id: p.id,
            amount: Number(p.amount),
            paymentDate: p.paymentDate,
            paymentMode: p.paymentMode,
            remarks: p.remarks,
            penaltyWaived: Number(p.penaltyWaived || 0),
            batch: {
              batchNo: p.batch.batchNo,
              quantity: p.batch.quantity,
              customer: p.batch.customer,
            },
            collector: { name: p.batch.collector?.name || 'N/A' },
            schedule: p.schedule,
          })))
          setTotalPages(result.pagination?.totalPages || 1)
        }
      } else if (activeTab === 'penalty-collections') {
        response = await fetch(`/api/payments/penalty-collections?${params}`)
        const result = await response.json()
        if (result.success) {
          setPenaltyCollections(result.data.map((p: any) => ({
            id: p.id,
            amount: Number(p.amount),
            paymentDate: p.paymentDate,
            paymentMode: p.paymentMode,
            remarks: p.remarks,
            penaltyWaived: Number(p.penaltyWaived || 0),
            batch: {
              batchNo: p.batch.batchNo,
              quantity: p.batch.quantity,
              customer: p.batch.customer,
            },
            collector: { name: p.batch.collector?.name || 'N/A' },
            schedule: p.schedule,
          })))
          if (result.summary) {
            setPenaltySummary(result.summary)
          }
          setTotalPages(result.pagination?.totalPages || 1)
        }
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
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

  const tabs = [
    { id: 'history' as TabType, label: 'Payment History', icon: History },
    { id: 'upcoming' as TabType, label: 'Upcoming', icon: Clock },
    { id: 'penalty-history' as TabType, label: 'Penalty History', icon: AlertTriangle },
    { id: 'penalty-collections' as TabType, label: 'Penalty Collections', icon: TrendingUp },
  ]

  const getCurrentData = () => {
    switch (activeTab) {
      case 'history':
        return payments
      case 'upcoming':
        return upcomingPayments
      case 'penalty-history':
        return penaltyHistory
      case 'penalty-collections':
        return penaltyCollections
      default:
        return []
    }
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Payments</h1>
          <p className="text-slate-500 text-sm mt-1">Track all payments, upcoming dues, and penalty collections.</p>
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

      {/* Penalty Collections Summary */}
      {activeTab === 'penalty-collections' && penaltySummary.count > 0 && (
        <div className="bg-gradient-to-r from-rose-50 to-orange-50 rounded-2xl p-6 border border-rose-200 shadow-sm">
          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mb-2">Total Penalty Waived</p>
              <p className="text-2xl font-bold text-rose-600 font-mono">{formatCurrency(penaltySummary.totalPenaltyWaived)}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mb-2">Total Collections</p>
              <p className="text-2xl font-bold text-rose-600 font-mono">{formatCurrency(penaltySummary.totalAmount)}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mb-2">Total Transactions</p>
              <p className="text-2xl font-bold text-rose-600 font-mono">{penaltySummary.count}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-2xl p-2 border border-slate-200 shadow-sm">
        <div className="flex gap-2 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id)
                  setPage(1)
                }}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-orange-600 text-white shadow-md'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by batch, customer or mobile..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-slate-900 font-medium placeholder:text-slate-400 transition-all text-sm"
            />
          </div>

          <div className="relative min-w-[180px]">
            <select
              value={collectorFilter}
              onChange={(e) => {
                setCollectorFilter(e.target.value)
                setPage(1)
              }}
              className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-slate-900 font-bold text-xs uppercase tracking-widest appearance-none transition-all cursor-pointer"
            >
              <option value="all">All Collectors</option>
              {collectors.map((collector) => (
                <option key={collector.id} value={collector.id}>
                  {collector.name}
                </option>
              ))}
            </select>
            <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90 pointer-events-none" />
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
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 animate-pulse">Loading...</p>
          </div>
        ) : getCurrentData().length === 0 ? (
          <div className="flex flex-col items-center justify-center p-20 text-slate-400 text-center">
            <IndianRupee className="w-12 h-12 text-slate-200 mb-4" />
            <p className="text-lg font-bold text-slate-900">No Data Found</p>
            <p className="text-sm text-slate-500 mt-1">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    {activeTab === 'upcoming' ? (
                      <>
                        <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Due Date</th>
                        <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Batch / Customer</th>
                        <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Collector</th>
                        <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Due Amount</th>
                        <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Outstanding</th>
                        <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                      </>
                    ) : (
                      <>
                        <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</th>
                        <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Batch / Token</th>
                        <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Customer</th>
                        <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Collector</th>
                        <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Amount</th>
                        {(activeTab === 'penalty-history' || activeTab === 'penalty-collections') && (
                          <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Penalty Waived</th>
                        )}
                        <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mode</th>
                        <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Actions</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeTab === 'upcoming' ? (
                    (getCurrentData() as UpcomingPayment[]).map((item) => (
                      <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-5">
                          <div>
                            <p className="text-xs font-bold text-slate-900 uppercase">
                              {format(new Date(item.scheduleDate), 'dd MMM yyyy')}
                            </p>
                            <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest">
                              {format(new Date(item.scheduleDate), 'EEEE')}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div>
                            <p className="text-sm font-bold text-slate-900 tracking-tight uppercase">{item.batch.batchNo}</p>
                            <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest">
                              {item.batch.customer.name} • {item.batch.quantity}x
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <p className="text-xs font-bold text-slate-600 uppercase tracking-tight">{item.batch.collector.name}</p>
                        </td>
                        <td className="px-6 py-5">
                          <p className="text-sm font-bold text-slate-900 font-mono">{formatCurrency(item.totalDue)}</p>
                        </td>
                        <td className="px-6 py-5">
                          <p className="text-sm font-bold text-orange-600 font-mono">{formatCurrency(item.outstanding)}</p>
                        </td>
                        <td className="px-6 py-5">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                              item.status === 'paid'
                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                : item.status === 'overdue'
                                ? 'bg-rose-50 text-rose-600 border border-rose-100'
                                : 'bg-orange-50 text-orange-600 border border-orange-100'
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    (getCurrentData() as Payment[]).map((payment) => (
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
                            <p className="text-sm font-bold text-slate-900 tracking-tight uppercase">
                              {payment.batch ? payment.batch.batchNo : payment.token?.tokenNo || 'N/A'}
                            </p>
                            {payment.batch && (
                              <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest">
                                {payment.batch.quantity}x Tokens
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <p className="text-xs font-bold text-slate-600 uppercase tracking-tight">
                            {payment.batch ? payment.batch.customer.name : payment.token?.customer.name || 'N/A'}
                          </p>
                          <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                            {payment.batch ? payment.batch.customer.mobile : payment.token?.customer.mobile || ''}
                          </p>
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
                        {(activeTab === 'penalty-history' || activeTab === 'penalty-collections') && (
                          <td className="px-6 py-5">
                            <p className="text-sm font-bold text-rose-600 font-mono">
                              {formatCurrency(payment.penaltyWaived || 0)}
                            </p>
                          </td>
                        )}
                        <td className="px-6 py-5">{getPaymentModeBadge(payment.paymentMode)}</td>
                        <td className="px-6 py-5 text-right whitespace-nowrap">
                          <button
                            onClick={() => {
                              setSelectedPaymentForView(payment)
                              setShowViewModal(true)
                            }}
                            className="px-4 py-2 bg-zinc-100 text-zinc-900 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-zinc-200 transition-all border border-slate-200"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
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
            fetchData()
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
            <p className="text-slate-500 text-xs mt-1">
              {payment.batch ? `Batch: ${payment.batch.batchNo}` : `Token: ${payment.token?.tokenNo}`}
            </p>
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

          {payment.penaltyWaived && payment.penaltyWaived > 0 && (
            <div className="bg-rose-50 p-6 rounded-2xl border border-rose-100">
              <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mb-2">Penalty Waived</p>
              <p className="text-xl font-bold text-rose-600 font-mono">{formatCurrency(payment.penaltyWaived)}</p>
            </div>
          )}

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
            Print
          </button>
        </div>
      </div>
    </div>
  )
}

function RecordPaymentModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeBatches, setActiveBatches] = useState<any[]>([])
  const [selectedBatch, setSelectedBatch] = useState<any>(null)
  const [batchDetails, setBatchDetails] = useState<any>(null)

  const [formData, setFormData] = useState({
    batchId: '',
    amount: '',
    paymentMode: 'cash' as 'cash' | 'upi' | 'bank_transfer',
    paymentDate: format(new Date(), 'yyyy-MM-dd'),
    penaltyWaived: '0',
    remarks: '',
  })

  useEffect(() => {
    fetchActiveBatches()
  }, [])

  useEffect(() => {
    if (formData.batchId) {
      const batch = activeBatches.find((b) => b.id === parseInt(formData.batchId))
      setSelectedBatch(batch || null)
      if (batch) {
        fetchBatchDetails(batch.id)
      }
    }
  }, [formData.batchId, activeBatches])

  useEffect(() => {
    if (batchDetails) {
      const todaySchedule = batchDetails.summary?.todaySchedule
      const nextSchedule = batchDetails.summary?.nextSchedule
      const defaultAmount = todaySchedule?.totalDue || nextSchedule?.totalDue || batchDetails.batch?.totalDailyAmount || ''
      setFormData((prev) => ({
        ...prev,
        amount: defaultAmount.toString(),
      }))
    }
  }, [batchDetails])

  const fetchActiveBatches = async () => {
    try {
      const response = await fetch('/api/token-batches?status=active&pageSize=1000')
      const result = await response.json()
      if (result.success) {
        setActiveBatches(result.data)
      }
    } catch (error) {
      console.error('Failed to fetch active batches:', error)
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
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/batch-payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId: parseInt(formData.batchId),
          amount: parseFloat(formData.amount),
          paymentMode: formData.paymentMode,
          paymentDate: formData.paymentDate,
          penaltyWaived: parseFloat(formData.penaltyWaived),
          remarks: formData.remarks
        }),
      })

      const result = await response.json()

      if (result.success) {
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
            <h2 className="text-xl font-bold text-slate-900">Record Batch Payment</h2>
            <p className="text-slate-500 text-xs mt-1">Enter transaction details for token batch.</p>
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
            {/* Batch Selection */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                Select Batch <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select
                  required
                  value={formData.batchId}
                  onChange={(e) => setFormData({ ...formData, batchId: e.target.value, amount: '' })}
                  className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-slate-900 font-bold transition-all text-sm appearance-none cursor-pointer uppercase"
                >
                  <option value="">Choose batch...</option>
                  {activeBatches.map((batch) => (
                    <option key={batch.id} value={batch.id}>
                      {batch.batchNo} — {batch.customer.name} ({batch.quantity}x)
                    </option>
                  ))}
                </select>
                <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90 pointer-events-none" />
              </div>
            </div>

            {/* Batch Details Preview */}
            {selectedBatch && batchDetails && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 animate-in slide-in-from-top-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-900">{selectedBatch.batchNo}</p>
                    <p className="text-[10px] text-slate-500">{selectedBatch.customer.name} • {selectedBatch.quantity} Tokens</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Daily Due</p>
                    <p className="text-sm font-bold text-orange-600">{formatCurrency(selectedBatch.totalDailyAmount)}</p>
                  </div>
                </div>
                {batchDetails.summary?.todaySchedule && (
                  <div className="pt-2 border-t border-slate-200">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Today's Due</p>
                    <p className="text-lg font-bold text-slate-900">{formatCurrency(batchDetails.summary.todaySchedule.totalDue)}</p>
                  </div>
                )}
              </div>
            )}

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

            {/* Penalty Waived */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                Penalty Waived (₹)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.penaltyWaived}
                onChange={(e) => setFormData({ ...formData, penaltyWaived: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-slate-900 font-bold transition-all"
                placeholder="0.00"
              />
              <p className="text-xs text-slate-500 mt-1">Enter amount of penalty to waive off</p>
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
