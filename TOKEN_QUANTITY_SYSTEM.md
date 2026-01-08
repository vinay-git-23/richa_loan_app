# Token Quantity System - Implementation Guide

## ✅ Correct Implementation (Now Active)

### **Concept**: Quantity-Based Token Generation

When creating a token, you specify a **quantity** field. The system will create **N identical tokens** with:
- Same loan amount
- Same duration
- Same interest
- Same customer & collector
- **Different token numbers** (sequential)

---

## 🎯 How It Works

### Example:
**Input**:
- Customer: John Doe
- Loan Amount: ₹10,000
- Duration: 100 days
- Interest: 10%
- **Quantity: 5**

**Output**: 5 separate tokens created:
```
TKN-20260106-0001 | ₹11,000 | John Doe | 100 days
TKN-20260106-0002 | ₹11,000 | John Doe | 100 days
TKN-20260106-0003 | ₹11,000 | John Doe | 100 days
TKN-20260106-0004 | ₹11,000 | John Doe | 100 days
TKN-20260106-0005 | ₹11,000 | John Doe | 100 days
```

**Collection**: Each token collected separately/independently

---

## 📝 Features

### 1. **Admin Token Creation**
**Page**: `/admin/tokens/create`

**New Field**: "Quantity (Same Token)"
- Min: 1
- Max: 50
- Default: 1

**Preview Shows**:
- Quantity: X Tokens
- Amount (Each): ₹Y
- **Combined Total**: ₹X × Y
- Daily Payment (Each): ₹Z
- End Date

### 2. **Collector Token Creation**
**Page**: `/collectors/tokens/create`

**Same quantity field with preview**

### 3. **API Changes**

#### Admin API: `POST /api/tokens`
**New Parameter**: `quantity` (optional, default 1)

```json
{
  "customerId": 1,
  "collectorId": 2,
  "loanAmount": 10000,
  "interestType": "percentage",
  "interestValue": 10,
  "durationDays": 100,
  "startDate": "2026-01-06",
  "quantity": 5
}
```

**Response**:
```json
{
  "success": true,
  "message": "5 token(s) created successfully",
  "data": [/* array of 5 token objects */],
  "count": 5
}
```

#### Collector API: `POST /api/collectors/tokens/create`
**Same structure with quantity support**

---

## 🔄 Collection Process

### Token-Wise Collection (Unchanged)

Collection remains **token-by-token**:

1. Collector selects **one token** at a time
2. Collects payment for that specific token
3. Payment applied to that token's schedules
4. Process repeated for other tokens

**Existing flow works as-is** - no changes needed to payment system!

---

## 💡 Use Cases

### Use Case 1: Multiple Same Loans
Customer needs 3 identical loans:
- Set quantity = 3
- Submit once
- 3 tokens created instantly

### Use Case 2: Bulk Token Issuance
Distributing 10 same tokens:
- Set quantity = 10
- All 10 created in single transaction
- Each token independent

### Use Case 3: Quick Setup
Instead of creating same token 5 times:
- Create once with quantity = 5
- Saves time and effort

---

## 🎨 UI Updates

### Admin Token Create Page
```
┌─────────────────────────────────────┐
│ Loan Details                        │
│ ├─ Loan Amount: ₹10,000            │
│ ├─ Duration: 100 days              │
│ ├─ Interest: 10%                   │
│ ├─ Start Date: 2026-01-06          │
│ └─ Quantity: [5] (max 50)          │ ← NEW
└─────────────────────────────────────┘

Preview:
┌─────────────────────────────────────┐
│ Quantity: 5 Tokens                  │ ← NEW
│ Combined Total: ₹55,000             │ ← NEW
│ Daily Payment (Each): ₹110          │
│ End Date: 16 Apr 2026               │
└─────────────────────────────────────┘
```

### Collector Token Create Page
Same layout with quantity field and preview

---

## 🔧 Technical Details

### Sequential Token Numbers
Tokens created with sequential numbers:
```javascript
// If last token today was TKN-20260106-0010
// And quantity = 3
// New tokens:
TKN-20260106-0011
TKN-20260106-0012
TKN-20260106-0013
```

### Atomic Transaction
All tokens created in **single database transaction**:
- All succeed or all fail
- No partial creation
- Data consistency guaranteed

### Validation
- Quantity: 1-50 range
- All other validations same as before
- Customer/Collector must be active

---

## ❌ What This is NOT

### NOT a "Bundle" System
- Tokens are **NOT grouped**
- No "bundle ID" or "batch ID"
- Each token completely independent

### NOT Combined Collection
- Collection is **still token-by-token**
- No "pay for all 5 at once" feature
- Use existing multi-token payment API for that

### NOT Different Configurations
- All tokens in quantity have **same details**
- Cannot set different amounts per token
- For different configs, create separately

---

## 📊 Comparison

| Feature | Old (1-by-1) | New (Quantity) |
|---------|--------------|----------------|
| Create 5 tokens | 5 form submissions | 1 submission |
| Time taken | ~5 minutes | ~30 seconds |
| Token numbers | Manual sequence | Auto sequential |
| Error risk | Higher | Lower |
| Transaction | 5 separate | 1 atomic |

---

## 🚀 Benefits

1. **Time Saving**: Create multiple identical tokens instantly
2. **Error Reduction**: One submission = less chance of mistakes
3. **Atomic Safety**: All-or-nothing creation
4. **Sequential Numbers**: Auto-generated, no gaps
5. **Consistent Data**: All tokens identical (except token number)

---

## 🎯 Key Points

✅ Quantity field added to both admin and collector token creation
✅ Maximum 50 tokens per submission
✅ Each token gets unique sequential number
✅ All tokens created in single atomic transaction
✅ **Collection remains token-wise** (no change to existing payment flow)
✅ Preview shows combined total for all tokens
✅ Works on both admin and collector sides

---

## 📖 Related Features

- **Multi-Token Payment**: Use `/api/payments/multi-token` for collecting across different tokens
- **Customer Summary**: Use `/api/customers/[id]/summary` for consolidated view of all tokens
- **Token-Wise Collection**: Existing `/collectors/payment` page works as-is

---

**System Version**: 2.1
**Last Updated**: 2026-01-06
**Status**: ✅ Production Ready
