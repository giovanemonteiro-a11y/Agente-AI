-- Convert stakeholders from TEXT[] to JSONB for richer structure
-- New format: [{"name": "João Silva", "role": "decisor"}, {"name": "Maria", "role": "influenciador"}]

-- Step 1: Add temporary JSONB column
ALTER TABLE handoffs ADD COLUMN stakeholders_new JSONB DEFAULT '[]'::jsonb;

-- Step 2: Migrate data — convert TEXT[] elements to JSONB objects
UPDATE handoffs SET stakeholders_new = (
  SELECT COALESCE(jsonb_agg(jsonb_build_object('name', elem, 'role', 'decisor')), '[]'::jsonb)
  FROM unnest(stakeholders) AS elem
) WHERE stakeholders IS NOT NULL AND array_length(stakeholders, 1) > 0;

-- Step 3: Drop old column and rename
ALTER TABLE handoffs DROP COLUMN stakeholders;
ALTER TABLE handoffs RENAME COLUMN stakeholders_new TO stakeholders;
