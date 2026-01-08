'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import {
    User,
    Lock,
    Mail,
    Phone,
    Calendar,
    Shield,
    CheckCircle,
    AlertCircle,
    Activity,
    Smartphone,
    ShieldCheck,
    CreditCard,
    Key,
    Save,
    Fingerprint,
    Eye,
    EyeOff
} from 'lucide-react'
import { format } from 'date-fns'

interface UserSettings {
    id: number
    name: string
    email?: string
    mobile?: string
    collectorId?: string
    plainPassword?: string
    role?: string
    userType: string
    lastLogin: string | null
    createdAt: string
}

export default function SettingsPage() {
    const { data: session } = useSession()
    const [settings, setSettings] = useState<UserSettings | null>(null)
    const [loading, setLoading] = useState(true)

    // Profile form
    const [profileForm, setProfileForm] = useState({ name: '', mobile: '' })
    const [profileLoading, setProfileLoading] = useState(false)
    const [profileSuccess, setProfileSuccess] = useState('')
    const [profileError, setProfileError] = useState('')

    // Password form
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    })
    const [passwordLoading, setPasswordLoading] = useState(false)
    const [passwordSuccess, setPasswordSuccess] = useState('')
    const [passwordError, setPasswordError] = useState('')
    const [showPassword, setShowPassword] = useState(false)

    useEffect(() => {
        fetchSettings()
    }, [])

    const fetchSettings = async () => {
        setLoading(true)
        try {
            const response = await fetch('/api/settings')
            const result = await response.json()

            if (result.success) {
                setSettings(result.data)
                setProfileForm({
                    name: result.data.name,
                    mobile: result.data.mobile || '',
                })
            }
        } catch (error) {
            console.error('Failed to fetch settings:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        setProfileLoading(true)
        setProfileSuccess('')
        setProfileError('')

        try {
            const response = await fetch('/api/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(profileForm),
            })

            const result = await response.json()

            if (response.ok) {
                setProfileSuccess('Profile updated successfully')
                fetchSettings()
                setTimeout(() => setProfileSuccess(''), 3000)
            } else {
                setProfileError(result.error || 'Update failed')
            }
        } catch (error) {
            setProfileError('Network error occurred')
        } finally {
            setProfileLoading(false)
        }
    }

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault()
        setPasswordLoading(true)
        setPasswordSuccess('')
        setPasswordError('')

        try {
            const response = await fetch('/api/settings/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(passwordForm),
            })

            const result = await response.json()

            if (response.ok) {
                setPasswordSuccess('Password changed successfully')
                setPasswordForm({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: '',
                })
                setTimeout(() => setPasswordSuccess(''), 3000)
            } else {
                setPasswordError(result.error || 'Password update failed')
            }
        } catch (error) {
            setPasswordError('Network error occurred')
        } finally {
            setPasswordLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="w-12 h-12 border-4 border-slate-100 border-t-orange-600 rounded-full animate-spin"></div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 animate-pulse">Loading settings...</p>
            </div>
        )
    }

    if (!settings) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400 p-10 text-center">
                <AlertCircle className="w-12 h-12 text-slate-200 mb-4" />
                <p className="text-lg font-bold text-slate-900">Access Denied</p>
                <p className="text-sm text-slate-500 mt-1">Unable to load account settings.</p>
            </div>
        )
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-20">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Account Settings</h1>
                    <p className="text-slate-500 text-sm mt-1">Manage your profile information and security preferences.</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100 text-xs font-bold uppercase tracking-widest">
                    <Activity className="w-4 h-4" />
                    System Status: Online
                </div>
            </div>

            {/* Profile Overview Card */}
            <div className="bg-zinc-900 rounded-2xl p-8 text-white shadow-lg overflow-hidden relative">
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                    <div className="w-24 h-24 bg-zinc-800 rounded-2xl flex items-center justify-center text-orange-500 border border-zinc-700 shadow-inner">
                        <User className="w-12 h-12" />
                    </div>

                    <div className="flex-1 text-center md:text-left">
                        <h2 className="text-2xl font-bold tracking-tight mb-1">{settings.name}</h2>
                        <span className="inline-block px-3 py-1 bg-orange-500/20 text-orange-400 text-[10px] font-bold uppercase tracking-widest rounded-full border border-orange-500/20 mb-6">
                            {settings.userType} Account
                        </span>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            <ProfileMetric icon={Mail} label="Email Address" value={settings.email || 'N/A'} />
                            <ProfileMetric icon={Smartphone} label="Mobile Number" value={settings.mobile || 'N/A'} />
                            <ProfileMetric icon={Fingerprint} label="Account ID" value={settings.collectorId || 'ADMIN'} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Profile Information */}
                <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600">
                            <User className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 tracking-tight">Profile Information</h3>
                    </div>

                    <form onSubmit={handleProfileUpdate} className="space-y-6">
                        {profileSuccess && (
                            <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700">
                                <CheckCircle className="w-5 h-5" />
                                <span className="text-xs font-bold">{profileSuccess}</span>
                            </div>
                        )}

                        {profileError && (
                            <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-700">
                                <AlertCircle className="w-5 h-5" />
                                <span className="text-xs font-bold">{profileError}</span>
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Display Name</label>
                            <input
                                type="text"
                                required
                                value={profileForm.name}
                                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:ring-4 focus:ring-orange-500/5 focus:border-orange-500 outline-none transition-all"
                                placeholder="Enter your name"
                            />
                        </div>

                        {settings.userType === 'collector' && (
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Mobile Number</label>
                                <input
                                    type="text"
                                    required
                                    maxLength={10}
                                    value={profileForm.mobile}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, '')
                                        setProfileForm({ ...profileForm, mobile: value })
                                    }}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:ring-4 focus:ring-orange-500/5 focus:border-orange-500 outline-none transition-all"
                                    placeholder="10-digit mobile number"
                                />
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={profileLoading}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-zinc-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-orange-600 transition-all disabled:opacity-50 shadow-md"
                        >
                            {profileLoading ? <Activity className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Save Changes
                        </button>
                    </form>
                </div>

                {/* Current Password Display (Collectors Only) */}
                {settings.userType === 'collector' && settings.plainPassword && (
                    <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600">
                                <Key className="w-5 h-5" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Current Password</h3>
                        </div>

                        <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-6 border border-orange-100">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Key className="w-5 h-5 text-orange-600" />
                                    <span className="text-xs font-bold text-orange-900 uppercase tracking-widest">Your Login Password</span>
                                </div>
                            </div>

                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    readOnly
                                    value={settings.plainPassword}
                                    className="w-full px-4 py-3 bg-white border border-orange-200 rounded-xl text-sm font-bold text-slate-900 pr-12 select-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-orange-100 rounded-lg transition-all"
                                    title={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-4 h-4 text-orange-600" />
                                    ) : (
                                        <Eye className="w-4 h-4 text-orange-600" />
                                    )}
                                </button>
                            </div>

                            <p className="text-xs text-orange-700 mt-3 font-medium">
                                Use this password to login with your Collector ID: <span className="font-bold">{settings.collectorId}</span>
                            </p>
                        </div>
                    </div>
                )}

                {/* Security Settings */}
                <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600">
                            <Lock className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 tracking-tight">Security Settings</h3>
                    </div>

                    <form onSubmit={handlePasswordChange} className="space-y-6">
                        {passwordSuccess && (
                            <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700">
                                <ShieldCheck className="w-5 h-5" />
                                <span className="text-xs font-bold">{passwordSuccess}</span>
                            </div>
                        )}

                        {passwordError && (
                            <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-700">
                                <AlertCircle className="w-5 h-5" />
                                <span className="text-xs font-bold">{passwordError}</span>
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Current Password</label>
                            <input
                                type="password"
                                required
                                value={passwordForm.currentPassword}
                                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:ring-4 focus:ring-orange-500/5 focus:border-orange-500 outline-none transition-all"
                                placeholder="••••••••••••"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">New Password</label>
                            <input
                                type="password"
                                required
                                minLength={8}
                                value={passwordForm.newPassword}
                                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:ring-4 focus:ring-orange-500/5 focus:border-orange-500 outline-none transition-all"
                                placeholder="Minimum 8 characters"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Confirm New Password</label>
                            <input
                                type="password"
                                required
                                value={passwordForm.confirmPassword}
                                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:ring-4 focus:ring-orange-500/5 focus:border-orange-500 outline-none transition-all"
                                placeholder="Repeat new password"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={passwordLoading}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-orange-700 transition-all disabled:opacity-50 shadow-md shadow-orange-600/10"
                        >
                            {passwordLoading ? <Activity className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                            Update Password
                        </button>
                    </form>
                </div>
            </div>

            {/* Security Overview */}
            <div className="bg-zinc-50 rounded-2xl p-8 border border-slate-200 flex flex-col md:flex-row items-center gap-8 justify-between">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center border border-slate-200 shadow-sm">
                        <Shield className="w-8 h-8 text-orange-500" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 tracking-tight">Security Overview</h3>
                        <p className="text-slate-500 text-xs font-semibold uppercase tracking-widest mt-0.5">Your account security is active and monitored.</p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-4 justify-center">
                    <SecurityTip text="8+ Characters" />
                    <SecurityTip text="Regular Updates" />
                    <SecurityTip text="Secure Login" />
                </div>
            </div>

            {/* Session Info */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-8 pt-8 border-t border-slate-200 text-slate-400">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
                    <Calendar className="w-4 h-4" />
                    Account Created: {settings.createdAt ? (() => {
                        try {
                            const date = new Date(settings.createdAt)
                            return isNaN(date.getTime()) ? 'N/A' : format(date, 'dd MMM yyyy')
                        } catch {
                            return 'N/A'
                        }
                    })() : 'N/A'}
                </div>
                <div className="hidden sm:block w-1 h-1 bg-slate-300 rounded-full"></div>
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
                    <Activity className="w-4 h-4" />
                    Last Login: {settings.lastLogin ? (() => {
                        try {
                            const date = new Date(settings.lastLogin)
                            return isNaN(date.getTime()) ? 'First session' : format(date, 'dd MMM yyyy HH:mm')
                        } catch {
                            return 'First session'
                        }
                    })() : 'First session'}
                </div>
            </div>
        </div>
    )
}

function ProfileMetric({ icon: Icon, label, value }: any) {
    return (
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 transition-colors hover:bg-white/10">
            <div className="flex items-center gap-2 mb-2 opacity-50">
                <Icon className="w-4 h-4 text-orange-500" />
                <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
            </div>
            <p className="text-sm font-bold tracking-tight truncate uppercase">{value}</p>
        </div>
    )
}

function SecurityTip({ text }: { text: string }) {
    return (
        <div className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-center">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{text}</span>
        </div>
    )
}