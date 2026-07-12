# TransitOps — Uncle's Build Plan (Operations, Money & Insights)

## Your Scope
You own the most **business-rule-heavy** part of the app: Drivers, Trips, Fuel/Expenses, and Reports. You depend on Puff's schema (Hour 0–1) being pushed before you can build against real tables — until then, coordinate on the agreed data shapes so you're not blocked.

## 1. Driver Management Logic (Hour 1–2.5)
- CRUD functions for drivers
- Enforce: drivers with expired licenses or "Suspended" status are excluded from any "available for trip assignment" query
- Safety Score field — simple numeric field, no complex calculation needed for the hackathon scope

## 2. Trip Management Logic (Hour 2.5–4.5) — the core of your work
- Create trip: source, destination, vehicle (from Puff's available-vehicle pool), driver (from your available-driver pool), cargo weight, planned distance
- **Validation:** cargo weight must not exceed the selected vehicle's max load capacity
- **Validation:** vehicle and driver must not already be "On Trip"
- Trip lifecycle logic:
  - **Dispatch** → vehicle & driver status both become "On Trip"
  - **Complete** → vehicle & driver status both return to "Available"; **capture Revenue** at this step (actual amount, not planned)
  - **Cancel** (post-dispatch) → vehicle & driver status both return to "Available"
- All validation must be enforced **server-side**, not just in K's UI

## 3. Fuel & Expense Logic (Hour 4.5–5.5)
- Fuel log entries: liters, cost, date, linked to vehicle
- Expense entries: type (toll, etc.), cost, date, linked to vehicle
- Auto-compute total operational cost per vehicle = Fuel + Maintenance (Maintenance cost comes from Puff's Maintenance Logs — coordinate the join/query)

## 4. Reports & Analytics (Hour 5.5–6.5)
- Fuel Efficiency = Distance / Fuel
- Fleet Utilization (%)
- Operational Cost (per vehicle, from step 3)
- Vehicle ROI = (Revenue − (Maintenance + Fuel)) / Acquisition Cost
- CSV export function

## 5. Bonus: Realtime + Email Reminders (Hour 6.5–7.5)
- **Supabase Realtime:** subscribe to status changes (vehicle/driver) so K's screens update live without manual refresh — add this *after* core logic is stable, don't build it in parallel with Trip logic
- **Email reminders:** manual-trigger function that checks for licenses expiring within X days, fires email via Resend/Supabase email on Safety Officer dashboard load (no scheduled cron — keep it simple and demo-safe)

## Suggested Order (8-Hour Build)
| Time | Focus |
|---|---|
| Hour 0–1 | Review Puff's schema as it's pushed; agree on data shapes with K in the meantime |
| Hour 1–2.5 | Driver Management CRUD + status/license filtering |
| Hour 2.5–4.5 | **Trip Management** — creation, validation, dispatch/complete/cancel status automation, Revenue capture |
| Hour 4.5–5.5 | Fuel & Expense logging + operational cost computation |
| Hour 5.5–6.5 | Reports & Analytics calculations + CSV export |
| Hour 6.5–7.5 | Realtime subscriptions + email reminder trigger (bonus) |
| Hour 7.5–8 | Full walkthrough, fix bugs, rehearse demo |

## Watch Out For
- Trip logic is the most rule-dense part of the whole app — budget the most time here and don't rush it, since a broken validation (e.g., overweight cargo getting through) is the kind of bug a judge will notice immediately.
- Revenue is captured at **completion**, not creation — make sure the Complete-trip form/function includes this field.
- Coordinate with Puff on the "available vehicle" and "available driver" query logic so you're not duplicating (or contradicting) filtering rules already enforced on their side.
