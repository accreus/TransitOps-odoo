# 🔧 QUICK FIX: RLS Policy Issue

**Problem**: Demo data seeding fails with "row-level security policy" error
**Cause**: Need to apply schema and create admin user first
**Time to Fix**: 5 minutes

---

## ⚡ **IMMEDIATE SOLUTION**

### **Step 1: Apply Schema in Supabase Dashboard** (3 minutes)

1. **Go to**: https://supabase.com/dashboard/project/howccngzkmxxtbdbdoef
2. **Click**: "SQL Editor" (left sidebar)
3. **Apply these 3 files in order**:

**First - Main Schema:**
```sql
-- Copy entire contents of schema.sql and run
```

**Second - Security Policies:**
```sql
-- Copy entire contents of rls-policies.sql and run
```

**Third - Storage Setup:**
```sql
-- Copy entire contents of storage-setup.sql and run
```

### **Step 2: Create Admin User** (2 minutes)

**Option A - Via SQL (Recommended):**
1. In SQL Editor, run:
```sql
-- Create auth user first in Auth dashboard, then:
SELECT create_admin_user('admin@transitops.com', 'Fleet Manager');
```

**Option B - Via Auth Dashboard:**
1. Go to "Authentication" > "Users"
2. Click "Add user"
3. Email: `admin@transitops.com`
4. Password: `TransitOps2026!`
5. Click "Create user"
6. Then run SQL: `SELECT create_admin_user('admin@transitops.com', 'Fleet Manager');`

### **Step 3: Run Setup** (30 seconds)
```bash
npm run setup-complete
```

---

## 🚨 **CURRENT STATUS**

✅ **All code is ready** - Complete 8-hour foundation implemented
⚠️ **Schema needs deployment** - 5 minutes to apply
🚀 **Then immediately ready** - K and Uncle can start building

---

## 🎯 **After Fix Complete**

**K and Uncle can use:**
```typescript
// Available immediately after schema deployment
import { TransitOpsAPI } from '@/lib/integration'

// Uncle - Dispatch system
const resources = await TransitOpsAPI.dispatch.getAvailableResources()
await TransitOpsAPI.dispatch.createAndDispatchTrip(tripData)

// K - Fleet management
await TransitOpsAPI.fleet.addVehicle(vehicleData)
await TransitOpsAPI.fleet.scheduleMaintenance(vehicleId, desc, cost)
```

**The foundation is complete - just needs the 3 SQL files applied!** 🚀