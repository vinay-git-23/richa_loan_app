'use client'

import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useState } from 'react'
import { LayoutDashboard, Users, UserCog, FileText, IndianRupee, BarChart, Settings, LogOut, Menu, X, ShieldCheck, ChevronRight, AlertTriangle, Link as LinkIcon, Clock, Wallet } from 'lucide-react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { data: session } = useSession()
    const pathname = usePathname()
    const [sidebarOpen, setSidebarOpen] = useState(false)

    const navigation = [
        { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard, color: 'from-orange-600 to-amber-600' },
        { name: 'Customers', href: '/admin/customers', icon: Users, color: 'from-orange-500 to-orange-600' },
        { name: 'Collectors', href: '/admin/collectors', icon: UserCog, color: 'from-zinc-600 to-slate-700' },
        { name: 'Assignments', href: '/admin/assignments', icon: LinkIcon, color: 'from-blue-500 to-indigo-600' },
        { name: 'Tokens', href: '/admin/tokens', icon: FileText, color: 'from-amber-500 to-orange-600' },
        { name: 'Payments', href: '/admin/payments', icon: IndianRupee, color: 'from-orange-600 to-red-600' },
        { name: 'Cash Mgmt', href: '/admin/cash-management', icon: Wallet, color: 'from-emerald-600 to-teal-600' },
        { name: 'Reports', href: '/admin/reports', icon: BarChart, color: 'from-slate-700 to-zinc-800' },
        { name: 'Overdue Mgmt', href: '/admin/overdue-management', icon: Clock, color: 'from-rose-600 to-pink-600' },
        { name: 'Penalty Config', href: '/admin/penalty-config', icon: AlertTriangle, color: 'from-red-500 to-rose-600' },
        { name: 'Settings', href: '/admin/settings', icon: Settings, color: 'from-zinc-500 to-slate-600' },
    ]

    return (
        <div className="min-h-screen bg-[#F1F5F9]">
            {/* Mobile sidebar backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-sm transition-opacity"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 z-50 h-full w-72 bg-[#1e293b] text-slate-300 transform transition-all duration-300 ease-in-out lg:translate-x-0 border-r border-slate-800 shadow-xl ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <div className="flex flex-col h-full relative overflow-hidden">
                    {/* Logo Section */}
                    <div className="flex items-center justify-between h-20 px-6 relative z-10 border-b border-slate-800/50">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-900/20">
                                <ShieldCheck className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xl font-bold text-white leading-none tracking-tight">FINANCE</span>
                                <span className="text-[10px] font-semibold text-orange-400 uppercase tracking-widest mt-1">Admin System</span>
                            </div>
                        </div>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="lg:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Navigation Section */}
                    <nav className="flex-1 px-4 py-8 space-y-1 overflow-y-auto relative z-10">
                        <p className="px-4 mb-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Main Menu</p>
                        {navigation.map((item) => {
                            const Icon = item.icon
                            const isActive = pathname === item.href
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    onClick={() => setSidebarOpen(false)}
                                    className={`group flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 ${isActive
                                        ? `bg-orange-600 text-white shadow-md shadow-orange-900/20`
                                        : 'hover:bg-slate-800 hover:text-white text-slate-400'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`} />
                                        <span className={`text-sm tracking-wide ${isActive ? 'font-semibold' : 'font-medium'}`}>{item.name}</span>
                                    </div>
                                    {isActive && <ChevronRight className="w-4 h-4 text-white/50" />}
                                </Link>
                            )
                        })}
                    </nav>

                    {/* Bottom Profile Section */}
                    <div className="p-6 border-t border-slate-800 relative z-10">
                        <div className="flex items-center gap-3 mb-6 px-2">
                            <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-orange-500 font-bold border border-slate-700">
                                {session?.user?.name?.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-white truncate">{session?.user?.name}</p>
                                <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mt-0.5">{session?.user?.role}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => signOut({ callbackUrl: '/login' })}
                            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-slate-800 hover:bg-red-600 text-slate-400 hover:text-white border border-slate-700 hover:border-red-600 rounded-lg transition-all duration-200 font-bold text-xs uppercase tracking-widest active:scale-95"
                        >
                            <LogOut className="w-4 h-4" />
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main content Area */}
            <div className="lg:pl-72 flex flex-col min-h-screen">
                {/* Header */}
                <header className="sticky top-0 z-30 h-20 bg-white border-b border-slate-200 lg:px-10 px-6 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 tracking-tight capitalize">
                                {pathname.split('/').pop()?.replace('-', ' ')}
                            </h2>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">System Management</span>
                                <span className="text-slate-300">|</span>
                                <span className="text-[10px] font-bold text-orange-600 uppercase tracking-widest">{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden sm:flex items-center gap-4 mr-4 px-4 py-2 bg-slate-50 rounded-lg border border-slate-100">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">System Active</span>
                        </div>
                        <Link
                            href="/admin/settings"
                            className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-all border border-transparent hover:border-slate-200"
                        >
                            <Settings className="w-5 h-5" />
                        </Link>
                    </div>
                </header>

                {/* Page content scrollable */}
                <main className="p-6 lg:p-10 flex-1 animate-in fade-in slide-in-from-bottom-2 transition-all duration-700 bg-gradient-to-b from-white to-slate-50">
                    {children}
                </main>
            </div>
        </div>
    )
}