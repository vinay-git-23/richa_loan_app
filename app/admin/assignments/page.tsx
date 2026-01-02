'use client'

import { useEffect, useState } from 'react'
import {
    Users,
    UserCog,
    Plus,
    Trash2,
    Search,
    CheckCircle,
    X,
    Activity,
    AlertCircle,
    Shield,
    Link as LinkIcon,
    Phone,
    MapPin
} from 'lucide-react'

interface Assignment {
    id: number
    customerId: number
    collectorId: number
    assignedDate: string
    isActive: boolean
    customer: {
        id: number
        name: string
        mobile: string
        address: string | null
        isActive: boolean
    }
    collector: {
        id: number
        name: string
        collectorId: string
        mobile: string
        isActive: boolean
    }
}

interface Customer {
    id: number
    name: string
    mobile: string
    isActive: boolean
}

interface Collector {
    id: number
    name: string
    collectorId: string
    isActive: boolean
}

export default function CustomerAssignmentsPage() {
    const [assignments, setAssignments] = useState<Assignment[]>([])
    const [customers, setCustomers] = useState<Customer[]>([])
    const [collectors, setCollectors] = useState<Collector[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [search, setSearch] = useState('')
    const [filterCollector, setFilterCollector] = useState<string>('all')

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            const [assignmentsRes, customersRes, collectorsRes] = await Promise.all([
                fetch('/api/customer-assignments?isActive=true'),
                fetch('/api/customers?pageSize=1000&isActive=true'),
                fetch('/api/collectors?pageSize=1000&isActive=true')
            ])

            const assignmentsData = await assignmentsRes.json()
            const customersData = await customersRes.json()
            const collectorsData = await collectorsRes.json()

            if (assignmentsData.success) setAssignments(assignmentsData.data)
            if (customersData.success) setCustomers(customersData.data)
            if (collectorsData.success) setCollectors(collectorsData.data)
        } catch (error) {
            console.error('Failed to fetch data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to remove this assignment?')) {
            return
        }

        try {
            const response = await fetch(`/api/customer-assignments/${id}`, {
                method: 'DELETE',
            })

            if (response.ok) {
                fetchData()
            } else {
                alert('Failed to remove assignment')
            }
        } catch (error) {
            alert('Failed to remove assignment')
        }
    }

    const filteredAssignments = assignments.filter(assignment => {
        const matchesSearch =
            assignment.customer.name.toLowerCase().includes(search.toLowerCase()) ||
            assignment.customer.mobile.includes(search) ||
            assignment.collector.name.toLowerCase().includes(search.toLowerCase())

        const matchesCollector = filterCollector === 'all' || assignment.collectorId.toString() === filterCollector

        return matchesSearch && matchesCollector
    })

    // Group assignments by collector
    const groupedByCollector = filteredAssignments.reduce((acc, assignment) => {
        const collectorId = assignment.collectorId
        if (!acc[collectorId]) {
            acc[collectorId] = {
                collector: assignment.collector,
                assignments: []
            }
        }
        acc[collectorId].assignments.push(assignment)
        return acc
    }, {} as Record<number, { collector: Assignment['collector'], assignments: Assignment[] }>)

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Customer Assignments</h1>
                    <p className="text-slate-500 text-sm mt-1">Manage customer-to-collector assignments and workload distribution.</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white rounded-xl font-bold text-sm transition-all hover:bg-orange-600 active:scale-95 shadow-md"
                >
                    <Plus className="w-5 h-5" />
                    Assign Customer
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by customer or collector name..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-slate-900 font-medium placeholder:text-slate-400 transition-all text-sm"
                        />
                    </div>

                    <div className="relative min-w-[250px]">
                        <select
                            value={filterCollector}
                            onChange={(e) => setFilterCollector(e.target.value)}
                            className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-slate-900 font-bold text-xs uppercase tracking-widest appearance-none transition-all cursor-pointer"
                        >
                            <option value="all">All Collectors</option>
                            {collectors.map(collector => (
                                <option key={collector.id} value={collector.id}>
                                    {collector.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Assignments Grouped by Collector */}
            <div className="space-y-6">
                {loading ? (
                    <div className="flex flex-col items-center justify-center p-20 gap-4 bg-white rounded-2xl border border-slate-200">
                        <div className="w-12 h-12 border-4 border-slate-100 border-t-orange-600 rounded-full animate-spin"></div>
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 animate-pulse">Loading assignments...</p>
                    </div>
                ) : Object.keys(groupedByCollector).length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-20 text-slate-400 text-center bg-white rounded-2xl border border-slate-200">
                        <LinkIcon className="w-12 h-12 text-slate-200 mb-4" />
                        <p className="text-lg font-bold text-slate-900">No Assignments Found</p>
                        <p className="text-sm text-slate-500 mt-1">Start assigning customers to collectors to manage workload.</p>
                    </div>
                ) : (
                    Object.entries(groupedByCollector).map(([collectorId, data]) => (
                        <div key={collectorId} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            {/* Collector Header */}
                            <div className="bg-zinc-900 p-6 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-orange-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                                        {data.collector.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white tracking-tight">{data.collector.name}</h3>
                                        <p className="text-sm text-orange-400 font-mono uppercase tracking-widest mt-0.5">
                                            {data.collector.collectorId}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Assigned</p>
                                    <p className="text-2xl font-bold text-white">{data.assignments.length}</p>
                                </div>
                            </div>

                            {/* Assigned Customers */}
                            <div className="divide-y divide-slate-100">
                                {data.assignments.map((assignment) => (
                                    <div key={assignment.id} className="p-6 hover:bg-slate-50 transition-colors group">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4 flex-1">
                                                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600 font-bold group-hover:bg-orange-50 group-hover:text-orange-600 transition-colors">
                                                    <Users className="w-5 h-5" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-bold text-slate-900 uppercase tracking-tight">
                                                        {assignment.customer.name}
                                                    </p>
                                                    <div className="flex items-center gap-4 mt-1">
                                                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                                            <Phone className="w-3 h-3" />
                                                            <span className="font-mono">{assignment.customer.mobile}</span>
                                                        </div>
                                                        {assignment.customer.address && (
                                                            <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                                                <MapPin className="w-3 h-3" />
                                                                <span className="truncate max-w-[200px]">{assignment.customer.address}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDelete(assignment.id)}
                                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                title="Remove Assignment"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <AssignmentModal
                    customers={customers}
                    collectors={collectors}
                    existingAssignments={assignments}
                    onClose={() => setShowModal(false)}
                    onSuccess={() => {
                        setShowModal(false)
                        fetchData()
                    }}
                />
            )}
        </div>
    )
}

function AssignmentModal({
    customers,
    collectors,
    existingAssignments,
    onClose,
    onSuccess,
}: {
    customers: Customer[]
    collectors: Collector[]
    existingAssignments: Assignment[]
    onClose: () => void
    onSuccess: () => void
}) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [customerId, setCustomerId] = useState('')
    const [collectorId, setCollectorId] = useState('')

    // Filter out customers that are already assigned
    const assignedCustomerIds = existingAssignments.map(a => a.customerId)
    const availableCustomers = customers.filter(c => !assignedCustomerIds.includes(c.id))

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        if (!customerId || !collectorId) {
            setError('Please select both customer and collector')
            setLoading(false)
            return
        }

        try {
            const response = await fetch('/api/customer-assignments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customerId: parseInt(customerId),
                    collectorId: parseInt(collectorId)
                }),
            })

            const result = await response.json()

            if (response.ok) {
                onSuccess()
            } else {
                setError(result.error || 'Failed to create assignment')
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
                        <h2 className="text-xl font-bold text-slate-900">Assign Customer to Collector</h2>
                        <p className="text-slate-500 text-xs mt-1">Select a customer and assign them to a field collector.</p>
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
                                Select Customer <span className="text-rose-500">*</span>
                            </label>
                            <select
                                required
                                value={customerId}
                                onChange={(e) => setCustomerId(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-slate-900 font-bold transition-all text-sm"
                            >
                                <option value="">Choose customer</option>
                                {availableCustomers.map(customer => (
                                    <option key={customer.id} value={customer.id}>
                                        {customer.name} - {customer.mobile}
                                    </option>
                                ))}
                            </select>
                            {availableCustomers.length === 0 && (
                                <p className="text-xs text-slate-500 ml-1">All active customers are already assigned</p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                                Select Collector <span className="text-rose-500">*</span>
                            </label>
                            <select
                                required
                                value={collectorId}
                                onChange={(e) => setCollectorId(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-slate-900 font-bold transition-all text-sm"
                            >
                                <option value="">Choose collector</option>
                                {collectors.map(collector => (
                                    <option key={collector.id} value={collector.id}>
                                        {collector.name} ({collector.collectorId})
                                    </option>
                                ))}
                            </select>
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
                            disabled={loading || availableCustomers.length === 0}
                            className="flex-[2] px-4 py-3 bg-zinc-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-orange-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <Activity className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    <LinkIcon className="w-4 h-4" />
                                    Create Assignment
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
