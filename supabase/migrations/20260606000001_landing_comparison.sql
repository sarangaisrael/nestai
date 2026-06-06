-- Comparison section toggle for landing page
ALTER TABLE landing_content
  ADD COLUMN IF NOT EXISTS show_comparison BOOLEAN NOT NULL DEFAULT false;
