import { Customer, Collector, Token, RepaymentSchedule, Payment, AdminUser } from '@prisma/client'

// ============================================
// EXTENDED TYPES WITH RELATIONS
// ============================================

export type CustomerWithTokens = Customer & {
    tokens: Token[]
}

export type CollectorWithStats = Collector & {
    tokens: Token[]
    payments: Payment[]
    _count?: {
        tokens: number
        payments: number
    }
}

export type TokenWithDetails = Token & {
    customer: Customer
    collector: Collector
    schedules: RepaymentSchedule[]
    payments: Payment[]
}

export type ScheduleWithPayments = RepaymentSchedule & {
    token: Token
    payments: Payment[]
}

export type PaymentWithDetails = Payment & {
    token: Token
    collector: Collector
    schedule: RepaymentSchedule
}

// ============================================
// FORM INPUT TYPES
// ============================================

export interface CustomerFormInput {
    name: string
    mobile: string
    address?: string
    aadhaar?: string
    photoUrl?: string
}

export interface CollectorFormInput {
    name: string
    mobile: string
    email?: string
    password: string
}

export interface TokenFormInput {
    customerId: number
    collectorId: number
    loanAmount: number
    interestType: 'fixed' | 'percentage'
    interestValue: number
    durationDays: number
    startDate: Date
}

export interface PaymentFormInput {
    tokenId: number
    scheduleId: number
    amount: number
    paymentMode: 'cash' | 'upi' | 'bank_transfer'
    paymentDate: Date
    remarks?: string
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T = any> {
    success: boolean
    data?: T
    error?: string
    message?: string
}

export interface PaginatedResponse<T> {
    success: boolean
    data: T[]
    pagination: {
        page: number
        pageSize: number
        totalPages: number
        totalRecords: number
    }
}

// ============================================
// DASHBOARD STATS TYPES
// ============================================

export interface AdminDashboardStats {
    totalActiveTokens: number
    totalDisbursedAmount: number
    totalCollectedAmount: number
    totalOutstandingAmount: number
    totalOverdueAmount: number
    todayCollectionTarget: number
    todayActualCollection: number
    collectionEfficiency: number
}

export interface CollectorDashboardStats {
    todayTarget: number
    todayCollected: number
    pendingCount: number
    overdueCount: number
    cashInHand: number
    assignedCustomers: number
}

export interface DirectorDashboardStats {
    totalActiveTokens: number
    todayCollection: {
        target: number
        collected: number
        percentage: number
    }
    totalOutstanding: number
    totalDisbursed: number
    overdueCount: number
    overdueAmount: number
    cashInHand: number
}

// ============================================
// REPORT TYPES
// ============================================

export interface CollectionReportItem {
    date: string
    tokenNo: string
    customerName: string
    collectorName: string
    amount: number
    paymentMode: string
}

export interface OverdueReportItem {
    tokenNo: string
    customerName: string
    customerMobile: string
    collectorName: string
    overdueDays: number
    pendingAmount: number
    penaltyAmount: number
    lastPaymentDate?: string
}

export interface CollectorPerformance {
    collectorId: number
    collectorName: string
    assignedCustomers: number
    activeTokens: number
    totalDisbursed: number
    totalCollected: number
    pendingAmount: number
    overdueCount: number
    overdueAmount: number
    efficiency: number
}

// ============================================
// FILTER/SEARCH TYPES
// ============================================

export interface CustomerFilters {
    search?: string
    isActive?: boolean
    hasActiveLoans?: boolean
    page?: number
    pageSize?: number
}

export interface TokenFilters {
    search?: string
    customerId?: number
    collectorId?: number
    status?: 'active' | 'closed' | 'overdue' | 'cancelled'
    startDate?: Date
    endDate?: Date
    page?: number
    pageSize?: number
}

export interface PaymentFilters {
    tokenId?: number
    collectorId?: number
    startDate?: Date
    endDate?: Date
    paymentMode?: 'cash' | 'upi' | 'bank_transfer'
    page?: number
    pageSize?: number
}

// ============================================
// AUTH TYPES
// ============================================

export interface LoginCredentials {
    mobile: string
    password: string
    userType: 'admin' | 'collector' | 'director'
}

export interface AuthUser {
    id: number
    name: string
    mobile: string
    email?: string
    role: string
    userType: 'admin' | 'collector' | 'director'
}

// ============================================
// CALCULATION HELPERS
// ============================================

export interface TokenCalculation {
    loanAmount: number
    interestType: 'fixed' | 'percentage'
    interestValue: number
    totalAmount: number
    durationDays: number
    dailyInstallment: number
    startDate: Date
    endDate: Date
}

export interface PenaltyCalculation {
    scheduleId: number
    daysOverdue: number
    penaltyAmount: number
    totalDue: number
}