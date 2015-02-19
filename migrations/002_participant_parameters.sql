ALTER TABLE participants ADD COLUMN parameters JSON;
UPDATE participants SET parameters = '{}'::JSON;
ALTER TABLE participants ALTER COLUMN parameters SET NOT NULL;
