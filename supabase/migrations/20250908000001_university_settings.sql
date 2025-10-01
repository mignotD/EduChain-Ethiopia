-- Create university_settings table
CREATE TABLE IF NOT EXISTS university_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_code TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  primary_color TEXT NOT NULL DEFAULT '#1a7a5a',
  accent_color TEXT NOT NULL DEFAULT '#d4942b',
  certificate_theme TEXT NOT NULL DEFAULT 'classic' CHECK (certificate_theme IN ('classic', 'modern', 'traditional')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE university_settings ENABLE ROW LEVEL SECURITY;

-- Policies: admins can manage their own university's settings
CREATE POLICY "Users can view their own university settings"
  ON university_settings
  FOR SELECT
  TO authenticated
  USING (
    university_code IN (
      SELECT university_code FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own university settings"
  ON university_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    university_code IN (
      SELECT university_code FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own university settings"
  ON university_settings
  FOR UPDATE
  TO authenticated
  USING (
    university_code IN (
      SELECT university_code FROM profiles WHERE user_id = auth.uid()
    )
  );

-- Super admins can see/update all
CREATE POLICY "Super admins can view all settings"
  ON university_settings
  FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE user_id = auth.uid()) = 'super_admin'
  );

CREATE POLICY "Super admins can update all settings"
  ON university_settings
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE user_id = auth.uid()) = 'super_admin'
  );

-- Auto-create university_settings row when profile is updated with university_code
CREATE OR REPLACE FUNCTION auto_create_university_settings()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.university_code IS NOT NULL THEN
    INSERT INTO university_settings (university_code)
    VALUES (NEW.university_code)
    ON CONFLICT (university_code) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER after_profile_update_create_settings
  AFTER INSERT OR UPDATE OF university_code
  ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_university_settings();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_university_settings_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_university_settings_updated_at
  BEFORE UPDATE ON university_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_university_settings_updated_at();

-- Storage bucket for university logos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('university-logos', 'university-logos', true, 2097152, ARRAY['image/png', 'image/jpeg', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Allow public read of logos
CREATE POLICY "Public read university logos"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'university-logos');

-- Allow authenticated users to upload logos
CREATE POLICY "Authenticated users can upload logos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'university-logos');

CREATE POLICY "Authenticated users can update logos"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'university-logos');

CREATE POLICY "Authenticated users can delete logos"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'university-logos');
