# Token Batch System - Complete Implementation Guide

## Overview

The Token Batch System treats multiple tokens as a **single unified loan entity** for simplified collection and reporting. When a customer takes N tokens with the same configuration, they are grouped into a batch and managed as one loan.

## Key Concept

```
Traditional Approach (WRONG):
- Customer takes 12 tokens of ₹100 each
- Shows as 12 separate rows in reports
- Collection done token-by-token
- Confusing for tracking

Batch Approach (CORRECT):
- Customer takes 12 tokens of ₹100 each = 1 BATCH
- Shows as 1 row in reports (BATCH-20260106-0001)
- Collection: ₹1200 daily (12 × ₹100) as single payment
- Clean, unified tracking
```

## Database Schema

### TokenBatch Table
Main table for batch entities:

```prisma
model TokenBatch {
  id               Int         @id @default(autoincrement())
  batchNo          String      @unique              // BATCH-20260106-0001
  customerId       Int
  collectorId      Int
  quantity         Int                              // Number of tokens in batch
  loanAmount       Decimal                          // Per token amount
  totalBatchAmount Decimal                          // Total across all tokens
  interestType     InterestType
  interestValue    Decimal
  durationDays     Int
  dailyInstallment Decimal                          // Per token daily
  totalDailyAmount Decimal                          // Combined daily for batch
  startDate        DateTime
  endDate          DateTime
  status           TokenStatus
  createdBy        UserType

  // Relations
  customer       Customer
  collector      Collector
  tokens         Token[]                            // Individual tokens in batch
  batchSchedules BatchRepaymentSchedule[]
  batchPayments  BatchPayment[]
}
```

### BatchRepaymentSchedule Table
Daily installment schedules for the batch:

```prisma
model BatchRepaymentSchedule {
  id                Int            @id @default(autoincrement())
  batchId           Int
  scheduleDate      DateTime                        // Due date
  installmentAmount Decimal                         // Combined daily amount
  penaltyPerToken   Decimal                         // Penalty per token
  totalPenalty      Decimal                         // Total (penaltyPerToken × quantity)
  totalDue          Decimal                         // installmentAmount + totalPenalty
  paidAmount        Decimal
  penaltyWaived     Decimal                         // Waived penalty amount
  paymentDate       DateTime?
  status            ScheduleStatus

  batch    TokenBatch
  payments BatchPayment[]
}
```

### BatchPayment Table
Payment records for batch collections:

```prisma
model BatchPayment {
  id            Int         @id @default(autoincrement())
  batchId       Int
  scheduleId    Int
  collectorId   Int
  amount        Decimal
  penaltyWaived Decimal                             // Amount of penalty waived
  paymentMode   PaymentMode
  paymentDate   DateTime
  remarks       String?
  photoUrl      String?
  isSynced      Boolean
  createdBy     UserType

  batch    TokenBatch
  schedule BatchRepaymentSchedule
}
```

### Modified Token Table
Individual tokens now link to their batch:

```prisma
model Token {
  // ... existing fields
  batchId Int?                                      // NEW: Links to batch

  batch TokenBatch? @relation(fields: [batchId], references: [id])
  // ... other relations
}
```

## API Endpoints

### 1. Create Token Batch
**Endpoint:** `POST /api/token-batches`

**Request Body:**
```json
{
  "customerId": 1,
  "collectorId": 2,
  "loanAmount": 100,
  "interestType": "percentage",
  "interestValue": 70,
  "durationDays": 100,
  "startDate": "2026-01-06",
  "quantity": 12
}
```

**Response:**
```json
{
  "success": true,
  "message": "Token batch created successfully with 12 tokens",
  "data": {
    "batch": {
      "id": 1,
      "batchNo": "BATCH-20260106-0001",
      "quantity": 12,
      "totalBatchAmount": 2040.00,
      "totalDailyAmount": 20.40
    },
    "tokens": [...],
    "tokenCount": 12
  }
}
```

**What it does:**
1. Creates 1 TokenBatch record
2. Creates 12 Token records (linked to batch via batchId)
3. Creates individual RepaymentSchedule for each token
4. Creates BatchRepaymentSchedule (combined schedules)

### 2. Get Token Batches
**Endpoint:** `GET /api/token-batches`

**Query Parameters:**
- `page` - Page number
- `pageSize` - Items per page
- `status` - Filter by status (active/closed/overdue)
- `customerId` - Filter by customer
- `collectorId` - Filter by collector

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "batchNo": "BATCH-20260106-0001",
      "quantity": 12,
      "totalDailyAmount": 20.40,
      "customer": { "name": "John", "mobile": "9876543210" },
      "collector": { "name": "Agent A" },
      "tokens": [
        { "tokenNo": "TKN-20260106-0001", "status": "active" },
        // ... 11 more
      ]
    }
  ],
  "pagination": { "page": 1, "totalPages": 5 }
}
```

### 3. Get Batch Details
**Endpoint:** `GET /api/token-batches/[id]`

**Response:**
```json
{
  "success": true,
  "data": {
    "batch": {
      "id": 1,
      "batchNo": "BATCH-20260106-0001",
      "quantity": 12,
      "totalBatchAmount": 2040.00,
      "batchSchedules": [...],
      "batchPayments": [...]
    },
    "summary": {
      "totalScheduled": 2040.00,
      "totalPaid": 800.00,
      "totalOutstanding": 1240.00,
      "pendingCount": 90,
      "overdueCount": 5,
      "todaySchedule": { "totalDue": 20.40 },
      "nextSchedule": { "scheduleDate": "2026-01-07" }
    }
  }
}
```

### 4. Record Batch Payment
**Endpoint:** `POST /api/batch-payments`

**Request Body:**
```json
{
  "batchId": 1,
  "amount": 800,
  "paymentMode": "cash",
  "paymentDate": "2026-01-06",
  "penaltyWaived": 60,
  "remarks": "Partial payment"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment recorded successfully",
  "data": {
    "payments": [...],
    "updatedSchedules": [...],
    "amountApplied": 800.00,
    "remainingAmount": 0,
    "batchClosed": false
  }
}
```

**Payment Logic:**
1. Applies payment to pending schedules sequentially (oldest first)
2. Updates BatchRepaymentSchedule records
3. Marks schedules as 'paid', 'partial', or 'overdue'
4. If all schedules paid → closes batch and all tokens
5. Supports penalty waive-off

## User Interface

### Admin Token List (`/admin/tokens`)
Shows batches as single entities:

| Batch Details | Customer | Quantity | Daily Collection | Total Amount | Status |
|---------------|----------|----------|------------------|--------------|--------|
| BATCH-20260106-0001 | John | 12 Tokens | ₹20.40 | ₹2,040 | Active |

**Features:**
- Shows batch number instead of individual tokens
- Displays quantity (12 Tokens)
- Shows combined daily collection amount
- Single row per batch (not 12 rows)

### Create Token Batch (`/admin/tokens/create`)
Unified form for single or multiple tokens:

**Fields:**
1. Customer Selection
2. Loan Details:
   - Loan Amount (per token): ₹100
   - Duration: 100 days
   - Interest Type: Percentage
   - Interest Value: 70%
   - **Quantity: 12** (1-50)
3. Collector Assignment

**Summary Preview:**
- Total Payable Amount (each): ₹170
- Quantity: 12 Tokens
- **Combined Total: ₹2,040**
- Daily Payment (Each): ₹1.70
- **Daily Payment (Batch): ₹20.40**

## Collection Workflow

### Example: 12 Tokens of ₹100 each

**Setup:**
- Loan Amount: ₹100 × 12 = ₹1,200 principal
- Interest: 70% = ₹70 × 12 = ₹840
- Total: ₹2,040
- Duration: 100 days
- Daily Collection: ₹20.40

**Scenario 1: Full Payment**
```
Date: 2026-01-06
Amount: ₹20.40
Result: Schedule marked as 'paid'
```

**Scenario 2: Partial Payment**
```
Date: 2026-01-06
Amount: ₹15.00 (out of ₹20.40)
Result: Schedule marked as 'partial'
Outstanding: ₹5.40 for this date
```

**Scenario 3: Penalty with Waive-off**
```
Date: 2026-01-07 (overdue from 2026-01-06)
Penalty: ₹5 per token × 12 = ₹60
Amount Paid: ₹20.40 (today's installment)
Penalty Waived: ₹60
Result: Today paid, penalty waived
```

**Scenario 4: Multiple Days Payment**
```
Date: 2026-01-10
Amount: ₹61.20
Applies to:
- 2026-01-06: ₹20.40 (paid)
- 2026-01-07: ₹20.40 (paid)
- 2026-01-08: ₹20.40 (paid)
Result: 3 schedules marked as 'paid'
```

## Key Features

### 1. Single Entity Treatment
✅ Multiple tokens = 1 batch = 1 loan
✅ Reports show 1 row (not N rows)
✅ Collection tracked at batch level
✅ Easy to understand and manage

### 2. Batch-Level Collection
✅ Combined daily amount (₹20.40 for 12 tokens)
✅ Single payment entry
✅ Automatic distribution across schedules
✅ Partial payment support

### 3. Penalty Management
✅ Calculated per token (₹5 × 12 = ₹60)
✅ Can be waived at collection time
✅ Tracked in BatchRepaymentSchedule
✅ Flexible waive-off amounts

### 4. Individual Token Tracking
✅ Each token has unique number (TKN-20260106-0001)
✅ All tokens linked to batch (batchId)
✅ Individual schedules maintained
✅ Can view breakdown if needed

### 5. Automatic Status Management
✅ Batch closed when all schedules paid
✅ Individual tokens also marked closed
✅ Overdue detection
✅ Partial payment tracking

## File Changes

### New Files Created
1. `app/api/token-batches/route.ts` - Batch CRUD operations
2. `app/api/token-batches/[id]/route.ts` - Batch details
3. `app/api/batch-payments/route.ts` - Payment recording

### Modified Files
1. `prisma/schema.prisma` - Added batch tables
2. `app/admin/tokens/create/page.tsx` - Updated to create batches
3. `app/admin/tokens/page.tsx` - Display batches instead of tokens

### Database Tables Added
1. `token_batches` - Main batch table
2. `batch_repayment_schedule` - Batch schedules
3. `batch_payments` - Batch payment records

## Migration from Old System

**For existing tokens:**
- Old individual tokens remain as-is
- New tokens created with quantity > 1 become batches
- Both systems can coexist
- No data loss or migration needed

**Gradual transition:**
1. Admin creates new batches going forward
2. Old tokens continue individual workflow
3. Reports can show both types
4. Eventually all will be batches

## Benefits

### For Admin
- ✅ Cleaner reports (fewer rows)
- ✅ Easier to track large loans
- ✅ Single entity management
- ✅ Better overview of collections

### For Collectors
- ✅ One payment entry instead of N
- ✅ Clear daily collection amount
- ✅ Simplified workflow
- ✅ Less confusion

### For Business
- ✅ Accurate loan tracking
- ✅ Better financial reporting
- ✅ Reduced errors
- ✅ Scalable system

## Testing Checklist

- [ ] Create batch with quantity = 1 (single token)
- [ ] Create batch with quantity = 12 (multiple tokens)
- [ ] Verify batch appears in token list as single row
- [ ] Verify all 12 individual tokens created with batchId
- [ ] Verify batch schedules created correctly
- [ ] Record full payment (₹20.40)
- [ ] Record partial payment (₹15.00)
- [ ] Record payment with penalty waive-off
- [ ] Verify batch closes when fully paid
- [ ] Check individual tokens also marked closed

## Next Steps (Collector Side)

After admin implementation is finalized:
1. Update collector token creation to use batches
2. Update collector payment UI for batch payments
3. Update collector dashboard to show batches
4. Test complete collector workflow

---

**Implementation Date:** 2026-01-06
**Status:** Admin side complete, ready for testing
**Next:** Collector side implementation after testing
