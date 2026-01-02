import { addDays, differenceInDays } from 'date-fns'

// ============================================
// TOKEN CALCULATIONS
// ============================================

export interface TokenCalculationInput {
    loanAmount: number
    interestType: 'fixed' | 'percentage'
    interestValue: number
    durationDays: number
    startDate: Date
}

export interface TokenCalculationResult {
    totalAmount: number
    dailyInstallment: number
    endDate: Date
}

/**
 * Calculate total amount, daily installment, and end date for a token
 */
export function calculateTokenDetails(input: TokenCalculationInput): TokenCalculationResult {
    const { loanAmount, interestType, interestValue, durationDays, startDate } = input

    // Calculate total amount based on interest type
    let totalAmount: number
    if (interestType === 'fixed') {
        totalAmount = loanAmount + interestValue
    } else {
        // percentage
        totalAmount = loanAmount + (loanAmount * interestValue) / 100
    }

    // Round to 2 decimal places
    totalAmount = Math.round(totalAmount * 100) / 100

    // Calculate daily installment
    const dailyInstallment = Math.round((totalAmount / durationDays) * 100) / 100

    // Calculate end date
    const endDate = addDays(startDate, durationDays - 1) // -1 because start date is day 1

    return {
        totalAmount,
        dailyInstallment,
        endDate,
    }
}

// ============================================
// PENALTY CALCULATIONS
// ============================================

export interface PenaltyCalculationInput {
    installmentAmount: number
    penaltyType: 'fixed' | 'percent'
    penaltyValue: number
    daysOverdue: number
    graceDays: number
}

/**
 * Calculate penalty amount based on configuration
 */
export function calculatePenalty(input: PenaltyCalculationInput): number {
    const { installmentAmount, penaltyType, penaltyValue, daysOverdue, graceDays } = input

    // If within grace period, no penalty
    if (daysOverdue <= graceDays) {
        return 0
    }

    const actualOverdueDays = daysOverdue - graceDays

    let penalty: number
    if (penaltyType === 'fixed') {
        penalty = penaltyValue * actualOverdueDays
    } else {
        // percentage
        penalty = (installmentAmount * penaltyValue * actualOverdueDays) / 100
    }

    // Round to 2 decimal places
    return Math.round(penalty * 100) / 100
}

/**
 * Calculate days overdue for a schedule
 */
export function calculateDaysOverdue(scheduleDate: Date, currentDate: Date = new Date()): number {
    // Reset time to midnight for accurate day calculation
    const scheduleDateMidnight = new Date(scheduleDate)
    scheduleDateMidnight.setHours(0, 0, 0, 0)

    const currentDateMidnight = new Date(currentDate)
    currentDateMidnight.setHours(0, 0, 0, 0)

    const days = differenceInDays(currentDateMidnight, scheduleDateMidnight)
    return days > 0 ? days : 0
}

// ============================================
// SCHEDULE STATUS CALCULATION
// ============================================

export type ScheduleStatus = 'pending' | 'paid' | 'overdue' | 'partial'

/**
 * Determine schedule status based on amounts and dates
 */
export function determineScheduleStatus(
    scheduleDate: Date,
    totalDue: number,
    paidAmount: number,
    currentDate: Date = new Date()
): ScheduleStatus {
    // If fully paid
    if (paidAmount >= totalDue) {
        return 'paid'
    }

    // If partially paid
    if (paidAmount > 0 && paidAmount < totalDue) {
        return 'partial'
    }

    // Check if overdue
    const scheduleDateMidnight = new Date(scheduleDate)
    scheduleDateMidnight.setHours(0, 0, 0, 0)

    const currentDateMidnight = new Date(currentDate)
    currentDateMidnight.setHours(0, 0, 0, 0)

    if (currentDateMidnight > scheduleDateMidnight) {
        return 'overdue'
    }

    // Default to pending
    return 'pending'
}

// ============================================
// COLLECTION EFFICIENCY CALCULATION
// ============================================

/**
 * Calculate collection efficiency percentage
 */
export function calculateCollectionEfficiency(totalDue: number, totalCollected: number): number {
    if (totalDue === 0) return 0
    const efficiency = (totalCollected / totalDue) * 100
    return Math.round(efficiency * 100) / 100
}

// ============================================
// TOKEN NUMBER GENERATION
// ============================================

/**
 * Generate token number in format: TKN-YYYYMMDD-XXXX
 */
export function generateTokenNumber(sequenceNumber: number): string {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    const sequence = String(sequenceNumber).padStart(4, '0')

    return `TKN-${year}${month}${day}-${sequence}`
}

/**
 * Generate collector ID in format: COL-YYYY-XXXX
 */
export function generateCollectorId(sequenceNumber: number): string {
    const year = new Date().getFullYear()
    const sequence = String(sequenceNumber).padStart(4, '0')

    return `COL-${year}-${sequence}`
}

// ============================================
// AMOUNT FORMATTING
// ============================================

/**
 * Format amount to Indian currency format
 */
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 2,
    }).format(amount)
}

/**
 * Format amount to 2 decimal places
 */
export function formatAmount(amount: number): number {
    return Math.round(amount * 100) / 100
}

// ============================================
// DATE UTILITIES
// ============================================

/**
 * Check if date is today
 */
export function isToday(date: Date): boolean {
    const today = new Date()
    return (
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
    )
}

/**
 * Format date to YYYY-MM-DD
 */
export function formatDateToISO(date: Date): string {
    return date.toISOString().split('T')[0]
}

/**
 * Format date to DD/MM/YYYY
 */
export function formatDateToIndian(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
}