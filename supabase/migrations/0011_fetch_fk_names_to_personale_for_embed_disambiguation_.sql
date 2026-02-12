SELECT
  conname,
  conrelid::regclass AS table_name,
  a.attname AS column_name,
  confrelid::regclass AS foreign_table_name
FROM pg_constraint c
JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY (c.conkey)
WHERE c.contype = 'f'
  AND c.conrelid = 'public.allarme_entries'::regclass
ORDER BY conname;