'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { Search, Filter, Eye, IndianRupee, AlertCircle, TrendingUp, FileText, Clock, ChevronRight, Plus, Wallet } from 'lucide-react'
import { formatCurrency } from '@/utils/calculations'

interface TokenBatch {
  id: number
  batchNo: string
  quantity: number
  totalBatchAmount: number
  totalDailyAmount: number
  durationDays: number
  status: string
  startDate: string
  customer: {
    name: string
    mobile: string
  }
  batchSchedules: {
    scheduleDate: string
    totalDue: number
    paidAmount: number
    status: string
  }[]
}

export default function MyTokensPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [batches, setBatches] = useState<TokenBatch[]>([])
  const [filteredBatches, setFilteredBatches] = useState<TokenBatch[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    if (status === 'loading') return

    if (!session || session?.user?.userType !== 'collector') {
      router.push('/login')
      return
    }
    fetchTokens()
  }, [session, status])

  useEffect(() => {
    filterBatches()
  }, [searchQuery, statusFilter, batches])

  const fetchTokens = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/collectors/token-batches')
      const result = await response.json()

      if (result.success) {
        setBatches(result.data)
        setFilteredBatches(result.data)
      }
    } catch (error) {
      console.error('Failed to fetch batches:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterBatches = () => {
    let filtered = batches
    if (searchQuery) {
      filtered = filtered.filter(
        (batch) =>
          batch.batchNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
          batch.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          batch.customer.mobile.includes(searchQuery)
      )
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter((batch) => batch.status === statusFilter)
    }
    setFilteredBatches(filtered)
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-50 text-green-700 border-green-200'
      case 'overdue':
        return 'bg-red-50 text-red-700 border-red-200'
      case 'closed':
        return 'bg-slate-100 text-slate-600 border-slate-200'
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-orange-50 to-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-50 pb-24 font-sans">
      {/* Premium Header - Orange Theme */}
      <div className="bg-gradient-to-br from-orange-600 via-orange-500 to-orange-600 pt-8 pb-12 px-6 relative overflow-hidden text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black tracking-tight">Token Batches</h1>
              <p className="text-orange-100 text-xs font-bold uppercase tracking-widest mt-1">{filteredBatches.length} Batches</p>
            </div>
            <button
              onClick={() => router.push('/collectors/tokens/create')}
              className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-4 py-2.5 rounded-2xl flex items-center gap-2 font-black transition-all shadow-lg shadow-white/20 border border-white/20"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">New Batch</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="px-5 -mt-6 mb-6">
        <div className="bg-white rounded-2xl shadow-xl border-2 border-slate-100 p-4 space-y-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-orange-600 transition-colors" />
            <input
              type="text"
              placeholder="Search Customer or Batch..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl pl-12 pr-4 py-3 text-sm font-black focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all shadow-inner"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {['all', 'active', 'overdue', 'closed'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${statusFilter === status
                    ? 'bg-gradient-to-r from-orange-600 to-orange-500 text-white border-orange-600 shadow-lg shadow-orange-500/30'
                    : 'bg-slate-50 text-slate-500 border-slate-100 hover:border-slate-300'
                  }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Modern Batch Cards */}
      <div className="px-5 space-y-4">
        {filteredBatches.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center border border-slate-100">
            <AlertCircle className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">No matching batches</p>
          </div>
        ) : (
          filteredBatches.map((batch) => {
            const totalDue = batch.batchSchedules.reduce((sum, s) => sum + Number(s.totalDue), 0)
            const totalPaid = batch.batchSchedules.reduce((sum, s) => sum + Number(s.paidAmount), 0)
            const totalOutstanding = totalDue - totalPaid
            const todaySchedule = batch.batchSchedules.find(s => {
              const schedDate = new Date(s.scheduleDate)
              const today = new Date()
              schedDate.setHours(0, 0, 0, 0)
              today.setHours(0, 0, 0, 0)
              return schedDate.getTime() === today.getTime()
            })
            const todayDue = todaySchedule ? Number(todaySchedule.totalDue) - Number(todaySchedule.paidAmount) : 0
            const hasOverdue = batch.batchSchedules.some(s => s.status === 'overdue')

            return (
              <div
                key={batch.id}
                className="bg-white rounded-2xl shadow-lg border-2 border-slate-100 overflow-hidden active:scale-[0.98] transition-all hover:border-orange-200 hover:shadow-xl"
                onClick={() => router.push(`/collectors/token-batches/${batch.id}`)}
              >
                <div className="p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-3">
                      <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center border border-orange-100">
                        <span className="text-orange-600 font-black text-xs">{batch.quantity}x</span>
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900 tracking-tight">{batch.batchNo}</p>
                        <p className="text-xs text-slate-500 font-medium">{batch.customer.name}</p>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter border ${getStatusStyle(batch.status)}`}>
                      {batch.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div>
                      <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Daily</p>
                      <p className="text-sm font-black text-slate-900">{formatCurrency(batch.totalDailyAmount)}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Outstanding</p>
                      <p className="text-sm font-black text-slate-900">{formatCurrency(totalOutstanding)}</p>
                    </div>
                  </div>

                  {batch.status !== 'closed' && (
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-50">
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                          {hasOverdue ? 'Overdue Amt' : "Today's Due"}
                        </p>
                        <p className={`text-xl font-black ${hasOverdue ? 'text-red-600' : 'text-orange-600'}`}>
                          {formatCurrency(todayDue)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/collectors/token-batches/${batch.id}`)
                          }}
                          className="w-10 h-10 bg-slate-100 text-slate-600 rounded-2xl flex items-center justify-center hover:bg-slate-200 transition-all border-2 border-slate-200 active:scale-95"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/collectors/token-batches/${batch.id}`)
                          }}
                          className="px-5 py-2.5 bg-gradient-to-r from-orange-600 to-orange-500 text-white text-[11px] font-black rounded-2xl shadow-lg shadow-orange-500/30 hover:from-orange-700 hover:to-orange-600 transition-all active:scale-95 flex items-center gap-2"
                        >
                          PAY <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Nav - Fixed Bottom Menu */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t-2 border-slate-200 shadow-2xl">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-around">
          <button
            onClick={() => router.push('/collectors/dashboard')}
            className={`flex flex-col items-center gap-1 ${pathname === '/collectors/dashboard' ? 'text-orange-600' : 'text-slate-400'}`}
          >
            <div className={`p-2.5 rounded-2xl ${pathname === '/collectors/dashboard' ? 'bg-orange-50 border-2 border-orange-200' : ''}`}>
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest">Home</span>
          </button>
          <button
            onClick={() => router.push('/collectors/tokens')}
            className={`flex flex-col items-center gap-1 ${pathname.startsWith('/collectors/tokens') ? 'text-orange-600' : 'text-slate-400'}`}
          >
            <div className={`p-2.5 rounded-2xl ${pathname.startsWith('/collectors/tokens') ? 'bg-orange-50 border-2 border-orange-200' : ''}`}>
              <FileText className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest">Batches</span>
          </button>
          <button
            onClick={() => router.push('/collectors/payment')}
            className={`flex flex-col items-center gap-1 ${pathname === '/collectors/payment' ? 'text-orange-600' : 'text-slate-400'}`}
          >
            <div className={`p-2.5 rounded-2xl ${pathname === '/collectors/payment' ? 'bg-orange-50 border-2 border-orange-200' : ''}`}>
              <IndianRupee className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest">Pay</span>
          </button>
          <button
            onClick={() => router.push('/collectors/account')}
            className={`flex flex-col items-center gap-1 ${pathname === '/collectors/account' ? 'text-orange-600' : 'text-slate-400'}`}
          >
            <div className={`p-2.5 rounded-2xl ${pathname === '/collectors/account' ? 'bg-orange-50 border-2 border-orange-200' : ''}`}>
              <Wallet className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest">Account</span>
          </button>
          <button
            onClick={() => router.push('/collectors/history')}
            className={`flex flex-col items-center gap-1 ${pathname === '/collectors/history' ? 'text-orange-600' : 'text-slate-400'}`}
          >
            <div className={`p-2.5 rounded-2xl ${pathname === '/collectors/history' ? 'bg-orange-50 border-2 border-orange-200' : ''}`}>
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest">History</span>
          </button>
        </div>
      </div>
    </div>
  )
}