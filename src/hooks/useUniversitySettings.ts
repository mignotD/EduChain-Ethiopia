import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface UniversitySettings {
  id: string;
  university_code: string;
  logo_url: string | null;
  primary_color: string;
  accent_color: string;
  certificate_theme: 'classic' | 'modern' | 'traditional';
  email_header_text: string;
  email_body_prefix: string;
  email_footer_text: string;
  email_primary_color: string;
  created_at: string;
  updated_at: string;
}

export const DEFAULT_SETTINGS = {
  primary_color: '#1a7a5a',
  accent_color: '#d4942b',
  certificate_theme: 'classic' as const,
  email_header_text: 'EduChain Ethiopia',
  email_body_prefix: 'A new certificate has been issued:',
  email_footer_text: 'EduChain Ethiopia — Secure Academic Credential Verification',
  email_primary_color: '#1a365d',
};

export async function fetchSettingsByUniversityCode(universityCode: string): Promise<UniversitySettings | null> {
  try {
    const { data } = await supabase
      .from('university_settings')
      .select('*')
      .eq('university_code', universityCode)
      .single();
    return data as UniversitySettings | null;
  } catch {
    return null;
  }
}

export function useUniversitySettings() {
  const { profile } = useAuth();
  const [settings, setSettings] = useState<UniversitySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  const fetchSettings = useCallback(async () => {
    if (!profile?.university_code) {
      if (mountedRef.current) setLoading(false);
      return;
    }

    try {
      if (mountedRef.current) setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('university_settings')
        .select('*')
        .eq('university_code', profile.university_code)
        .single();

      if (!mountedRef.current) return;

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      setSettings(data as UniversitySettings | null);
    } catch (err: any) {
      console.error('Error fetching university settings:', err);
      if (mountedRef.current) setError(err.message);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [profile?.university_code]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = async (
    updates: Partial<Pick<UniversitySettings, 'logo_url' | 'primary_color' | 'accent_color' | 'certificate_theme' | 'email_header_text' | 'email_body_prefix' | 'email_footer_text' | 'email_primary_color'>>
  ) => {
    if (!profile?.university_code) {
      return { error: 'No university code set' };
    }

    try {
      const { data, error: updateError } = await supabase
        .from('university_settings')
        .upsert({
          university_code: profile.university_code,
          ...DEFAULT_SETTINGS,
          ...updates,
        }, { onConflict: 'university_code' })
        .select()
        .single();

      if (updateError) throw updateError;

      setSettings(data as UniversitySettings);

      // Update CSS variables for the university brand colors
      if (updates.primary_color) {
        document.documentElement.style.setProperty('--uni-primary', updates.primary_color);
      }
      if (updates.accent_color) {
        document.documentElement.style.setProperty('--uni-accent', updates.accent_color);
      }

      return { error: null };
    } catch (err: any) {
      console.error('Error updating university settings:', err);
      return { error: err.message };
    }
  };

  const uploadLogo = async (file: File): Promise<{ url: string | null; error: string | null }> => {
    if (!profile?.university_code) {
      return { url: null, error: 'No university code set' };
    }

    const fileExt = file.name.split('.').pop();
    const timestamp = Date.now();
    const fileName = `${profile.university_code}-logo-${timestamp}.${fileExt}`;
    const filePath = `logos/${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('university-logos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('university-logos')
        .getPublicUrl(filePath);

      const publicUrl = urlData?.publicUrl || null;

      const { error: updateError } = await updateSettings({ logo_url: publicUrl });
      if (updateError) throw updateError;

      return { url: publicUrl, error: null };
    } catch (err: any) {
      console.error('Error uploading logo:', err);
      return { url: null, error: err.message };
    }
  };

  const removeLogo = async () => {
    if (!settings?.logo_url) return { error: null };

    try {
      await updateSettings({ logo_url: null });
      return { error: null };
    } catch (err: any) {
      return { error: err.message };
    }
  };

  return {
    settings,
    loading,
    error,
    updateSettings,
    uploadLogo,
    removeLogo,
    refetch: fetchSettings,
  };
}
