-- =====================================================
-- FIX INTERNET CONNECTION TYPES DATA
-- =====================================================
-- Fix the "undefined" names in internet_connection_types

-- Update all "undefined" names to proper values based on type and speed
UPDATE internet_connection_types 
SET name = CASE 
  WHEN type = 'Modem' AND speed LIKE '%100%' THEN type || ' - ' || speed
  WHEN type = 'Modem' AND speed LIKE '%120%' THEN type || ' - ' || speed  
  WHEN type = 'Modem' AND speed LIKE '%80%' THEN type || ' - ' || speed
  WHEN type = 'Fiber' AND speed LIKE '%100%' THEN type || ' - ' || speed
  WHEN type = 'Fiber' AND speed LIKE '%300%' THEN type || ' - ' || speed
  WHEN type = '4G' AND speed LIKE '%50%' THEN type || ' - ' || speed
  WHEN type = '4G' AND speed LIKE '%75%' THEN type || ' - ' || speed
  WHEN type = 'ADSL' AND speed LIKE '%20%' THEN type || ' - ' || speed
  ELSE type || ' Connection'
END
WHERE name = 'undefined' OR name IS NULL;

-- Verify the fix
SELECT id, name, type, speed FROM internet_connection_types ORDER BY type, speed;