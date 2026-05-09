-- 006: Fix conversion_rate column precision.
-- DECIMAL(7,4) allows values up to 999.9999 which is semantically wrong for a rate (0.0 to 1.0).
-- DECIMAL(5,4) allows 0.0000 to 1.9999 which is correct.

ALTER TABLE metrics
    ALTER COLUMN conversion_rate TYPE DECIMAL(5, 4);
