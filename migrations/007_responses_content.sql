ALTER TABLE responses ADD COLUMN content TEXT;
UPDATE responses SET content = ''::TEXT;
ALTER TABLE responses ALTER COLUMN content SET NOT NULL;
