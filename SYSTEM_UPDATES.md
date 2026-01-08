# Finance Management System - Complete System Update

## Overview
This document outlines the comprehensive updates made to support multi-token customer management, multi-token payments, and collector-side token generation.

---

## Key Requirements Implemented

### ✅ 1. Multiple Tokens Per Customer
- **Requirement**: One customer can have N number of tokens simultaneously
- **Implementation**:
  - No database constraints limiting tokens per customer
  - Customers can have unlimited active tokens
  - Each token tracked independently with its own schedules and payments

### ✅ 2. Multi-Token Payment Collection
- **Requirement**: Collection can be done for N number of tokens at the same time
- **Implementation**:
  - New `PaymentAllocation` table to track payment distribution across multiple tokens
  - API endpoint `/api/payments/multi-token` for batch payments
  - Payments can be split across multiple tokens in a single transaction
  - Each allocation tracked at schedule level for granular reporting

### ✅ 3. Customer Profile with All Tokens Summary
- **Requirement**: Customer profile shows consolidated summary of all tokens
- **Implementation**:
  - New API endpoint `/api/customers/[id]/summary`
  - Consolidated metrics across all tokens:
    - Total borrowed, total paid, total outstanding
    - Active/closed/overdue token counts
    - Penalties, today's dues, next payment dates
  - Per-token detailed statistics
  - Recent payments and upcoming schedules for each token

### ✅ 4. Token Generation on Both Sides
- **Requirement**: Tokens can be generated from both collector and admin sides
- **Implementation**:
  - **Admin**: `/api/tokens` (POST) - existing, enhanced with `createdBy` tracking
  - **Collector**: `/api/collectors/tokens/create` (POST) - new endpoint
  - Collector UI: `/collectors/tokens/create` page
  - `createdBy` field in Token model tracks origin (admin/collector)
  - Both have same validation and calculation logic

---

## Database Schema Changes

### Modified Tables

#### 1. `payments` Table
```sql
ALTER TABLE payments ADD COLUMN customerId INT NULL;
ALTER TABLE payments ADD COLUMN isMultiToken BOOLEAN DEFAULT FALSE;
ALTER TABLE payments ADD COLUMN createdBy ENUM('admin', 'collector', 'director') DEFAULT 'admin';
ALTER TABLE payments MODIFY tokenId INT NULL;
ALTER TABLE payments MODIFY scheduleId INT NULL;
```

**New Fields**:
- `customerId`: Links payment to customer (for multi-token payments)
- `isMultiToken`: Flag indicating if payment spans multiple tokens
- `createdBy`: Tracks who created the payment (admin/collector)
- `tokenId` & `scheduleId`: Made nullable for multi-token payments

#### 2. `tokens` Table
```sql
ALTER TABLE tokens ADD COLUMN createdBy ENUM('admin', 'collector', 'director') DEFAULT 'admin';
```

**New Fields**:
- `createdBy`: Tracks whether admin or collector created the token

### New Tables

#### 3. `payment_allocations` Table (NEW)
```sql
CREATE TABLE payment_allocations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  paymentId INT NOT NULL,
  tokenId INT NOT NULL,
  scheduleId INT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (paymentId) REFERENCES payments(id) ON DELETE CASCADE,
  FOREIGN KEY (tokenId) REFERENCES tokens(id),
  FOREIGN KEY (scheduleId) REFERENCES repayment_schedule(id),
  INDEX idx_paymentId (paymentId),
  INDEX idx_tokenId (tokenId),
  INDEX idx_scheduleId (scheduleId)
);
```

**Purpose**: Tracks how a multi-token payment is distributed across different tokens and schedules.

---

## New API Endpoints

### 1. Customer Summary API
**Endpoint**: `GET /api/customers/[id]/summary`

**Authorization**: Any authenticated user

**Response**:
```json
{
  "success": true,
  "data": {
    "customer": { /* customer details */ },
    "consolidatedSummary": {
      "totalTokens": 5,
      "activeTokens": 3,
      "closedTokens": 1,
      "overdueTokens": 1,
      "totalBorrowed": 50000,
      "totalAmountDue": 55000,
      "totalPaid": 25000,
      "totalOutstanding": 30000,
      "totalOverdue": 5000,
      "totalPenalties": 500,
      "nextPaymentDue": "2026-01-07",
      "todaysDue": 1500
    },
    "tokens": [
      {
        "tokenId": 1,
        "tokenNo": "TKN-20260106-0001",
        "status": "active",
        "statistics": {
          "totalPaid": 5000,
          "outstanding": 5000,
          "overdueAmount": 0,
          "completionPercentage": 50,
          "todayDue": 100,
          "nextDueDate": "2026-01-07"
        },
        "recentPayments": [ /* last 5 payments */ ],
        "upcomingSchedules": [ /* next 7 schedules */ ]
      }
    ]
  }
}
```

**Features**:
- Consolidated summary across ALL customer tokens
- Per-token detailed statistics
- Recent payment history
- Upcoming payment schedules

---

### 2. Multi-Token Payment API
**Endpoint**: `POST /api/payments/multi-token`

**Authorization**: Admin or Collector

**Request Body**:
```json
{
  "customerId": 1,
  "tokenAllocations": [
    { "tokenId": 1, "amount": 500 },
    { "tokenId": 2, "amount": 300 },
    { "tokenId": 3, "amount": 200 }
  ],
  "paymentMode": "cash",
  "paymentDate": "2026-01-06",
  "remarks": "Collected from customer residence",
  "photoUrl": "base64_or_url"
}
```

**Process**:
1. Validates all tokens belong to the customer
2. Verifies collector assignment (if collector user)
3. Creates single `Payment` record with total amount
4. Creates `PaymentAllocation` records for each token distribution
5. Applies payment to schedules in chronological order
6. Updates schedule statuses (pending → partial → paid)
7. Auto-closes tokens when fully paid
8. All operations in atomic transaction

**Response**:
```json
{
  "success": true,
  "message": "Multi-token payment recorded successfully",
  "data": {
    "payment": { /* payment record */ },
    "allocations": [ /* allocation records */ ]
  }
}
```

---

### 3. Collector Token Creation API
**Endpoint**: `POST /api/collectors/tokens/create`

**Authorization**: Collector only

**Request Body**:
```json
{
  "customerId": 1,
  "loanAmount": 10000,
  "interestType": "percentage",
  "interestValue": 10,
  "durationDays": 100,
  "startDate": "2026-01-06"
}
```

**Process**:
1. Validates collector is active
2. Validates customer exists and is active
3. Calculates token details (total amount, daily installment, end date)
4. Generates unique token number
5. Creates token with `createdBy: 'collector'`
6. Auto-assigns to the collector creating it
7. Generates daily repayment schedules
8. All in atomic transaction

**Response**:
```json
{
  "success": true,
  "message": "Token created successfully by collector",
  "data": { /* token record */ }
}
```

---

### 4. Get Multi-Token Payment History
**Endpoint**: `GET /api/payments/multi-token`

**Query Parameters**:
- `customerId` (optional): Filter by customer
- `page` (default: 1)
- `pageSize` (default: 20)

**Authorization**: Admin/Director see all, Collector sees only their own

**Response**: Paginated list of multi-token payments with allocations

---

## Updated API Endpoints

### 1. Admin Token Creation
**Endpoint**: `POST /api/tokens`

**Changes**:
- Now sets `createdBy: 'admin'` automatically
- All other functionality remains same

---

## New UI Pages

### 1. Collector Token Creation Page
**Path**: `/collectors/tokens/create`

**Features**:
- Search and select customer
- Enter loan details (amount, duration, interest)
- Live calculation preview (total amount, daily installment, end date)
- Responsive design matching collector app theme
- Success message and auto-redirect to tokens list

**Access**: Collector login required

**Screenshot Flow**:
1. Customer selection with search
2. Loan details input form
3. Real-time calculation preview
4. Validation and submission
5. Success notification

---

### 2. Updated Collector Tokens List
**Path**: `/collectors/tokens`

**Changes**:
- Added "New Token" button in header
- Navigates to `/collectors/tokens/create`
- Maintains all existing functionality (search, filters, token cards)

---

## UI Enhancements Needed (Future Work)

### 1. Multi-Token Payment UI (Collector)
**Recommendation**: Update `/collectors/payment/page.tsx`

**Features to Add**:
- Select customer instead of token
- Display all customer's active tokens
- Input total collection amount
- Manually allocate amount across tokens OR
- Auto-distribute based on priority (overdue first, then by date)
- Show remaining balance as user allocates
- Visual breakdown of allocation before submission

### 2. Customer Profile Page (Admin)
**Path**: `/admin/customers/[id]/page.tsx`

**Recommendation**: Replace current token list with summary from new API

**Features to Add**:
- Consolidated summary cards (total borrowed, paid, outstanding, overdue)
- Gauge charts for completion percentage
- Timeline view of all tokens
- Grouped payment history across all tokens
- Filters for active/closed/overdue tokens only

### 3. Multi-Token Payment UI (Admin)
**Recommendation**: Create `/admin/payments/multi-token` page

**Features**: Same as collector version but with:
- Collector selection (admin can record on behalf of any collector)
- Customer selection
- Token allocation interface
- Enhanced reporting options

---

## Key Business Logic

### Multi-Token Payment Distribution Algorithm

```
For each token allocation:
  1. Get all pending/partial/overdue schedules ordered by date
  2. For each schedule:
     a. Calculate remaining due (totalDue - paidAmount)
     b. Apply minimum of (allocation amount, remaining due)
     c. Update schedule paidAmount
     d. Update schedule status:
        - paid if paidAmount >= totalDue
        - partial if 0 < paidAmount < totalDue
     e. Reduce allocation amount by applied amount
  3. Check if all schedules are paid:
     - If yes: Set token status to 'closed'
     - If has overdue: Set token status to 'overdue'
     - Else: Keep as 'active'
```

### Token Status Auto-Update
- **Active**: Has pending schedules, no overdue
- **Overdue**: Has at least one overdue schedule
- **Closed**: All schedules paid
- **Cancelled**: Manually cancelled (not affected by payments)

---

## Database Relationships

```
Customer (1) ──── (N) Token
Token (1) ──── (N) RepaymentSchedule
Token (1) ──── (N) Payment (single-token)
Token (1) ──── (N) PaymentAllocation (multi-token)

Payment (1) ──── (N) PaymentAllocation
Payment (N) ──── (1) Collector

RepaymentSchedule (1) ──── (N) Payment (direct)
RepaymentSchedule (1) ──── (N) PaymentAllocation (via multi-token)
```

---

## Security & Validation

### Authorization Rules

| Endpoint | Admin | Director | Collector |
|----------|-------|----------|-----------|
| GET /api/customers/[id]/summary | ✅ All | ✅ All | ✅ All |
| POST /api/payments/multi-token | ✅ Any customer/collector | ✅ Read-only | ✅ Own tokens only |
| GET /api/payments/multi-token | ✅ All payments | ✅ All payments | ✅ Own payments |
| POST /api/collectors/tokens/create | ❌ | ❌ | ✅ |
| POST /api/tokens | ✅ | ❌ | ❌ |

### Data Validation

**Token Creation**:
- Customer must exist and be active
- Collector must exist and be active
- Loan amount > 0
- Duration days > 0
- Interest value >= 0
- Start date must be valid date

**Multi-Token Payment**:
- Customer must exist
- All tokens must belong to customer
- Collector can only pay their assigned tokens
- Total allocation amount must equal payment amount
- Payment amount must be > 0
- All tokens must be active or overdue (not closed/cancelled)

---

## Testing Checklist

### Database
- [x] Schema updated successfully
- [x] Prisma client regenerated
- [ ] Migration tested on staging

### APIs
- [x] Customer summary API created
- [x] Multi-token payment API created
- [x] Collector token creation API created
- [x] Admin token creation updated
- [ ] All endpoints tested with Postman/curl
- [ ] Error handling verified
- [ ] Authorization rules tested

### UI
- [x] Collector token creation page created
- [x] Collector tokens list updated with button
- [ ] Multi-token payment UI created (PENDING)
- [ ] Customer profile summary UI updated (PENDING)
- [ ] Mobile responsiveness tested
- [ ] Cross-browser compatibility checked

### Business Logic
- [ ] Multi-token payment distribution tested
- [ ] Token status auto-update verified
- [ ] Schedule status transitions tested
- [ ] Edge cases handled (partial payments, overpayments)
- [ ] Transaction rollback on errors tested

---

## Migration Guide

### For Existing Data

**Step 1**: Update existing payment records
```sql
-- Set createdBy for existing payments (assume admin created them)
UPDATE payments SET createdBy = 'admin' WHERE createdBy IS NULL;

-- Set isMultiToken flag (all existing are single-token)
UPDATE payments SET isMultiToken = FALSE WHERE isMultiToken IS NULL;
```

**Step 2**: Update existing token records
```sql
-- Set createdBy for existing tokens (assume admin created them)
UPDATE tokens SET createdBy = 'admin' WHERE createdBy IS NULL;
```

**Step 3**: No data loss - all existing single-token payments continue to work

---

## Known Limitations & Future Enhancements

### Current Limitations
1. Multi-token payment UI not yet implemented
2. No automatic payment priority (user must specify allocation)
3. No payment reversal/refund functionality
4. No consolidated reporting dashboard for multi-token customers
5. Penalty calculation exists but not integrated into multi-token payments

### Suggested Enhancements
1. **Smart Payment Allocation**: Auto-distribute payment across tokens based on:
   - Overdue amounts first
   - Oldest schedules first
   - Equal distribution option

2. **Customer Payment Portal**: Allow customers to:
   - View all their tokens in one place
   - See consolidated outstanding
   - Make online payments

3. **Advanced Reporting**:
   - Multi-token customer analysis
   - Collection efficiency by collector
   - Token creation source tracking (admin vs collector)

4. **Notifications**:
   - Alert collectors of multi-token customers approaching due dates
   - Notify admins of collector-created tokens for approval

5. **Token Bundling**:
   - Merge multiple small tokens into one consolidated token
   - Split large tokens into smaller ones

---

## API Examples

### Example 1: Record Multi-Token Payment

```bash
curl -X POST http://localhost:3000/api/payments/multi-token \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=..." \
  -d '{
    "customerId": 1,
    "tokenAllocations": [
      { "tokenId": 1, "amount": 500 },
      { "tokenId": 2, "amount": 300 }
    ],
    "paymentMode": "cash",
    "remarks": "Collected at customer home"
  }'
```

### Example 2: Get Customer Summary

```bash
curl http://localhost:3000/api/customers/1/summary \
  -H "Cookie: next-auth.session-token=..."
```

### Example 3: Collector Creates Token

```bash
curl -X POST http://localhost:3000/api/collectors/tokens/create \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=..." \
  -d '{
    "customerId": 5,
    "loanAmount": 15000,
    "interestType": "percentage",
    "interestValue": 10,
    "durationDays": 90,
    "startDate": "2026-01-06"
  }'
```

---

## Conclusion

The finance management system now fully supports:

✅ **Multi-Token Customers**: Unlimited tokens per customer
✅ **Multi-Token Payments**: Single payment across multiple tokens
✅ **Customer Consolidated View**: Summary of all tokens and payments
✅ **Collector Token Generation**: Collectors can create tokens independently
✅ **Comprehensive Tracking**: Full audit trail of who created what

**Next Priority**: Implement multi-token payment UI for collectors and admins to make the system fully functional end-to-end.

---

## File Changes Summary

### Schema
- `prisma/schema.prisma` - Updated Payment and Token models, added PaymentAllocation model

### API Endpoints (New)
- `app/api/customers/[id]/summary/route.ts` - Customer consolidated summary
- `app/api/payments/multi-token/route.ts` - Multi-token payment handling
- `app/api/collectors/tokens/create/route.ts` - Collector token creation

### API Endpoints (Modified)
- `app/api/tokens/route.ts` - Added `createdBy` tracking

### UI Pages (New)
- `app/collectors/tokens/create/page.tsx` - Collector token creation form

### UI Pages (Modified)
- `app/collectors/tokens/page.tsx` - Added "New Token" button

---

**Last Updated**: 2026-01-06
**System Version**: 2.0
**Database Schema Version**: 2.0
