'use client'

import { useEffect, useState } from 'react'
import { Search, Plus, Edit, UserX, UserCheck, Phone, Eye, EyeOff, TrendingUp, X, UserCog, AlertCircle, Shield, Briefcase, ChevronRight, Activity, Zap, CheckCircle2, Copy, Calendar, Key } from 'lucide-react'
import { formatCurrency } from '@/utils/calculations'
import { format } from 'date-fns'

interface Collector {
  id: number
  name: string
  collectorId: string
  mobile: string
  email?: string | null
  plainPassword?: string | null
  isActive: boolean
  createdAt: string
  lastLogin?: string | null
  activeTokens?: number
  totalCollected?: number
}

// Type for ViewCollectorModal with required nullable fields
interface CollectorViewDetails {
  id: number
  name: string
  collectorId: string
  mobile: string
  email: string | null
  plainPassword: string | null
  isActive: boolean
  createdAt: string
  lastLogin: string | null
}

export default function CollectorsPage() {
  const [collectors, setCollectors] = useState<Collector[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [showModal, setShowModal] = useState(false)
  const [editingCollector, setEditingCollector] = useState<Collector | null>(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [viewingCollector, setViewingCollector] = useState<CollectorViewDetails | null>(null)

  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchCollectors()
  }, [page, search, filterStatus])

  const fetchCollectors = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: '20',
      })

      if (search) params.append('search', search)
      if (filterStatus !== 'all') params.append('isActive', filterStatus)

      const response = await fetch(`/api/collectors?${params}`)
      const result = await response.json()

      if (result.success) {
        setCollectors(result.data)
        setTotalPages(result.pagination?.totalPages || 1)
      }
    } catch (error) {
      console.error('Failed to fetch collectors:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddEdit = () => {
    setShowModal(true)
  }

  const handleEdit = (collector: Collector) => {
    setEditingCollector(collector)
    setShowModal(true)
  }

  const handleToggleStatus = async (collector: Collector) => {
    if (!confirm(`Are you sure you want to ${collector.isActive ? 'deactivate' : 'activate'} ${collector.name}?`)) {
      return
    }

    try {
      const response = await fetch(`/api/collectors/${collector.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !collector.isActive }),
      })

      if (response.ok) {
        fetchCollectors()
      } else {
        const result = await response.json()
        alert(result.error || 'Failed to update collector status')
      }
    } catch (error) {
      alert('Failed to update collector status')
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingCollector(null)
  }

  const handleView = async (collector: Collector) => {
    try {
      const response = await fetch(`/api/collectors/${collector.id}`)
      const result = await response.json()
      if (result.success) {
        // Ensure all required fields are present with proper types for ViewCollectorModal
        const collectorData: CollectorViewDetails = {
          id: result.data.id,
          name: result.data.name,
          collectorId: result.data.collectorId,
          mobile: result.data.mobile,
          email: result.data.email ?? null,
          plainPassword: result.data.plainPassword ?? null,
          isActive: result.data.isActive,
          createdAt: result.data.createdAt,
          lastLogin: result.data.lastLogin ?? null
        }
        setViewingCollector(collectorData)
        setShowViewModal(true)
      } else {
        alert('Failed to fetch collector details')
      }
    } catch (error) {
      console.error('Failed to fetch collector details:', error)
      alert('Failed to fetch collector details')
    }
  }

  const handleResetAllPasswords = async () => {
    if (!confirm('This will generate random passwords for all collectors who don\'t have passwords. Continue?')) {
      return
    }

    try {
      const response = await fetch('/api/collectors/reset-all-passwords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const result = await response.json()

      if (response.ok && result.success) {
        if (result.data.updated > 0) {
          const collectorsList = result.data.collectors.map((c: any) => 
            `${c.name} (${c.collectorId}): ${c.generatedPassword}`
          ).join('\n')

          alert(`Passwords generated for ${result.data.updated} collector(s)!\n\n${collectorsList}\n\n⚠️ IMPORTANT: Please save these credentials. They cannot be retrieved later.`)
          
          // Refresh the list
          fetchCollectors()
        } else {
          alert('All collectors already have passwords.')
        }
      } else {
        alert(result.error || 'Failed to generate passwords')
      }
    } catch (error) {
      alert('Network error occurred')
    }
  }

  const handleCloseViewModal = () => {
    setShowViewModal(false)
    setViewingCollector(null)
  }

  const handleSuccess = () => {
    handleCloseModal()
    fetchCollectors()
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Collectors</h1>
          <p className="text-slate-500 text-sm mt-1">Manage field agents and track their collection performance.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleResetAllPasswords}
            className="flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-xl font-bold text-sm transition-all hover:bg-orange-700 active:scale-95 shadow-md"
          >
            <Key className="w-5 h-5" />
            Generate All Passwords
          </button>
          <button
            onClick={handleAddEdit}
            className="flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white rounded-xl font-bold text-sm transition-all hover:bg-orange-600 active:scale-95 shadow-md"
          >
            <Plus className="w-5 h-5" />
            Add Collector
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, ID, or mobile..."
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
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value)
                setPage(1)
              }}
              className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-slate-900 font-bold text-xs uppercase tracking-widest appearance-none transition-all cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
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
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 animate-pulse">Syncing Collectors...</p>
          </div>
        ) : collectors.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-20 text-slate-400 text-center">
            <UserCog className="w-12 h-12 text-slate-200 mb-4" />
            <p className="text-lg font-bold text-slate-900">No Collectors Found</p>
            <p className="text-sm text-slate-500 mt-1">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Collector Information
                    </th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Contact
                    </th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Performance
                    </th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Status
                    </th>
                    <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {collectors.map((collector) => (
                    <tr key={collector.id} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-zinc-900 rounded-lg flex items-center justify-center text-orange-500 font-bold text-sm">
                            {collector.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900 uppercase">{collector.name}</p>
                            <p className="text-[10px] font-bold text-slate-400 mt-0.5 font-mono uppercase tracking-widest">ID: {collector.collectorId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span className="font-mono">{collector.mobile}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-6">
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Workload</p>
                            <p className="text-xs font-bold text-slate-900">{collector.activeTokens || 0} Tokens</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Inflow</p>
                            <p className="text-xs font-bold text-emerald-600 font-mono">{formatCurrency(collector.totalCollected || 0)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${collector.isActive
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                            : 'bg-slate-100 text-slate-400 border border-slate-200'
                            }`}
                        >
                          <div className={`w-1.5 h-1.5 rounded-full mr-2 ${collector.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                          {collector.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleView(collector)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(collector)}
                            className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(collector)}
                            className={`p-2 rounded-lg transition-all ${collector.isActive
                              ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                              : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                              }`}
                            title={collector.isActive ? 'Deactivate' : 'Activate'}
                          >
                            {collector.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                          </button>
                        </div>
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

      {/* Modal */}
      {showModal && (
        <CollectorModal
          collector={editingCollector}
          onClose={handleCloseModal}
          onSuccess={handleSuccess}
        />
      )}

      {/* View Details Modal */}
      {showViewModal && viewingCollector && (
        <ViewCollectorModal
          collector={viewingCollector as CollectorViewDetails}
          onClose={handleCloseViewModal}
        />
      )}
    </div>
  )
}

function CollectorModal({
  collector,
  onClose,
  onSuccess,
}: {
  collector: Collector | null
  onClose: () => void
  onSuccess: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: collector?.name || '',
    collectorId: collector?.collectorId || '',
    mobile: collector?.mobile || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!formData.name || !formData.collectorId || !formData.mobile) {
      setError('All fields are required')
      setLoading(false)
      return
    }

    if (formData.mobile.length !== 10 || !/^\d+$/.test(formData.mobile)) {
      setError('Mobile number must be 10 digits')
      setLoading(false)
      return
    }

    try {
      const url = collector ? `/api/collectors/${collector.id}` : '/api/collectors'
      const method = collector ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (response.ok) {
        // Show generated password for new collectors
        if (!collector && result.data?.generatedPassword) {
          const credentials = `Collector created successfully!\n\nLogin Credentials:\nCollector ID: ${result.data.collectorId}\nPassword: ${result.data.generatedPassword}\n\n⚠️ IMPORTANT: Please save these credentials now. The password cannot be retrieved later.`
          alert(credentials)
          
          // Also copy to clipboard if possible
          if (navigator.clipboard) {
            navigator.clipboard.writeText(`Collector ID: ${result.data.collectorId}\nPassword: ${result.data.generatedPassword}`).catch(() => {})
          }
        }
        onSuccess()
      } else {
        setError(result.error || 'Failed to save collector')
      }
    } catch (err) {
      setError('Network error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {collector ? 'Edit Collector' : 'Add New Collector'}
            </h2>
            <p className="text-slate-500 text-xs mt-1">Provide collector details for registration.</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-[10px] font-bold uppercase tracking-widest flex items-center gap-3">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-slate-900 font-bold transition-all text-sm uppercase"
                placeholder="Enter full name"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                Collector ID <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.collectorId}
                onChange={(e) => setFormData({ ...formData, collectorId: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-slate-900 font-bold transition-all text-sm font-mono uppercase tracking-widest"
                placeholder="e.g., AGT-101"
                disabled={!!collector}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                Mobile Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={10}
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, '') })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-slate-900 font-bold transition-all text-sm font-mono"
                placeholder="10-digit number"
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
                  {collector ? 'Save Changes' : 'Add Collector'}
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

function ViewCollectorModal({
  collector,
  onClose,
}: {
  collector: CollectorViewDetails
  onClose: () => void
}) {
  const [showPassword, setShowPassword] = useState(false)
  const [copied, setCopied] = useState(false)
  const [currentCollector, setCurrentCollector] = useState<CollectorViewDetails>(collector)
  const [resettingPassword, setResettingPassword] = useState(false)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleResetPassword = async () => {
    if (!confirm(`Are you sure you want to reset password for ${currentCollector.name}? The new password will be displayed after reset.`)) {
      return
    }

    setResettingPassword(true)
    try {
      const response = await fetch(`/api/collectors/${currentCollector.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      })

      const result = await response.json()

      if (response.ok && result.success) {
        // Update collector with new password
        setCurrentCollector({
          ...currentCollector,
          plainPassword: result.data.generatedPassword || null,
        })

        const credentials = `Password reset successfully!\n\nNew Login Credentials:\nCollector ID: ${currentCollector.collectorId}\nPassword: ${result.data.generatedPassword}\n\n⚠️ IMPORTANT: Please save these credentials now. The password cannot be retrieved later.`
        alert(credentials)

        // Copy to clipboard
        if (navigator.clipboard) {
          navigator.clipboard.writeText(`Collector ID: ${currentCollector.collectorId}\nPassword: ${result.data.generatedPassword}`).catch(() => {})
        }
      } else {
        alert(result.error || 'Failed to reset password')
      }
    } catch (error) {
      alert('Network error occurred')
    } finally {
      setResettingPassword(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Collector Details</h2>
            <p className="text-slate-500 text-xs mt-1">View login credentials and account information.</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Collector Info */}
          <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-zinc-900 rounded-xl flex items-center justify-center text-orange-500 font-bold text-2xl">
                {collector.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 uppercase">{collector.name}</h3>
                <p className="text-xs text-slate-500 font-mono uppercase tracking-widest">ID: {collector.collectorId}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Mobile Number</p>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <p className="text-sm font-bold text-slate-900 font-mono">{collector.mobile}</p>
                </div>
              </div>
              {collector.email && (
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Email</p>
                  <p className="text-sm font-bold text-slate-900">{collector.email}</p>
                </div>
              )}
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Status</p>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${collector.isActive
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                    : 'bg-slate-100 text-slate-400 border border-slate-200'
                    }`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full mr-2 ${collector.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                  {collector.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Created</p>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <p className="text-sm font-bold text-slate-900">{format(new Date(collector.createdAt), 'dd MMM yyyy')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Login Credentials */}
          <div className="bg-orange-50 rounded-xl p-6 border border-orange-200">
            <div className="flex items-center gap-2 mb-4">
              <Key className="w-5 h-5 text-orange-600" />
              <h3 className="text-lg font-bold text-slate-900">Login Credentials</h3>
            </div>

            <div className="space-y-4">
              {/* Login ID */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block mb-2">
                  Login ID (Collector ID)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    readOnly
                    value={collector.collectorId}
                    className="w-full px-4 py-3 bg-white border border-orange-200 rounded-xl text-sm font-bold text-slate-900 font-mono uppercase tracking-widest pr-12 select-all"
                  />
                  <button
                    onClick={() => copyToClipboard(collector.collectorId)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-orange-100 rounded-lg transition-all"
                    title="Copy to clipboard"
                  >
                    {copied ? (
                      <CheckCircle2 className="w-4 h-4 text-orange-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-orange-600" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-orange-700 mt-2 font-medium">
                  Use this ID to login along with the password below
                </p>
              </div>

              {/* Password */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 block mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    readOnly
                    value={currentCollector.plainPassword || 'Not set'}
                    className="w-full px-4 py-3 bg-white border border-orange-200 rounded-xl text-sm font-bold text-slate-900 pr-24 select-all"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {currentCollector.plainPassword && (
                      <button
                        onClick={() => copyToClipboard(currentCollector.plainPassword || '')}
                        className="p-1.5 hover:bg-orange-100 rounded-lg transition-all"
                        title="Copy to clipboard"
                      >
                        {copied ? (
                          <CheckCircle2 className="w-4 h-4 text-orange-600" />
                        ) : (
                          <Copy className="w-4 h-4 text-orange-600" />
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1.5 hover:bg-orange-100 rounded-lg transition-all"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4 text-orange-600" />
                      ) : (
                        <Eye className="w-4 h-4 text-orange-600" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-orange-700 font-medium">
                    {currentCollector.plainPassword
                      ? 'Collector can view this password in their profile settings'
                      : 'Password not set. Click "Reset Password" to generate a new one.'}
                  </p>
                  <button
                    onClick={handleResetPassword}
                    disabled={resettingPassword}
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold text-xs uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {resettingPassword ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Resetting...
                      </>
                    ) : (
                      <>
                        <Key className="w-4 h-4" />
                        Reset Password
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Last Login */}
          {collector.lastLogin && (
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-slate-400" />
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Last Login</p>
                </div>
                <p className="text-sm font-bold text-slate-900">{format(new Date(collector.lastLogin), 'dd MMM yyyy, hh:mm a')}</p>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold text-xs uppercase tracking-widest transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}