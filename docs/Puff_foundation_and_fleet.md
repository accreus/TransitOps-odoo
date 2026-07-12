# TransitOps — Puff's Build Plan (Foundation, Fleet & Storage)

## Your Scope
You own the **shared foundation** everyone else builds on, plus the Fleet side of the business (Vehicles + Maintenance) and file storage. Your Hour-0 schema push is the single most time-critical task on the team — K and Uncle are both waiting on it.

## 1. Database Schema (push this FIRST — Hour 0–1)
Design and push the **full schema** in Supabase, even for tables you're not personally building features on (Uncle needs Trip/Fuel/Expense tables to exist immediately):

- **Users** — role field (Fleet Manager / Driver / Safety Officer / Financial Analyst)
- **Vehicles** — Registration Number (unique), Model, Type, Max Load Capacity, Odometer, Acquisition Cost, Status (Available / On Trip / In Shop / Retired)
- **Drivers** — Name, License Number/Category/Expiry, Contact, Safety Score, Status (Available / On Trip / Off Duty / Suspended)
- **Trips** — Source, Destination, Vehicle (FK), Driver (FK), Cargo Weight, Planned Distance, Status (Draft/Dispatched/Completed/Cancelled), Revenue (nullable until completion)
- **Maintenance Logs** — Vehicle (FK), description, date, cost, open/closed state
- **Fuel Logs** — Vehicle (FK), liters, cost, date
- **Expenses** — Vehicle (FK), type, cost, date
- **Documents** — polymorphic ref to Vehicle or Driver, file path, type

**As soon as this is pushed, message K and Uncle immediately** — this unblocks their real (non-mock) work.

## 2. Auth & RBAC (Hour 1–2)
- Set up Supabase Auth (email/password)
- Define the 4 roles and their permissions
- Implement Row Level Security (RLS) policies so access rules are enforced at the database level — not just hidden in the UI
- Build/wire the login flow's backend piece (K builds the login screen; you provide the auth logic it calls)

## 3. Vehicle Registry Logic (Hour 2–3.5)
- CRUD functions for vehicles
- Enforce: registration number uniqueness
- Enforce: Retired/In Shop vehicles excluded from any "available for dispatch" query — this is critical since Uncle's Trip logic depends on it

## 4. Maintenance Logic (Hour 3.5–4.5)
- Create maintenance record → automatically sets vehicle status to "In Shop"
- Close maintenance record → automatically restores vehicle to "Available" (unless Retired)
- Make sure vehicles "In Shop" are excluded from dispatch pools (same rule as above, now driven by maintenance too)

## 5. Document Storage (Hour 5–6, bonus feature)
- Set up Supabase Storage bucket(s) for vehicle/driver documents
- Simple upload/attach/view function, scoped by RLS to match role permissions
- No versioning or approval workflows needed — keep it simple

## Suggested Order (8-Hour Build)
| Time | Focus |
|---|---|
| Hour 0–1 | **Full schema design + push** (top priority — unblocks the whole team) |
| Hour 1–2 | Auth + RBAC + RLS policies |
| Hour 2–3.5 | Vehicle Registry CRUD + uniqueness + dispatch-pool filtering |
| Hour 3.5–4.5 | Maintenance logic + status automation |
| Hour 4.5–5 | Buffer / help Uncle if Trip logic needs Vehicle-side support |
| Hour 5–6 | Document upload/storage (bonus) |
| Hour 6–7.5 | Support K wiring real data into Vehicle/Maintenance/Document screens; polish |
| Hour 7.5–8 | Full walkthrough, fix bugs, rehearse demo |

## Watch Out For
- The schema is a **contract** — once K and Uncle start building against it, changes get expensive. Get it right (or close) in Hour 0, not perfect, but stable.
- Double-check that "In Shop" and "Retired" vehicles are filtered out **server-side**, not just hidden in K's UI — this is a mandatory business rule, not a nice-to-have.
