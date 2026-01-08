'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Calendar, Download, Filter, Package, IndianRupee, TrendingUp, Eye } from 'lucide-react'
import { formatCurrency } from '@/utils/calculations'
import { format } from 'date-fns'

interface BatchReport {
  id: number
  batchNo: string
  quantity: number
  totalBatchAmount: number
  totalDailyAmount: number
  startDate: string
  endDate: string
  status: string
  customer: {
    name: string
    mobile: string
  }
  collector: {
    name: string
    collectorId: string
  }
  batchSchedules: {
    scheduleDate: string
    totalDue: number
    paidAmount: number
    status: string
  }[]
}

export default function BatchCollectionReportPage() {
  const router = useRouter()
  const [batches, setBatches] = useState<BatchReport[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  useEffect(() => {
    fetchBatches()
  }, [filterStatus])

  const fetchBatches = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        pageSize: '100',
      })

      if (filterStatus !== 'all') params.append('status', filterStatus)

      const response = await fetch(`/api/token-batches?${params}`)
      const result = await response.json()

      if (result.success) {
        setBatches(result.data)
      }
    } catch (error) {
      console.error('Failed to fetch batches:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate summary statistics
  const calculateSummary = () => {
    let totalBatches = batches.length
    let totalLoanAmount = 0
    let totalCollected = 0
    let totalOutstanding = 0

    batches.forEach(batch => {
      totalLoanAmount += Number(batch.totalBatchAmount)
      batch.batchSchedules.forEach(schedule => {
        totalCollected += Number(schedule.paidAmount)
        totalOutstanding += (Number(schedule.totalDue) - Number(schedule.paidAmount))
      })
    })

    return {
      totalBatches,
      totalLoanAmount,
      totalCollected,
      totalOutstanding,
      collectionRate: totalLoanAmount > 0 ? (totalCollected / totalLoanAmount) * 100 : 0
    }
  }

  const summary = calculateSummary()

  const filteredBatches = batches.filter(batch => {
    const searchMatch = search === '' ||
      batch.batchNo.toLowerCase().includes(search.toLowerCase()) ||
      batch.customer.name.toLowerCase().includes(search.toLowerCase()) ||
      batch.customer.mobile.includes(search)

    return searchMatch
  })

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Batch Collection Report</h1>
          <p className="text-slate-500 text-sm mt-1">View all token batches treated as unified loan entities</p>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white rounded-xl font-bold text-sm transition-all hover:bg-orange-600 active:scale-95 shadow-md"
        >
          <Download className="w-5 h-5" />
          Export Report
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Total Batches</p>
          </div>
          <p className="text-3xl font-bold text-slate-900">{summary.totalBatches}</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <IndianRupee className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Total Loan</p>
          </div>
          <p className="text-3xl font-bold text-slate-900">{formatCurrency(summary.totalLoanAmount)}</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Collected</p>
          </div>
          <p className="text-3xl font-bold text-green-600">{formatCurrency(summary.totalCollected)}</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
              <IndianRupee className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Outstanding</p>
          </div>
          <p className="text-3xl font-bold text-orange-600">{formatCurrency(summary.totalOutstanding)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by batch, customer, mobile..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-slate-900 font-medium placeholder:text-slate-400 transition-all text-sm"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-slate-900 font-bold text-xs uppercase tracking-widest appearance-none transition-all cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="closed">Closed</option>
            <option value="overdue">Overdue</option>
          </select>

          <button
            onClick={fetchBatches}
            className="px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-bold text-sm transition-all active:scale-95"
          >
            Apply Filters
          </button>
        </div>
      </div>

      {/* Report Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-20 gap-4">
            <div className="w-12 h-12 border-4 border-slate-100 border-t-orange-600 rounded-full animate-spin"></div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 animate-pulse">Loading report...</p>
          </div>
        ) : filteredBatches.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-20 text-slate-400 text-center">
            <Package className="w-12 h-12 text-slate-200 mb-4" />
            <p className="text-lg font-bold text-slate-900">No Batches Found</p>
            <p className="text-sm text-slate-500 mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Batch No</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Customer</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Quantity</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Loan</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Daily Amount</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Collection Status</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBatches.map((batch) => {
                  const totalDue = batch.batchSchedules.reduce((sum, s) => sum + Number(s.totalDue), 0)
                  const totalPaid = batch.batchSchedules.reduce((sum, s) => sum + Number(s.paidAmount), 0)
                  const collectionPercent = totalDue > 0 ? (totalPaid / totalDue) * 100 : 0

                  return (
                    <tr key={batch.id} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center text-orange-600 font-bold text-xs border border-orange-100">
                            {batch.quantity}x
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">{batch.batchNo}</p>
                            <p className="text-xs text-slate-400">{format(new Date(batch.startDate), 'dd MMM yyyy')}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div>
                          <p className="text-sm font-bold text-slate-900 uppercase">{batch.customer.name}</p>
                          <p className="text-xs text-slate-400">{batch.customer.mobile}</p>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-sm font-bold text-purple-600">{batch.quantity} Tokens</p>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-sm font-bold text-slate-900 font-mono">{formatCurrency(batch.totalBatchAmount)}</p>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-sm font-bold text-blue-600 font-mono">{formatCurrency(batch.totalDailyAmount)}</p>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                collectionPercent >= 100 ? 'bg-green-500' :
                                collectionPercent >= 50 ? 'bg-blue-500' :
                                'bg-orange-500'
                              }`}
                              style={{ width: `${Math.min(collectionPercent, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-slate-600 min-w-[50px] text-right">
                            {collectionPercent.toFixed(0)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase ${
                            batch.status === 'active'
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                              : batch.status === 'closed'
                              ? 'bg-slate-100 text-slate-600 border border-slate-200'
                              : 'bg-rose-50 text-rose-600 border border-rose-100'
                          }`}
                        >
                          {batch.status}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <button
                          onClick={() => router.push(`/admin/token-batches/${batch.id}`)}
                          className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
                          title="View Details"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
