-- ============================================
-- pgAdmin Queries to View Tables
-- ============================================

-- 1. List all tables in the database
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. Check if required tables exist
SELECT 
  table_name,
  CASE 
    WHEN table_name IN ('User', 'Tenant', 'Branch', 'Role', 'Permission', 'RolePermission') 
    THEN '✅ Required'
    ELSE '📋 Additional'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY 
  CASE 
    WHEN table_name IN ('User', 'Tenant', 'Branch', 'Role', 'Permission', 'RolePermission') 
    THEN 0 
    ELSE 1 
  END,
  table_name;

-- 3. Count tables
SELECT COUNT(*) as total_tables
FROM information_schema.tables 
WHERE table_schema = 'public';

-- 4. List tables with column counts
SELECT 
  t.table_name,
  (SELECT COUNT(*) 
   FROM information_schema.columns c
   WHERE c.table_schema = 'public' 
     AND c.table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE t.table_schema = 'public'
ORDER BY t.table_name;

-- 5. Check specific table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
    AND table_name = 'User'
) as user_table_exists;

-- 6. Get table details
SELECT 
  table_name,
  table_type,
  is_insertable_into
FROM information_schema.tables 
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 7. View User table structure (if exists)
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'User'
ORDER BY ordinal_position;





