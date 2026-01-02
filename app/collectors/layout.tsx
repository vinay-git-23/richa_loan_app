'use client'

import { useSession, signOut } from 'next-auth/react'
import { SessionProvider } from 'next-auth/react'
import { usePathname, useRouter } from 'next/navigation'
import { useState, createContext, useContext } from 'react'
import {
    TrendingUp,
    FileText,
    IndianRupee,
    Clock,
    Wallet,
    AlertTriangle,
    Menu,
    X,
    LogOut,
    ChevronRight,
    ArrowLeft
} from 'lucide-react'

interface SidebarContextType {
    openSidebar: () => void
    closeSidebar: () => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export const useSidebar = () => {
    const context = useContext(SidebarContext)
    if (!context) {
        throw new Error('useSidebar must be used within CollectorLayout')
    }
    return context
}

export default function CollectorLayout({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <CollectorLayoutContent>{children}</CollectorLayoutContent>
        </SessionProvider>
    )
}

function CollectorLayoutContent({ children }: { children: React.ReactNode }) {
    const { data: session } = useSession()
    const pathname = usePathname()
    const router = useRouter()
    const [sidebarOpen, setSidebarOpen] = useState(false)

    const sidebarContextValue: SidebarContextType = {
        openSidebar: () => setSidebarOpen(true),
        closeSidebar: () => setSidebarOpen(false)
    }

    const navigation = [
        { name: 'Dashboard', href: '/collectors/dashboard', icon: TrendingUp, color: 'from-blue-600 to-indigo-600' },
        { name: 'My Tokens', href: '/collectors/tokens', icon: FileText, color: 'from-slate-600 to-slate-700' },
        { name: 'Due List', href: '/collectors/due-list', icon: AlertTriangle, color: 'from-red-500 to-rose-600' },
        { name: 'Record Payment', href: '/collectors/payment', icon: IndianRupee, color: 'from-emerald-600 to-teal-600' },
        { name: 'Cash Account', href: '/collectors/cash-account', icon: Wallet, color: 'from-orange-600 to-amber-600' },
        { name: 'History', href: '/collectors/history', icon: Clock, color: 'from-indigo-600 to-purple-600' },
        { name: 'Penalties', href: '/collectors/penalties', icon: AlertTriangle, color: 'from-rose-600 to-pink-600' },
    ]

    const isHomePage = pathname === '/collectors/dashboard'

    const getPageTitle = () => {
        const route = navigation.find(nav => pathname.startsWith(nav.href))
        return route?.name || 'Collector Portal'
    }

    return (
        <SidebarContext.Provider value={sidebarContextValue}>
            <div className="min-h-screen bg-[#F8FAFC]">
                {/* Mobile sidebar backdrop */}
                {sidebarOpen && (
                    <div
                        className="fixed inset-0 bg-slate-900/60 z-40 backdrop-blur-sm transition-opacity"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

            {/* Sidebar Drawer */}
            <aside
                className={`fixed top-0 left-0 z-50 h-full w-80 bg-[#0F172A] text-slate-300 transform transition-all duration-300 ease-in-out ${
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                <div className="flex flex-col h-full relative overflow-hidden">
                    {/* Header */}
                    <div className="p-6 border-b border-slate-800/50 relative z-10">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-white tracking-tight">Menu</h2>
                            <button
                                onClick={() => setSidebarOpen(false)}
                                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* User Profile */}
                        <div className="flex items-center gap-3 px-3 py-4 bg-slate-800/30 rounded-xl border border-slate-700/30">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg border border-blue-400/30">
                                {session?.user?.name?.charAt(0) || 'C'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-white truncate">{session?.user?.name}</p>
                                <p className="text-xs font-medium text-blue-400 uppercase tracking-wider mt-0.5">
                                    Collector
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Navigation Links */}
                    <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto relative z-10">
                        <p className="px-4 mb-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            Main Menu
                        </p>
                        {navigation.map((item) => {
                            const Icon = item.icon
                            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                            return (
                                <button
                                    key={item.name}
                                    onClick={() => {
                                        router.push(item.href)
                                        setSidebarOpen(false)
                                    }}
                                    className={`w-full group flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 ${
                                        isActive
                                            ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20'
                                            : 'hover:bg-slate-800 hover:text-white text-slate-400'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <Icon
                                            className={`w-5 h-5 ${
                                                isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'
                                            }`}
                                        />
                                        <span className={`text-sm tracking-wide ${isActive ? 'font-semibold' : 'font-medium'}`}>
                                            {item.name}
                                        </span>
                                    </div>
                                    {isActive && <ChevronRight className="w-4 h-4 text-white/50" />}
                                </button>
                            )
                        })}
                    </nav>

                    {/* Logout Button */}
                    <div className="p-6 border-t border-slate-800 relative z-10">
                        <button
                            onClick={() => signOut({ callbackUrl: '/login' })}
                            className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-slate-800 hover:bg-red-600 text-slate-400 hover:text-white border border-slate-700 hover:border-red-600 rounded-xl transition-all duration-200 font-bold text-sm uppercase tracking-widest active:scale-95"
                        >
                            <LogOut className="w-4 h-4" />
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex flex-col min-h-screen">
                {/* Top Header - Only show if not on home page */}
                {!isHomePage && (
                    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
                        <div className="flex items-center gap-4 px-5 py-4">
                            <button
                                onClick={() => router.back()}
                                className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div className="flex-1">
                                <h1 className="text-lg font-bold text-slate-900 tracking-tight">{getPageTitle()}</h1>
                            </div>
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                            >
                                <Menu className="w-5 h-5" />
                            </button>
                        </div>
                    </header>
                )}

                {/* Page Content */}
                <main className={`flex-1 ${isHomePage ? '' : 'pb-24'}`}>{children}</main>
            </div>
        </div>
        </SidebarContext.Provider>
    )
}