# Fixing API Key 403 Error

## Problem
Row-Level Security (RLS) policies are blocking INSERT, UPDATE, and DELETE operations on the `api_keys` table. The existing policies only allow SELECT operations.

## Solution
Run the following SQL in your Supabase SQL Editor:

```sql
-- Policy: Users can insert their own tenant's API keys
CREATE POLICY "Users can insert their tenant's API keys"
    ON api_keys
    FOR INSERT
    WITH CHECK (
        tenant_id = auth.uid()::text
        OR 
        tenant_id = (current_setting('request.jwt.claims', true)::json->>'tenant_id')
    );

-- Policy: Users can update their tenant's API keys
CREATE POLICY "Users can update their tenant's API keys"
    ON api_keys
    FOR UPDATE
    USING (
        tenant_id = auth.uid()::text
        OR 
        tenant_id = (current_setting('request.jwt.claims', true)::json->>'tenant_id')
    );

-- Policy: Users can delete their tenant's API keys
CREATE POLICY "Users can delete their tenant's API keys"
    ON api_keys
    FOR DELETE
    USING (
        tenant_id = auth.uid()::text
        OR 
        tenant_id = (current_setting('request.jwt.claims', true)::json->>'tenant_id')
    );
```

## Steps to Fix

1. Open your Supabase Dashboard
2. Go to the SQL Editor
3. Copy and paste the SQL above
4. Run the query
5. Refresh the API Keys page and try creating a key again

## What This Does

These RLS policies allow authenticated users to:
- **INSERT**: Create API keys for their own tenant
- **UPDATE**: Update API keys belonging to their tenant
- **DELETE**: Delete API keys belonging to their tenant

The policies use `auth.uid()::text` which matches the user's ID with the `tenant_id` column.

## Alternative: Temporary Fix (Not Recommended for Production)

If you want to temporarily disable RLS for testing (NOT recommended for production):

```sql
ALTER TABLE api_keys DISABLE ROW LEVEL SECURITY;
```

But you should enable it back with proper policies:

```sql
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
-- Then add the policies above
```

## File Location
The migration SQL is saved at: `twyn-backend/migrations/003_api_keys_rls_policies.sql`

