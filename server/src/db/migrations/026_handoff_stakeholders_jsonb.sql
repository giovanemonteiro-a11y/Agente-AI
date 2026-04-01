-- Convert stakeholders from TEXT[] to JSONB for richer structure
-- New format: [{"name": "João Silva", "role": "decisor"}, {"name": "Maria", "role": "influenciador"}]

ALTER TABLE handoffs
  ALTER COLUMN stakeholders DROP DEFAULT,
  ALTER COLUMN stakeholders TYPE JSONB USING
    CASE
      WHEN stakeholders IS NULL THEN '[]'::jsonb
      WHEN array_length(stakeholders, 1) IS NULL THEN '[]'::jsonb
      ELSE (
        SELECT jsonb_agg(jsonb_build_object('name', elem, 'role', 'decisor'))
        FROM unnest(stakeholders) AS elem
      )
    END,
  ALTER COLUMN stakeholders SET DEFAULT '[]'::jsonb;
