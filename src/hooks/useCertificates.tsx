import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import QRCode from 'qrcode';
import type { Database } from '@/integrations/supabase/types';

type Certificate = Database['public']['Tables']['certificates']['Row'];
type CertificateInsert = Database['public']['Tables']['certificates']['Insert'];

interface CertificateInput {
  student_name: string;
  student_id: string;
  degree: string;
  field_of_study: string;
  university_name: string;
  university_code: string;
  graduation_date: string;
  gpa?: number | null;
  honors?: string;
}

export function useCertificates() {
  const { user, profile } = useAuth();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);

  // Fetch certificates for the current user's university
  const fetchCertificates = async () => {
    if (!user || !profile) return;
    
    setFetchLoading(true);
    try {
      let query = supabase
        .from('certificates')
        .select('*')
        .order('created_at', { ascending: false });

      // If university admin, filter by university_code
      if (profile.role === 'university_admin' && profile.university_code) {
        query = query.eq('university_code', profile.university_code);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching certificates:', error);
        throw error;
      }

      setCertificates(data || []);
    } catch (error) {
      console.error('Error fetching certificates:', error);
    } finally {
      setFetchLoading(false);
    }
  };

  // Generate QR code for certificate verification
  const generateQRCode = async (certificateId: string): Promise<string> => {
    const verificationUrl = `${window.location.origin}/verify/${certificateId}`;
    try {
      const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      return qrCodeDataUrl;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw error;
    }
  };

  // Issue a new certificate
  const issueCertificate = async (certificateData: CertificateInput) => {
    if (!user) throw new Error('User not authenticated');
    
    setLoading(true);
    try {
      // Call the function to generate a unique certificate ID
      const { data: certificateId, error: idError } = await supabase
        .rpc('generate_certificate_id');

      if (idError || !certificateId) {
        throw new Error('Failed to generate certificate ID');
      }

      // Insert the certificate with the generated ID
      const { data: certificate, error: insertError } = await supabase
        .from('certificates')
        .insert({
          certificate_id: certificateId,
          ...certificateData,
          issued_by: user.id,
          status: 'active' as const
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error inserting certificate:', insertError);
        throw insertError;
      }

      // Generate QR code with the certificate_id
      const qrCodeData = await generateQRCode(certificate.certificate_id);

      // Update the certificate with QR code data
      const { error: updateError } = await supabase
        .from('certificates')
        .update({ qr_code: qrCodeData })
        .eq('id', certificate.id);

      if (updateError) {
        console.error('Error updating QR code:', updateError);
        // Don't throw here as the certificate was created successfully
      }

      // Refresh the certificates list
      await fetchCertificates();
      
      return certificate;
    } catch (error) {
      console.error('Error issuing certificate:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Update certificate status
  const updateCertificateStatus = async (certificateId: string, status: Database['public']['Enums']['certificate_status']) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('certificates')
        .update({ status })
        .eq('certificate_id', certificateId);

      if (error) {
        console.error('Error updating certificate status:', error);
        throw error;
      }

      // Refresh the certificates list
      await fetchCertificates();
    } catch (error) {
      console.error('Error updating certificate status:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Verify a certificate by ID using secure verification function
  const verifyCertificate = async (certificateId: string): Promise<Certificate | null> => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .rpc('verify_certificate_public', { cert_id: certificateId });

      if (error) {
        console.error('Error verifying certificate:', error);
        throw error;
      }

      if (!data || data.length === 0 || !data[0].is_valid) {
        return null;
      }

      // Transform the verification result to match Certificate type
      const verificationResult = data[0];
      return {
        certificate_id: verificationResult.certificate_id,
        student_name: verificationResult.student_name,
        degree: verificationResult.degree,
        field_of_study: verificationResult.field_of_study,
        university_name: verificationResult.university_name,
        graduation_date: verificationResult.graduation_date,
        issued_at: verificationResult.issued_at,
        status: 'active' as const,
        gpa: verificationResult.gpa,
        honors: verificationResult.honors,
        // Hide sensitive fields for public verification
        student_id: 'Hidden for privacy',
        qr_code: null,
        university_code: 'Hidden for privacy',
        issued_by: 'Hidden for privacy' as any,
        id: 'Hidden for privacy' as any,
        created_at: verificationResult.issued_at,
        updated_at: verificationResult.issued_at
      } as Certificate;
    } catch (error) {
      console.error('Error verifying certificate:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Search certificates
  const searchCertificates = async (query: string): Promise<Certificate[]> => {
    setLoading(true);
    try {
      let dbQuery = supabase
        .from('certificates')
        .select('*');

      // If university admin, filter by university_code
      if (profile?.role === 'university_admin' && profile.university_code) {
        dbQuery = dbQuery.eq('university_code', profile.university_code);
      }

      // Add search conditions
      dbQuery = dbQuery.or(`student_name.ilike.%${query}%,student_id.ilike.%${query}%,certificate_id.ilike.%${query}%`);

      const { data, error } = await dbQuery
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error searching certificates:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error searching certificates:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Fetch certificates on component mount
  useEffect(() => {
    if (user && profile) {
      fetchCertificates();
    }
  }, [user, profile]);

  return {
    certificates,
    loading,
    fetchLoading,
    issueCertificate,
    updateCertificateStatus,
    verifyCertificate,
    searchCertificates,
    fetchCertificates,
    generateQRCode
  };
}