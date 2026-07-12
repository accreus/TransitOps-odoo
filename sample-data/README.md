# Sample Data for TransitOps

Import these CSVs into Supabase **in this order** (due to foreign key dependencies):

## Import Order

### 1. Vehicles
File: `vehicles.csv`
- Table: `vehicles`
- No dependencies

### 2. Drivers
File: `drivers.csv`
- Table: `drivers`
- No dependencies

### 3. Trips
File: `trips.csv`
- Table: `trips`
- **Before importing:** Replace `vehicle_id` and `driver_id` values with actual UUIDs from your vehicles and drivers tables
- Run this query in SQL Editor to get IDs:
  ```sql
  SELECT id, registration_number FROM vehicles;
  SELECT id, name FROM drivers;
  ```

### 4. Fuel Logs
File: `fuel_logs.csv`
- Table: `fuel_logs`
- **Before importing:** Replace `vehicle_id` values with actual UUIDs
- `trip_id` can be left empty (NULL)

### 5. Maintenance Logs
File: `maintenance_logs.csv`
- Table: `maintenance_logs`
- **Before importing:** Replace `vehicle_id` values with actual UUIDs
- Remove the duplicate `date` column (CSV has it twice — use the first one)

### 6. Expenses
File: `expenses.csv`
- Table: `expenses`
- **Before importing:** Replace `vehicle_id` values with actual UUIDs
- `trip_id` can be left empty (NULL)

## How to Import in Supabase Dashboard

1. Go to **Table Editor** (left sidebar)
2. Select the target table
3. Click **Insert** → **Import from CSV**
4. Upload the CSV file
5. Map columns and confirm

## Alternative: SQL COPY

If CSV import doesn't work, you can use the SQL Editor:

```sql
-- After importing vehicles, get a vehicle ID for reference:
SELECT id FROM vehicles LIMIT 1;
```

Then manually insert with the correct UUIDs.
