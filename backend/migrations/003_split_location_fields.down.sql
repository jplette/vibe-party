ALTER TABLE events RENAME COLUMN location_name TO location;
ALTER TABLE events DROP COLUMN IF EXISTS location_street;
ALTER TABLE events DROP COLUMN IF EXISTS location_city;
ALTER TABLE events DROP COLUMN IF EXISTS location_zip;
ALTER TABLE events DROP COLUMN IF EXISTS location_country;
