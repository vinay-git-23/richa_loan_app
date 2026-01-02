'use client'

import { useEffect, useState } from 'react'
import { Search, Plus, Edit, UserX, UserCheck, Phone, MapPin, X, User, AlertCircle, Briefcase, Activity, Camera, ChevronRight } from 'lucide-react'
import { formatCurrency } from '@/utils/calculations'

interface Customer {
    id: number
    name: string
    mobile: string
    aadhaar: string | null
    address: string | null
    photoUrl?: string | null
    isActive: boolean
    createdAt: string
    totalBorrowed?: number
    totalDue?: number
    totalPaid?: number
    outstanding?: number
    activeTokens?: number
    totalTokens?: number
}

export default function CustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [filterStatus, setFilterStatus] = useState<string>('all')
    const [showModal, setShowModal] = useState(false)
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)

    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)

    useEffect(() => {
        fetchCustomers()
    }, [page, search, filterStatus])

    const fetchCustomers = async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                pageSize: '20',
            })

            if (search) params.append('search', search)
            if (filterStatus !== 'all') params.append('isActive', filterStatus)

            const response = await fetch(`/api/customers?${params}`)
            const result = await response.json()

            if (result.success) {
                setCustomers(result.data)
                setTotalPages(result.pagination?.totalPages || 1)
            }
        } catch (error) {
            console.error('Failed to fetch customers:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleAddEdit = () => {
        setShowModal(true)
    }

    const handleEdit = (customer: Customer) => {
        setEditingCustomer(customer)
        setShowModal(true)
    }

    const handleToggleStatus = async (customer: Customer) => {
        if (!confirm(`Are you sure you want to ${customer.isActive ? 'deactivate' : 'activate'} ${customer.name}?`)) {
            return
        }

        try {
            const response = await fetch(`/api/customers/${customer.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !customer.isActive }),
            })

            if (response.ok) {
                fetchCustomers()
            } else {
                const result = await response.json()
                alert(result.error || 'Failed to update customer status')
            }
        } catch (error) {
            alert('Failed to update customer status')
        }
    }

    const handleCloseModal = () => {
        setShowModal(false)
        setEditingCustomer(null)
    }

    const handleSuccess = () => {
        handleCloseModal()
        fetchCustomers()
    }

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Customers</h1>
                    <p className="text-slate-500 text-sm mt-1">Manage your customer database and view their financial profiles.</p>
                </div>
                <button
                    onClick={handleAddEdit}
                    className="flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white rounded-xl font-bold text-sm transition-all hover:bg-orange-600 active:scale-95 shadow-md"
                >
                    <Plus className="w-5 h-5" />
                    Add Customer
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by name, mobile, or Aadhaar..."
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
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 animate-pulse">Syncing Customers...</p>
                    </div>
                ) : customers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-20 text-slate-400 text-center">
                        <User className="w-12 h-12 text-slate-200 mb-4" />
                        <p className="text-lg font-bold text-slate-900">No Customers Found</p>
                        <p className="text-sm text-slate-500 mt-1">Try adjusting your search or filters.</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-slate-50/50 border-b border-slate-100">
                                        <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            Customer Information
                                        </th>
                                        <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            Contact Details
                                        </th>
                                        <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            Active Loans
                                        </th>
                                        <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            Outstanding
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
                                    {customers.map((customer) => (
                                        <tr key={customer.id} className="group hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-5">
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900 uppercase">{customer.name}</p>
                                                    {customer.aadhaar && (
                                                        <p className="text-[10px] font-bold text-slate-400 mt-0.5 font-mono">ID: {customer.aadhaar}</p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                                                        <Phone className="w-3 h-3 text-slate-400" />
                                                        <span className="font-mono">{customer.mobile}</span>
                                                    </div>
                                                    {customer.address && (
                                                        <div className="flex items-center gap-2 text-[10px] font-medium text-slate-400">
                                                            <MapPin className="w-3 h-3 shrink-0" />
                                                            <span className="truncate max-w-[150px]">{customer.address}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center text-orange-600 border border-orange-100">
                                                        <Briefcase className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-orange-600">
                                                            {customer.activeTokens || 0}
                                                        </p>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                            {customer.totalTokens || 0} Total
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="space-y-1.5">
                                                    <div className="flex justify-between items-center max-w-[140px]">
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Due</span>
                                                        <span className="text-xs font-bold text-rose-500">{formatCurrency(customer.outstanding || 0)}</span>
                                                    </div>
                                                    <div className="w-full h-1 bg-slate-100 rounded-full max-w-[140px]">
                                                        <div
                                                            className="h-full bg-emerald-500 rounded-full"
                                                            style={{ width: `${Math.min(100, ((customer.totalPaid || 0) / (customer.totalBorrowed || 1)) * 100)}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span
                                                    className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${customer.isActive
                                                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                                        : 'bg-slate-100 text-slate-400 border border-slate-200'
                                                        }`}
                                                >
                                                    {customer.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleEdit(customer)}
                                                        className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
                                                        title="Edit"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleToggleStatus(customer)}
                                                        className={`p-2 rounded-lg transition-all ${customer.isActive
                                                            ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                                                            : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                                                            }`}
                                                        title={customer.isActive ? 'Deactivate' : 'Activate'}
                                                    >
                                                        {customer.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
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
                <CustomerModal
                    customer={editingCustomer}
                    onClose={handleCloseModal}
                    onSuccess={handleSuccess}
                />
            )}
        </div>
    )
}

function CustomerModal({
    customer,
    onClose,
    onSuccess,
}: {
    customer: Customer | null
    onClose: () => void
    onSuccess: () => void
}) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [photo, setPhoto] = useState<string | null>(customer?.photoUrl || null)
    const [formData, setFormData] = useState({
        name: customer?.name || '',
        mobile: customer?.mobile || '',
        aadhaar: customer?.aadhaar || '',
        address: customer?.address || '',
    })

    const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        setLoading(true)
        setError('')

        if (!formData.name || !formData.mobile) {
            setError('Name and mobile number are required')
            setLoading(false)
            return
        }

        if (formData.mobile.length !== 10 || !/^\d+$/.test(formData.mobile)) {
            setError('Mobile number must be 10 digits')
            setLoading(false)
            return
        }

        try {
            const url = customer ? `/api/customers/${customer.id}` : '/api/customers'
            const method = customer ? 'PUT' : 'POST'

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    photoUrl: photo || null
                }),
            })

            const result = await response.json()

            if (response.ok) {
                onSuccess()
            } else {
                setError(result.error || 'Failed to save customer')
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
                            {customer ? 'Edit Customer' : 'Add New Customer'}
                        </h2>
                        <p className="text-slate-500 text-xs mt-1">Provide customer details for registration.</p>
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

                        <div className="grid grid-cols-2 gap-4">
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
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                                    Aadhaar Number
                                </label>
                                <input
                                    type="text"
                                    maxLength={12}
                                    value={formData.aadhaar}
                                    onChange={(e) => setFormData({ ...formData, aadhaar: e.target.value.replace(/\D/g, '') })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-slate-900 font-bold transition-all text-sm font-mono"
                                    placeholder="12-digit UID"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Address</label>
                            <textarea
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                rows={3}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-slate-900 font-medium transition-all text-sm resize-none"
                                placeholder="Full residential address"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                                Customer Photo (Optional)
                            </label>
                            {photo ? (
                                <div className="relative rounded-xl overflow-hidden border border-slate-200 group">
                                    <img src={photo} alt="Customer" className="w-full h-48 object-cover" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <button
                                            type="button"
                                            onClick={() => setPhoto(null)}
                                            className="px-4 py-2 bg-white text-rose-600 rounded-lg font-bold text-xs uppercase tracking-widest shadow-lg active:scale-95"
                                        >
                                            Remove Photo
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <label className="block w-full border-2 border-dashed border-slate-200 rounded-xl p-8 hover:border-orange-400 hover:bg-orange-50/30 transition-all cursor-pointer text-center">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handlePhotoCapture}
                                        className="hidden"
                                    />
                                    <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                                        <Camera className="w-6 h-6 text-slate-400" />
                                    </div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Click to upload photo</p>
                                </label>
                            )}
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
                                    {customer ? 'Save Changes' : 'Add Customer'}
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