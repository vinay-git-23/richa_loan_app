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
    ArrowLeft,
    Settings,
    Package,
    History
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
    const [loggingOut, setLoggingOut] = useState(false)

    const sidebarContextValue: SidebarContextType = {
        openSidebar: () => setSidebarOpen(true),
        closeSidebar: () => setSidebarOpen(false)
    }

    const navigation = [
        { name: 'Dashboard', href: '/collectors/dashboard', icon: TrendingUp, color: 'from-orange-600 to-orange-500' },
        { name: 'My Batches', href: '/collectors/tokens', icon: Package, color: 'from-slate-600 to-slate-700' },
        { name: 'Due List', href: '/collectors/due-list', icon: AlertTriangle, color: 'from-red-500 to-rose-600' },
        { name: 'Record Payment', href: '/collectors/payment', icon: IndianRupee, color: 'from-emerald-600 to-teal-600' },
        { name: 'My Account', href: '/collectors/account', icon: Wallet, color: 'from-orange-600 to-amber-600' },
        { name: 'History', href: '/collectors/history', icon: History, color: 'from-indigo-600 to-purple-600' },
        { name: 'Penalties', href: '/collectors/penalties', icon: AlertTriangle, color: 'from-rose-600 to-pink-600' },
        { name: 'Settings', href: '/collectors/settings', icon: Settings, color: 'from-slate-600 to-slate-700' },
    ]

    const isHomePage = pathname === '/collectors/dashboard'
    
    // Pages that have their own headers and should not show layout header
    const pagesWithOwnHeader = [
        '/collectors/token-batches/',  // Detail pages with custom headers
        '/collectors/tokens/',          // Detail pages
        '/collectors/due-list',         // Has its own header
        '/collectors/history',          // Has its own header
        '/collectors/penalties',        // Has its own header
        '/collectors/account',          // Has its own header
        '/collectors/payment',          // Has its own header
    ]
    const hasOwnHeader = pagesWithOwnHeader.some(path => pathname.startsWith(path))

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

                {/* Sidebar Drawer - Lighter Orange/Gray Theme */}
                <aside
                    className={`fixed top-0 left-0 z-50 h-full w-80 bg-gradient-to-b from-slate-700 to-slate-600 text-slate-200 transform transition-all duration-300 ease-in-out ${
                        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
                >
                    <div className="flex flex-col h-full relative overflow-hidden">
                        {/* Header */}
                        <div className="p-6 border-b border-slate-600/50 relative z-10">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-black text-white tracking-tight">Menu</h2>
                                <button
                                    onClick={() => setSidebarOpen(false)}
                                    className="p-2 text-slate-300 hover:text-white hover:bg-slate-600 rounded-xl transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* User Profile */}
                            <div className="flex items-center gap-3 px-3 py-4 bg-gradient-to-br from-orange-500/30 to-orange-400/20 rounded-2xl border border-orange-400/30 backdrop-blur-sm">
                                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-400 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-orange-500/30 border border-orange-300/30">
                                    {session?.user?.name?.charAt(0) || 'C'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-white truncate">{session?.user?.name}</p>
                                    <p className="text-xs font-medium text-orange-300 uppercase tracking-wider mt-0.5">
                                        Collector
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Navigation Links */}
                        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto relative z-10">
                            <p className="px-4 mb-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
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
                                        className={`w-full group flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-200 ${
                                            isActive
                                                ? 'bg-gradient-to-r from-orange-500 to-orange-400 text-white shadow-lg shadow-orange-500/30'
                                                : 'hover:bg-slate-600/50 hover:text-white text-slate-300'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Icon
                                                className={`w-5 h-5 ${
                                                    isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'
                                                }`}
                                            />
                                            <span className={`text-sm tracking-wide ${isActive ? 'font-bold' : 'font-medium'}`}>
                                                {item.name}
                                            </span>
                                        </div>
                                        {isActive && <ChevronRight className="w-4 h-4 text-white/70" />}
                                    </button>
                                )
                            })}
                        </nav>

                        {/* Logout Button */}
                        <div className="p-6 border-t border-slate-600/50 relative z-10">
                            <button
                                onClick={async () => {
                                    setLoggingOut(true)
                                    setSidebarOpen(false)
                                    // Immediate redirect for better UX
                                    router.push('/login')
                                    // Sign out in background (non-blocking)
                                    signOut({ redirect: false, callbackUrl: '/login' }).catch(() => {})
                                }}
                                disabled={loggingOut}
                                className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-slate-600/50 hover:bg-red-500/90 text-slate-200 hover:text-white border border-slate-500 hover:border-red-400 rounded-2xl transition-all duration-200 font-bold text-sm uppercase tracking-widest active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loggingOut ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Logging out...</span>
                                    </>
                                ) : (
                                    <>
                                        <LogOut className="w-4 h-4" />
                                        <span>Logout</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <div className="flex flex-col min-h-screen">
                    {/* Top Header - Only show if not on home page and page doesn't have its own header */}
                    {!isHomePage && !hasOwnHeader && (
                        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
                            <div className="flex items-center gap-4 px-5 py-4">
                                <button
                                    onClick={() => router.back()}
                                    className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-all active:scale-95"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                </button>
                                <div className="flex-1">
                                    <h1 className="text-lg font-black text-slate-900 tracking-tight">{getPageTitle()}</h1>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={async () => {
                                            setLoggingOut(true)
                                            setSidebarOpen(false)
                                            router.push('/login')
                                            signOut({ redirect: false, callbackUrl: '/login' }).catch(() => {})
                                        }}
                                        disabled={loggingOut}
                                        className="p-2 text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all active:scale-95 disabled:opacity-50"
                                        title="Sign Out"
                                    >
                                        {loggingOut ? (
                                            <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                                        ) : (
                                            <LogOut className="w-5 h-5" />
                                        )}
                                    </button>
                                    <button
                                        onClick={() => setSidebarOpen(true)}
                                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-all active:scale-95"
                                    >
                                        <Menu className="w-5 h-5" />
                                    </button>
                                </div>
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
