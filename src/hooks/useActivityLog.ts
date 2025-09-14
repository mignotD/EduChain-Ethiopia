import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { Database } from '@/integrations/supabase/types';

type ActivityLog = Database['public']['Tables']['activity_logs']['Row'];

export function useActivityLog() {
  const { user, profile } = useAuth();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    if (!user || !profile) return;

    setLoading(true);
    try {
      let query = supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (profile.role === 'university_admin' && profile.university_code) {
        query = query.eq('university_code', profile.university_code);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching activity logs:', error);
        throw error;
      }

      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && profile) {
      fetchLogs();
    }
  }, [user, profile]);

  const getActionLabel = (action: string): string => {
    const labels: Record<string, string> = {
      issued: 'Certificate Issued',
      revoked: 'Certificate Revoked',
      verified: 'Certificate Verified',
      bulk_issued: 'Bulk Certificate Issuance',
    };
    return labels[action] || action;
  };

  const getActionIcon = (action: string): string => {
    const icons: Record<string, string> = {
      issued: 'issued',
      revoked: 'revoked',
      verified: 'verified',
      bulk_issued: 'bulk',
    };
    return icons[action] || 'default';
  };

  return {
    logs,
    loading,
    fetchLogs,
    getActionLabel,
    getActionIcon,
  };
}
