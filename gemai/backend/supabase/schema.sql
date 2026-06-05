-- Supabase Schema for Gemify MVP (Phase 1)

-- 1. Create templates table
CREATE TABLE IF NOT EXISTS templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    prompt TEXT NOT NULL,
    input_preview_url TEXT,
    output_preview_url TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    is_beta BOOLEAN DEFAULT false,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS but allow service_role to bypass it. We will disable RLS or allow open read access for public, write access only for service_role/admin.
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

-- Public read access for templates
CREATE POLICY "Allow public read access for templates" ON templates
    FOR SELECT USING (is_active = true);

-- Service role access for all operations on templates
CREATE POLICY "Allow service_role full access for templates" ON templates
    FOR ALL USING (true) WITH CHECK (true);


-- 2. Create generations table
CREATE TABLE IF NOT EXISTS generations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES templates(id) ON DELETE SET NULL,
    template_name TEXT,
    input_image_url TEXT,
    output_image_url TEXT,
    user_ip TEXT,
    user_agent TEXT,
    generation_status TEXT DEFAULT 'success',
    error_message TEXT,
    estimated_cost_usd NUMERIC DEFAULT 0.025,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE generations ENABLE ROW LEVEL SECURITY;

-- Service role access for all operations on generations
CREATE POLICY "Allow service_role full access for generations" ON generations
    FOR ALL USING (true) WITH CHECK (true);


-- 3. Create app_settings table
CREATE TABLE IF NOT EXISTS app_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Service role access for all operations on app_settings
CREATE POLICY "Allow service_role full access for app_settings" ON app_settings
    FOR ALL USING (true) WITH CHECK (true);
