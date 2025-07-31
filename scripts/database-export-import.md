# 🗄️ DATABASE EXPORT/IMPORT GUIDE

## Step 1: Get Database Passwords

### PROD Database Password:
1. Go to: https://supabase.com/dashboard/project/mhngbluefyucoesgcjoy
2. Navigate to: Settings → Database
3. Look for "Database password" or "Connection pooling"
4. Copy the password

### TEST Database Password:
1. Go to: https://supabase.com/dashboard/project/sxphlwvjxzxvbdzriziy
2. Navigate to: Settings → Database  
3. Look for "Database password" or "Connection pooling"
4. Copy the password

## Step 2: Export PROD Database

Replace `[PROD_PASSWORD]` with your actual PROD password:

```bash
pg_dump "postgresql://postgres:[PROD_PASSWORD]@db.mhngbluefyucoesgcjoy.supabase.co:5432/postgres" -f prod_backup.sql
```

## Step 3: Import to TEST Database

Replace `[TEST_PASSWORD]` with your actual TEST password:

```bash
# Optional: Clean TEST database first (recommended)
psql "postgresql://postgres:[TEST_PASSWORD]@db.sxphlwvjxzxvbdzriziy.supabase.co:5432/postgres" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role; GRANT ALL ON SCHEMA public TO postgres, service_role;"

# Import PROD backup to TEST
psql "postgresql://postgres:[TEST_PASSWORD]@db.sxphlwvjxzxvbdzriziy.supabase.co:5432/postgres" -f prod_backup.sql
```

## Step 4: Verify Import

Run the diagnosis script to verify everything worked:

```bash
npx tsx scripts/complete-sync-diagnosis.ts
```

## Alternative: One-Line Commands

Once you have the passwords, you can run these commands directly in PowerShell:

```powershell
# Export (replace [PROD_PASSWORD])
pg_dump "postgresql://postgres:[PROD_PASSWORD]@db.mhngbluefyucoesgcjoy.supabase.co:5432/postgres" -f prod_backup.sql

# Import (replace [TEST_PASSWORD])  
psql "postgresql://postgres:[TEST_PASSWORD]@db.sxphlwvjxzxvbdzriziy.supabase.co:5432/postgres" -f prod_backup.sql
```

## 🎯 Expected Result

After successful import:
- ✅ All 19 tables perfectly synchronized
- ✅ All data relationships preserved
- ✅ Complete schema match between PROD and TEST
- ✅ Zero synchronization issues

## 🔧 Troubleshooting

If you get connection errors:
- Verify the password is correct
- Check that your IP is whitelisted in Supabase (Settings → Database → Network restrictions)
- Ensure you're using the correct project references

If you get permission errors:
- The database user might not have sufficient privileges
- Try using the service role key instead of the database password