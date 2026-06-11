-- Migration Script to add tracking and safety columns to generations table

-- 1. Alter generations table to add tracking columns
ALTER TABLE generations 
ADD COLUMN IF NOT EXISTS visitor_id TEXT,
ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS is_watermarked BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS openai_model TEXT,
ADD COLUMN IF NOT EXISTS openai_quality TEXT,
ADD COLUMN IF NOT EXISTS openai_size TEXT,
ADD COLUMN IF NOT EXISTS ip_address TEXT,
ADD COLUMN IF NOT EXISTS presentation_mode TEXT DEFAULT 'keep_original';

-- 2. Alter templates table to add presentation mode support
ALTER TABLE templates
ADD COLUMN IF NOT EXISTS allowed_presentation_modes_json TEXT DEFAULT '["keep_original", "set_into_ring", "set_into_pendant"]',
ADD COLUMN IF NOT EXISTS preferred_presentation_mode TEXT DEFAULT 'keep_original';

-- 3. Populate app_settings defaults
INSERT INTO app_settings (key, value) VALUES
('free_generations_per_user', '3'),
('free_generations_per_visitor', '3'),
('max_total_generations', '80'),
('max_daily_generations', '20'),
('max_generations_per_ip_per_day', '5'),
('estimated_cost_per_image_usd', '0.056'),
('maintenance_mode', 'false')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 4. Seed existing templates preferred presentation modes
UPDATE templates SET 
  preferred_presentation_mode = 'keep_original',
  allowed_presentation_modes_json = '["keep_original", "set_into_ring", "set_into_pendant"]'
WHERE category = 'gemstone';

UPDATE templates SET 
  preferred_presentation_mode = 'set_into_ring',
  allowed_presentation_modes_json = '["keep_original", "set_into_ring", "set_into_pendant"]'
WHERE category IN ('ring', 'model');

