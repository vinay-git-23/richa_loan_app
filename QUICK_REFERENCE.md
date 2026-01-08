# Finance Management System - Quick Reference Guide

## 🚀 What's New

### Multi-Token Customer Management
- ✅ Customers can now have **unlimited tokens** simultaneously
- ✅ Each token tracked independently with separate schedules
- ✅ Consolidated customer summary across all tokens

### Multi-Token Payment Collection
- ✅ Collect payment for **multiple tokens at once**
- ✅ Single payment distributed across multiple tokens automatically
- ✅ Granular tracking with `PaymentAllocation` table

### Collector Token Generation
- ✅ Collectors can now **create tokens directly**
- ✅ Same validation and calculation as admin-created tokens
- ✅ Tracked with `createdBy` field for audit purposes

### Admin Bulk Token Generation (NEW!)
- ✅ Admin can create **multiple tokens in single entry**
- ✅ Up to 10 tokens at once for same customer
- ✅ Quick presets for common loan configurations
- ✅ Live calculation preview for each token
- ✅ Duplicate and copy token configurations easily

---

## 📋 Login Credentials

### Collector Login
- **Mobile**: `8819906200`
- **Password**: `1234567890`
- **Collector ID**: v101
- **Name**: vnay

> ⚠️ **Important**: Login uses **mobile number**, NOT collector ID

---

## 🔗 New API Endpoints

### 1. Customer Consolidated Summary
```
GET /api/customers/[id]/summary
```
Returns all tokens with consolidated metrics across all customer tokens.

### 2. Multi-Token Payment
```
POST /api/payments/multi-token
Body: {
  customerId: number,
  tokenAllocations: [{tokenId, amount}],
  paymentMode: 'cash'|'upi'|'bank_transfer',
  remarks?: string,
  photoUrl?: string
}
```

### 3. Collector Token Creation
```
POST /api/collectors/tokens/create
Body: {
  customerId: number,
  loanAmount: number,
  interestType: 'fixed'|'percentage',
  interestValue: number,
  durationDays: number,
  startDate: string (YYYY-MM-DD)
}
```

### 4. Admin Bulk Token Creation (NEW!)
```
POST /api/tokens/bulk-create
Body: {
  customerId: number,
  collectorId: number,
  tokens: [
    {
      loanAmount: number,
      interestType: 'fixed'|'percentage',
      interestValue: number,
      durationDays: number,
      startDate?: string (YYYY-MM-DD)
    }
  ]
}
```

---

## 🎯 New UI Pages

### Collector Pages

#### Create Token Page
**URL**: `/collectors/tokens/create`

**Features**:
- Search and select customer
- Enter loan details
- Live calculation preview
- Auto-assigns to current collector

**Access**: Click "New Token" button on `/collectors/tokens` page

### Admin Pages

#### Bulk Create Tokens Page (NEW!)
**URL**: `/admin/tokens/bulk-create`

**Features**:
- Create up to 10 tokens in single entry
- Search and select customer & collector
- Configure each token individually
- Quick presets (Small/Medium/Large/Standard loans)
- Duplicate token configurations
- Live calculation preview for each token
- Overall summary showing combined totals
- All tokens created in single atomic transaction

**Access**: Click "Bulk Create" button on `/admin/tokens` page

---

## 📊 Database Schema Changes

### New Table: `payment_allocations`
Tracks how multi-token payments are distributed.

### Modified Table: `payments`
- Added `customerId` (nullable)
- Added `isMultiToken` (boolean, default false)
- Added `createdBy` (enum: admin/collector/director)
- Made `tokenId` and `scheduleId` nullable

### Modified Table: `tokens`
- Added `createdBy` (enum: admin/collector/director)

---

## 🔄 How Multi-Token Payment Works

1. **Input**: Customer ID + Token allocations with amounts
2. **Validation**: Verifies all tokens belong to customer
3. **Create Payment**: Single payment record with total amount
4. **Distribute**: Creates allocation records for each token
5. **Apply**: Applies each allocation to schedules sequentially
6. **Update**: Updates schedule and token statuses
7. **Transaction**: All in atomic transaction (rollback on error)

### Example:
```
Customer has 3 tokens:
- Token A: ₹500 due
- Token B: ₹300 due
- Token C: ₹400 due

Collector collects ₹1000 total:
- Allocate ₹500 to Token A → FULLY PAID
- Allocate ₹300 to Token B → FULLY PAID
- Allocate ₹200 to Token C → PARTIALLY PAID
```

---

## ✅ Testing the System

### Test Multi-Token Customer Flow

1. **Login as Collector**: Mobile `8819906200`, Password `1234567890`

2. **Create First Token**:
   - Go to `/collectors/tokens`
   - Click "New Token"
   - Select a customer
   - Loan: ₹10,000 | Interest: 10% | Duration: 100 days
   - Submit

3. **Create Second Token** for same customer:
   - Repeat above with different amount
   - Same customer now has 2 active tokens

4. **View Customer Summary**:
   ```bash
   curl http://localhost:3000/api/customers/[id]/summary \
     -H "Cookie: next-auth.session-token=..."
   ```

5. **Record Multi-Token Payment**:
   ```bash
   curl -X POST http://localhost:3000/api/payments/multi-token \
     -H "Content-Type: application/json" \
     -d '{
       "customerId": 1,
       "tokenAllocations": [
         {"tokenId": 1, "amount": 500},
         {"tokenId": 2, "amount": 300}
       ],
       "paymentMode": "cash"
     }'
   ```

---

## 🔐 Authorization Matrix

| Action | Admin | Director | Collector |
|--------|-------|----------|-----------|
| Create Token (Admin) | ✅ | ❌ | ❌ |
| Create Token (Collector) | ❌ | ❌ | ✅ |
| View Customer Summary | ✅ | ✅ | ✅ |
| Multi-Token Payment | ✅ (all) | ✅ (view) | ✅ (own) |
| View All Payments | ✅ | ✅ | ❌ |

---

## 🐛 Troubleshooting

### "Invalid tokens or tokens not assigned to you"
- **Cause**: Collector trying to collect on unassigned tokens
- **Solution**: Verify token `collectorId` matches current collector

### "Customer not found or inactive"
- **Cause**: Customer is deactivated or doesn't exist
- **Solution**: Check customer `isActive` status

### "Failed to record multi-token payment"
- **Cause**: Transaction error or validation failure
- **Solution**: Check console logs for specific error, verify all token IDs are valid

### Login not working with ID v101
- **Cause**: Login expects mobile number, not collector ID
- **Solution**: Use mobile number `8819906200` instead

---

## 📈 Next Steps (Future Enhancements)

### UI Development Needed
1. **Multi-Token Payment UI** (Priority: HIGH)
   - Customer selection
   - Display all customer tokens
   - Allocation interface
   - Visual feedback

2. **Enhanced Customer Profile** (Priority: MEDIUM)
   - Use new summary API
   - Visual charts and graphs
   - Consolidated payment history

3. **Admin Multi-Token Payment** (Priority: MEDIUM)
   - Similar to collector but with collector selection

### Feature Enhancements
1. Smart payment allocation (auto-prioritize overdue)
2. Payment reversal/refund functionality
3. Token consolidation/merging
4. Customer payment portal
5. Advanced analytics dashboard

---

## 📁 Key Files Reference

### API Routes
- `app/api/customers/[id]/summary/route.ts` - Customer summary
- `app/api/payments/multi-token/route.ts` - Multi-token payments
- `app/api/collectors/tokens/create/route.ts` - Collector token creation
- `app/api/tokens/route.ts` - Admin token creation (updated)

### UI Pages
- `app/collectors/tokens/create/page.tsx` - Collector token creation
- `app/collectors/tokens/page.tsx` - Token list (updated)

### Schema
- `prisma/schema.prisma` - Database schema

### Documentation
- `SYSTEM_UPDATES.md` - Comprehensive system documentation
- `QUICK_REFERENCE.md` - This file

---

## 🎓 Usage Examples

### Creating a Token (Collector)
1. Navigate to `/collectors/tokens`
2. Click "New Token" button
3. Search and select customer
4. Fill loan details
5. Review calculation preview
6. Click "Create Token"

### Viewing Customer Summary
```javascript
const response = await fetch('/api/customers/1/summary')
const { data } = await response.json()

console.log(data.consolidatedSummary.totalOutstanding) // Total across all tokens
console.log(data.tokens.length) // Number of tokens
```

### Recording Multi-Token Payment
```javascript
const payment = {
  customerId: 1,
  tokenAllocations: [
    { tokenId: 1, amount: 500 },
    { tokenId: 2, amount: 300 }
  ],
  paymentMode: 'cash',
  remarks: 'Collected at home'
}

const response = await fetch('/api/payments/multi-token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payment)
})
```

---

## 📞 Support

For issues or questions:
1. Check `SYSTEM_UPDATES.md` for detailed documentation
2. Review API error messages in console
3. Verify database schema is up to date: `npx prisma db push`
4. Regenerate Prisma client: `npx prisma generate`

---

**System Version**: 2.0
**Last Updated**: 2026-01-06
**Status**: ✅ Production Ready (UI pending for multi-token payments)
