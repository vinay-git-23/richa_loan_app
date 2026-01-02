'use client'

import { useEffect, useState } from 'react'
import {
    AlertTriangle,
    Plus,
    Edit,
    Trash2,
    CheckCircle,
    X,
    Activity,
    Shield,
    Calculator,
    Clock,
    Settings
} from 'lucide-react'
import { formatCurrency } from '@/utils/calculations'

interface PenaltyConfig {
    id: number
    penaltyType: 'fixed' | 'percent'
    penaltyValue: number
    graceDays: number
    applyToLoanType: string | null
    isActive: boolean
    createdAt: string
}

export default function PenaltyConfigPage() {
    const [configs, setConfigs] = useState<PenaltyConfig[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingConfig, setEditingConfig] = useState<PenaltyConfig | null>(null)

    useEffect(() => {
        fetchConfigs()
    }, [])

    const fetchConfigs = async () => {
        setLoading(true)
        try {
            const response = await fetch('/api/penalty-config')
            const result = await response.json()

            if (result.success) {
                setConfigs(result.data)
            }
        } catch (error) {
            console.error('Failed to fetch configs:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleAdd = () => {
        setEditingConfig(null)
        setShowModal(true)
    }

    const handleEdit = (config: PenaltyConfig) => {
        setEditingConfig(config)
        setShowModal(true)
    }

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this penalty configuration?')) {
            return
        }

        try {
            const response = await fetch(`/api/penalty-config/${id}`, {
                method: 'DELETE',
            })

            if (response.ok) {
                fetchConfigs()
            } else {
                alert('Failed to delete configuration')
            }
        } catch (error) {
            alert('Failed to delete configuration')
        }
    }

    const handleToggleActive = async (config: PenaltyConfig) => {
        try {
            const response = await fetch(`/api/penalty-config/${config.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !config.isActive }),
            })

            if (response.ok) {
                fetchConfigs()
            } else {
                alert('Failed to update configuration')
            }
        } catch (error) {
            alert('Failed to update configuration')
        }
    }

    const handleCloseModal = () => {
        setShowModal(false)
        setEditingConfig(null)
    }

    const handleSuccess = () => {
        handleCloseModal()
        fetchConfigs()
    }

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Penalty Configuration</h1>
                    <p className="text-slate-500 text-sm mt-1">Configure automatic penalty rules for overdue payments.</p>
                </div>
                <button
                    onClick={handleAdd}
                    className="flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white rounded-xl font-bold text-sm transition-all hover:bg-orange-600 active:scale-95 shadow-md"
                >
                    <Plus className="w-5 h-5" />
                    Add Configuration
                </button>
            </div>

            {/* Info Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Info Banner */}
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 flex items-start gap-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 shrink-0">
                        <Shield className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-sm font-bold text-blue-900 mb-1">Auto Penalty System</h3>
                        <p className="text-xs text-blue-700 leading-relaxed">
                            The system automatically scans for overdue schedules daily and applies configured penalties.
                            Only one configuration can be active at a time.
                        </p>
                    </div>
                </div>

                {/* Active Config Display */}
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100 rounded-2xl p-6 flex items-start gap-4">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600 shrink-0">
                        <Activity className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-sm font-bold text-orange-900 mb-1">Active Configuration</h3>
                        {configs.find(c => c.isActive) ? (
                            <div className="text-xs text-orange-700 space-y-1">
                                <p className="font-bold">
                                    {configs.find(c => c.isActive)?.penaltyType === 'fixed'
                                        ? formatCurrency(configs.find(c => c.isActive)?.penaltyValue || 0)
                                        : `${configs.find(c => c.isActive)?.penaltyValue}%`
                                    } penalty with {configs.find(c => c.isActive)?.graceDays} grace days
                                </p>
                            </div>
                        ) : (
                            <p className="text-xs text-orange-600 italic">No active configuration set</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Configurations List */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex flex-col items-center justify-center p-20 gap-4">
                        <div className="w-12 h-12 border-4 border-slate-100 border-t-orange-600 rounded-full animate-spin"></div>
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 animate-pulse">Loading configurations...</p>
                    </div>
                ) : configs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-20 text-slate-400 text-center">
                        <Settings className="w-12 h-12 text-slate-200 mb-4" />
                        <p className="text-lg font-bold text-slate-900">No Penalty Configurations</p>
                        <p className="text-sm text-slate-500 mt-1">Add your first penalty rule to get started.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        Penalty Type
                                    </th>
                                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        Value
                                    </th>
                                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        Grace Days
                                    </th>
                                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        Apply To
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
                                {configs.map((config) => (
                                    <tr key={config.id} className="group hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                                    config.penaltyType === 'fixed'
                                                        ? 'bg-orange-50 text-orange-600 border border-orange-100'
                                                        : 'bg-blue-50 text-blue-600 border border-blue-100'
                                                }`}>
                                                    <Calculator className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900 uppercase">
                                                        {config.penaltyType === 'fixed' ? 'Fixed Amount' : 'Percentage'}
                                                    </p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                        {config.penaltyType}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <p className="text-lg font-bold text-slate-900">
                                                {config.penaltyType === 'fixed'
                                                    ? formatCurrency(config.penaltyValue)
                                                    : `${config.penaltyValue}%`
                                                }
                                            </p>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-slate-400" />
                                                <span className="text-sm font-bold text-slate-900">
                                                    {config.graceDays} {config.graceDays === 1 ? 'Day' : 'Days'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="text-xs font-bold text-slate-600">
                                                {config.applyToLoanType || 'All Loan Types'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <button
                                                onClick={() => handleToggleActive(config)}
                                                className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
                                                    config.isActive
                                                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100'
                                                        : 'bg-slate-100 text-slate-400 border border-slate-200 hover:bg-slate-200'
                                                }`}
                                            >
                                                <div className={`w-1.5 h-1.5 rounded-full mr-2 ${config.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                                                {config.isActive ? 'Active' : 'Inactive'}
                                            </button>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(config)}
                                                    className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
                                                    title="Edit"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(config.id)}
                                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <PenaltyConfigModal
                    config={editingConfig}
                    onClose={handleCloseModal}
                    onSuccess={handleSuccess}
                />
            )}
        </div>
    )
}

function PenaltyConfigModal({
    config,
    onClose,
    onSuccess,
}: {
    config: PenaltyConfig | null
    onClose: () => void
    onSuccess: () => void
}) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [formData, setFormData] = useState({
        penaltyType: config?.penaltyType || 'percent',
        penaltyValue: config?.penaltyValue?.toString() || '',
        graceDays: config?.graceDays?.toString() || '0',
        applyToLoanType: config?.applyToLoanType || '',
        isActive: config?.isActive ?? true,
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        if (!formData.penaltyValue || parseFloat(formData.penaltyValue) < 0) {
            setError('Please enter a valid penalty value')
            setLoading(false)
            return
        }

        if (parseInt(formData.graceDays) < 0) {
            setError('Grace days cannot be negative')
            setLoading(false)
            return
        }

        try {
            const url = config ? `/api/penalty-config/${config.id}` : '/api/penalty-config'
            const method = config ? 'PUT' : 'POST'

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    penaltyValue: parseFloat(formData.penaltyValue),
                    graceDays: parseInt(formData.graceDays),
                }),
            })

            const result = await response.json()

            if (response.ok) {
                onSuccess()
            } else {
                setError(result.error || 'Failed to save configuration')
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
                            {config ? 'Edit Penalty Configuration' : 'Add Penalty Configuration'}
                        </h2>
                        <p className="text-slate-500 text-xs mt-1">Configure automatic penalty rules for overdue payments.</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-[10px] font-bold uppercase tracking-widest flex items-center gap-3">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                                Penalty Type <span className="text-rose-500">*</span>
                            </label>
                            <div className="flex p-1 bg-slate-50 rounded-xl border border-slate-200">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, penaltyType: 'percent' })}
                                    className={`flex-1 py-2 px-4 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                                        formData.penaltyType === 'percent'
                                            ? 'bg-white text-orange-600 shadow-sm'
                                            : 'text-slate-400 hover:text-slate-600'
                                    }`}
                                >
                                    Percentage (%)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, penaltyType: 'fixed' })}
                                    className={`flex-1 py-2 px-4 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                                        formData.penaltyType === 'fixed'
                                            ? 'bg-white text-orange-600 shadow-sm'
                                            : 'text-slate-400 hover:text-slate-600'
                                    }`}
                                >
                                    Fixed Amount (₹)
                                </button>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                                {formData.penaltyType === 'fixed' ? 'Penalty Amount (₹)' : 'Penalty Percentage (%)'}
                                <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                required
                                value={formData.penaltyValue}
                                onChange={(e) => setFormData({ ...formData, penaltyValue: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-slate-900 font-bold transition-all text-sm"
                                placeholder={formData.penaltyType === 'fixed' ? '50.00' : '5.00'}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                                Grace Days <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="number"
                                min="0"
                                required
                                value={formData.graceDays}
                                onChange={(e) => setFormData({ ...formData, graceDays: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-slate-900 font-bold transition-all text-sm"
                                placeholder="0"
                            />
                            <p className="text-[10px] text-slate-500 ml-1">Number of days before penalty applies</p>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                                Apply To Loan Type
                            </label>
                            <input
                                type="text"
                                value={formData.applyToLoanType}
                                onChange={(e) => setFormData({ ...formData, applyToLoanType: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-slate-900 font-medium transition-all text-sm"
                                placeholder="Leave empty for all loan types"
                            />
                        </div>

                        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                            <input
                                type="checkbox"
                                id="isActive"
                                checked={formData.isActive}
                                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                className="w-5 h-5 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                            />
                            <label htmlFor="isActive" className="text-sm font-bold text-slate-900 cursor-pointer">
                                Set as Active Configuration
                            </label>
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
                                    {config ? 'Save Changes' : 'Create Configuration'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
