'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Search, Filter, Eye, IndianRupee, AlertCircle, TrendingUp, FileText, Clock, ChevronRight } from 'lucide-react'
import { formatCurrency } from '@/utils/calculations'

interface Token {
  id: number
  tokenNo: string
  totalAmount: number
  dailyInstallment: number
  duration: number
  status: string
  startDate: string
  customer: {
    name: string
    mobile: string
  }
  todayDue: number
  overdueDays: number
}

export default function MyTokensPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [tokens, setTokens] = useState<Token[]>([])
  const [filteredTokens, setFilteredTokens] = useState<Token[]>([])
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
    filterTokens()
  }, [searchQuery, statusFilter, tokens])

  const fetchTokens = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/collectors/tokens')
      const result = await response.json()

      if (result.success) {
        setTokens(result.data)
        setFilteredTokens(result.data)
      }
    } catch (error) {
      console.error('Failed to fetch tokens:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterTokens = () => {
    let filtered = tokens
    if (searchQuery) {
      filtered = filtered.filter(
        (token) =>
          token.tokenNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
          token.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          token.customer.mobile.includes(searchQuery)
      )
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter((token) => token.status === statusFilter)
    }
    setFilteredTokens(filtered)
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
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans">
      {/* Premium Header */}
      <div className="bg-[#0F172A] pt-8 pb-12 px-6 relative overflow-hidden text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="relative z-10">
          <h1 className="text-2xl font-black tracking-tight">Active Tokens</h1>
          <p className="text-blue-300 text-xs font-medium uppercase tracking-widest mt-1">{filteredTokens.length} Management Lists</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="px-5 -mt-6 mb-6">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-4 space-y-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
            <input
              type="text"
              placeholder="Search Customer or Token..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-inner"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {['all', 'active', 'overdue', 'closed'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${statusFilter === status
                    ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/30'
                    : 'bg-slate-50 text-slate-500 border-slate-100 hover:border-slate-300'
                  }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Modern Token Cards */}
      <div className="px-5 space-y-4">
        {filteredTokens.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center border border-slate-100">
            <AlertCircle className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">No matching tokens</p>
          </div>
        ) : (
          filteredTokens.map((token) => (
            <div
              key={token.id}
              className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden active:scale-[0.98] transition-all hover:border-blue-200"
              onClick={() => router.push(`/collectors/tokens/${token.id}`)}
            >
              <div className="p-4">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100">
                      <FileText className="w-5 h-5 text-slate-600" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900 tracking-tight">{token.tokenNo}</p>
                      <p className="text-xs text-slate-500 font-medium">{token.customer.name}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter border ${getStatusStyle(token.status)}`}>
                    {token.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div>
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Daily</p>
                    <p className="text-sm font-black text-slate-900">{formatCurrency(token.dailyInstallment)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Balance</p>
                    <p className="text-sm font-black text-slate-900">{formatCurrency(token.totalAmount)}</p>
                  </div>
                </div>

                {token.status !== 'closed' && (
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-50">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                        {token.overdueDays > 0 ? 'Overdue Amt' : "Today's Due"}
                      </p>
                      <p className={`text-xl font-black ${token.overdueDays > 0 ? 'text-red-600' : 'text-blue-600'}`}>
                        {formatCurrency(token.todayDue)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/collectors/tokens/${token.id}`)
                        }}
                        className="w-10 h-10 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center hover:bg-slate-200 transition-all border border-slate-200 active:scale-95"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/collectors/payment?token=${token.id}`)
                        }}
                        className="px-5 py-2.5 bg-blue-600 text-white text-[11px] font-black rounded-xl shadow-lg shadow-blue-500/30 hover:bg-black transition-all active:scale-95 flex items-center gap-2"
                      >
                        PAY <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Nav */}
      <div className="fixed bottom-6 left-5 right-5 z-50">
        <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-3xl p-3 shadow-2xl flex items-center justify-around">
          <button onClick={() => router.push('/collectors/dashboard')} className="flex flex-col items-center gap-1.5 text-slate-500">
            <div className="p-2 hover:bg-white/5 rounded-2xl"><TrendingUp className="w-5 h-5" /></div>
            <span className="text-[10px] font-bold uppercase tracking-widest">Home</span>
          </button>
          <button onClick={() => router.push('/collectors/tokens')} className="flex flex-col items-center gap-1.5 text-blue-400">
            <div className="p-2 bg-blue-400/10 rounded-2xl"><FileText className="w-5 h-5" /></div>
            <span className="text-[10px] font-bold uppercase tracking-widest">Tokens</span>
          </button>
          <button onClick={() => router.push('/collectors/payment')} className="flex flex-col items-center gap-1.5 text-slate-500">
            <div className="p-2 hover:bg-white/5 rounded-2xl"><IndianRupee className="w-5 h-5" /></div>
            <span className="text-[10px] font-bold uppercase tracking-widest">Pay</span>
          </button>
          <button onClick={() => router.push('/collectors/history')} className="flex flex-col items-center gap-1.5 text-slate-500">
            <div className="p-2 hover:bg-white/5 rounded-2xl"><Clock className="w-5 h-5" /></div>
            <span className="text-[10px] font-bold uppercase tracking-widest">History</span>
          </button>
        </div>
      </div>
    </div>
  )
}