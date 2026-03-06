ALTER TABLE events RENAME COLUMN location TO location_name;
ALTER TABLE events ADD COLUMN location_street  TEXT;
ALTER TABLE events ADD COLUMN location_city    TEXT;
ALTER TABLE events ADD COLUMN location_zip     TEXT;
ALTER TABLE events ADD COLUMN location_country TEXT;
