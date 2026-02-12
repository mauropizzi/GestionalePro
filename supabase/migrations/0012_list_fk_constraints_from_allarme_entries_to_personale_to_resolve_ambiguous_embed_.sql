SELECT
  c.conname,
  a.attname AS column_name,
  c.confrelid::regclass AS foreign_table
FROM pg_constraint c
JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY (c.conkey)
WHERE c.contype = 'f'
  AND c.conrelid = 'public.allarme_entries'::regclass
  AND c.confrelid = 'public.personale'::regclass
ORDER BY c.conname;