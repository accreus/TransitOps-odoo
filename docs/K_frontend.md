# TransitOps — K's Build Plan (UI & Frontend)

## Your Scope
You own **every screen** in the app. Puff and Uncle handle all database, auth, and business logic — you consume their APIs/functions, but your work should never require touching the database directly.

## Screens You're Building
1. **Login screen** — email/password, role-aware redirect after login
2. **Dashboard** — KPI cards (Active/Available/In-Maintenance Vehicles, Active/Pending Trips, Drivers On Duty, Fleet Utilization %), filters by vehicle type/status/region, charts, "Licenses Expiring Soon" panel (Safety Officer view)
3. **Vehicle Registry** — list + create/edit form (Registration Number, Model, Type, Max Load, Odometer, Acquisition Cost, Status badge)
4. **Driver Management** — list + create/edit form (Name, License Number/Category/Expiry, Contact, Safety Score, Status badge)
5. **Trip Management** — create trip flow (source, destination, vehicle picker, driver picker, cargo weight, distance), trip list with status (Draft/Dispatched/Completed/Cancelled), dispatch/complete/cancel actions
6. **Maintenance** — create maintenance record form, maintenance log list per vehicle
7. **Fuel & Expenses** — log entry forms (fuel: liters/cost/date; expenses: type/cost/date), per-vehicle cost summary
8. **Reports & Analytics** — Fuel Efficiency, Fleet Utilization, Operational Cost, Vehicle ROI views, CSV export button

## Cross-Cutting UI Work (yours alone)
- **Dark mode** — first-class theme toggle, applied consistently across all screens (build this in from the start, not bolted on at the end)
- **Search, filter, sort** — reusable components used across Vehicles/Drivers/Trips lists
- **Charts** — Dashboard and Reports (recommend Recharts for speed)
- **Role-based navigation** — nav/menu shows only sections relevant to the logged-in role
- **Status badges** — consistent colored badge component for vehicle/driver/trip status, used everywhere

## How to Work Without Blocking
1. **Hour 0–1:** Agree with Puff & Uncle on the exact shape (fields + types) of each entity: Vehicle, Driver, Trip, Maintenance Log, Fuel Log, Expense, Document. Get this in writing (even a shared doc/Slack message) before building.
2. **Hour 1 onward:** Build every screen against **mock/dummy data** matching that agreed shape. Don't wait on Puff/Uncle's actual functions.
3. **As Puff/Uncle finish each module:** Swap your mock data calls for their real functions — this should be a small, mechanical change, not a rebuild, if the shape was agreed correctly upfront.
4. **UI-only validation** (disabling invalid options, showing warnings) is for user experience — don't rely on it as your only safeguard. Puff/Uncle will double-enforce rules server-side.

## Suggested Order (8-Hour Build)
| Time | Focus |
|---|---|
| Hour 0–1 | Agree on data shapes with Puff/Uncle, set up Next.js + Tailwind + dark mode theme skeleton, build login screen |
| Hour 1–3 | Vehicle Registry + Driver Management screens (mock data) |
| Hour 3–5 | Trip Management + Maintenance screens (mock data); start swapping in real data as it becomes available |
| Hour 5–6 | Fuel & Expenses + Dashboard KPI cards; wire in real data |
| Hour 6–7.5 | Reports & Analytics + charts; polish dark mode, search/filters, status badges everywhere |
| Hour 7.5–8 | Full walkthrough, fix visual bugs, rehearse demo |

## Watch Out For
- Don't let dark mode be an afterthought — retrofitting it late across many screens burns time. Build the theme system first, then build every screen inside it.
- Keep the data shape you agreed on at Hour 0 close at hand — if it changes mid-build, tell Puff/Uncle immediately so nobody drifts out of sync.
