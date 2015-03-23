-- Unfortunately, `... DEFAULT MAX(view_order) + 1` is not allowed
ALTER TABLE sentences ADD COLUMN view_order INTEGER DEFAULT 0 NOT NULL;
