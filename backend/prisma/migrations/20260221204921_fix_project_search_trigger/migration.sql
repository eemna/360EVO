-- This is an empty migration.
-- Drop old trigger safely
DROP TRIGGER IF EXISTS project_search_update ON "Project";

-- Drop old function safely
DROP FUNCTION IF EXISTS project_search_trigger();

