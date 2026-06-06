-- Pricing section toggle for landing page (defaults to visible)
ALTER TABLE landing_content
  ADD COLUMN IF NOT EXISTS show_pricing BOOLEAN NOT NULL DEFAULT true;
