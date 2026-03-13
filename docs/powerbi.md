# Connecting Power BI Web to FabLab PostgreSQL

Power BI web (app.powerbi.com) requires a **publicly accessible** database.
The local Docker PostgreSQL is not reachable from the internet, so we use a
free Supabase cloud database.

---

## Step 1 — Create a Free Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in (free tier is sufficient)
2. Click **New project** → choose a region near you → set a database password
3. Wait ~2 minutes for provisioning
4. Go to **Settings → Database** and copy the **Connection string (URI)**
   - It looks like: `postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres`

---

## Step 2 — Configure the ETL Pipeline

Add the connection string to your `.env`:

```env
CLOUD_DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres
```

---

## Step 3 — Run the ETL Pipeline Against Supabase

The Prisma schema must first be applied to the Supabase database:

```bash
# Apply schema to Supabase
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres" \
  npx prisma migrate deploy --schema backend/prisma/schema.prisma

# Load data into Supabase
python etl/run_pipeline.py --seed --cloud
```

Verify data loaded: check the Supabase **Table Editor** in your project dashboard.

---

## Step 4 — Connect Power BI Web

1. Sign in at [app.powerbi.com](https://app.powerbi.com)
2. Click **Create** → **Semantic model** (or use the old **Get Data** flow)
3. Select **PostgreSQL database**
4. Enter connection details:
   - **Server**: `db.[YOUR-PROJECT-REF].supabase.co:5432`
   - **Database**: `postgres`
   - **Authentication**: Database — Username: `postgres`, Password: your Supabase DB password
5. Select these tables to import:
   - `enrollments`
   - `students`
   - `classes`
   - `staff`
   - `material_usage`

---

## Step 5 — Build the Report (3 Pages)

### Page 1: Enrollment Overview
- **Card** visual: Total registrations (`COUNT(enrollments[id])`)
- **Card** visual: Active classes (`COUNTROWS(FILTER(classes, classes[status] = "active"))`)
- **Clustered bar chart**: Registrations per class — X axis: `classes[name]`, Y axis: count of enrollments
- **Line chart**: Registrations over time — X: `enrollments[registrationDate]` (date hierarchy), Y: count
- **Table**: Recent registrations — columns: student name, class name, status, registrationDate

### Page 2: Material Usage
- **Card** visual: Total material records
- **Card** visual: Estimated cost — create a measure:
  ```DAX
  Estimated Cost =
  SUMX(
    material_usage,
    material_usage[quantityUsed] *
    SWITCH(material_usage[materialName],
      "PLA Filament", 0.05,
      "Resin", 0.08,
      "Acrylic Sheets", 3.00,
      "Plywood Sheets", 2.50,
      "Drone Batteries", 12.00,
      "Chocolate", 0.02,
      "Slime Glue", 0.02,
      "Slime Activator", 0.03,
      0
    )
  )
  ```
- **Stacked bar chart**: Usage by class — X: class name, Y: sum of quantityUsed
- **Donut chart**: Material distribution — Legend: materialName, Values: sum of quantityUsed

### Page 3: Data Quality
- **Card** visuals: confirmed / incomplete / cancelled counts
- **Table**: Incomplete registrations — filter where `enrollments[status] = "incomplete"`

---

## Step 6 — Publish & Share

1. Click **Publish** in Power BI → choose a workspace
2. Share the workspace link by adding it to your project README
3. (Optional) Set up a **scheduled refresh** to re-run the ETL pipeline and push updates

---

## Keeping Data Fresh

To refresh the cloud database manually:

```bash
python etl/run_pipeline.py --cloud
```

For automated refreshes, consider scheduling with a cron job or GitHub Actions.
