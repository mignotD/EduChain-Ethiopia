import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import QRCode from 'qrcode';
import type { Database } from '@/integrations/supabase/types';
import { sendEmail, buildCertificateIssuedEmail, buildCertificateRevokedEmail, fetchEmailTemplate } from '@/utils/emailNotifications';

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

      // Send email notification (non-blocking)
      if (profile?.university_name) {
        const emailTemplate = profile.university_code ? await fetchEmailTemplate(profile.university_code) : null;
        sendEmail({
          to: [profile.email],
          ...buildCertificateIssuedEmail({
            studentName: certificateData.student_name,
            degree: certificateData.degree,
            university: profile.university_name,
            certificateId: certificate.certificate_id,
            template: emailTemplate ?? undefined,
          }),
        });
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

  // Revoke a certificate with reason and audit trail
  const revokeCertificate = async (certificateId: string, reason: string) => {
    if (!user || !profile) throw new Error('User not authenticated');
    setLoading(true);
    try {
      // Get certificate info for the email notification
      const { data: certInfo } = await supabase
        .from('certificates')
        .select('student_name')
        .eq('certificate_id', certificateId)
        .single();

      const { error } = await supabase
        .from('certificates')
        .update({
          status: 'revoked',
          revocation_reason: reason,
          revoked_at: new Date().toISOString(),
          revoked_by: user.id,
        })
        .eq('certificate_id', certificateId);

      if (error) {
        console.error('Error revoking certificate:', error);
        throw error;
      }

      // Create audit log entry
      await supabase
        .from('activity_logs')
        .insert({
          action: 'revoked',
          certificate_id: certificateId,
          actor_id: user.id,
          university_code: profile.university_code,
          details: { reason }
        });

      // Send revocation email notification (non-blocking)
      const emailTemplate = profile.university_code ? await fetchEmailTemplate(profile.university_code) : null;
      sendEmail({
        to: [profile.email],
        ...buildCertificateRevokedEmail({
          studentName: certInfo?.student_name || 'Unknown',
          certificateId,
          reason,
          template: emailTemplate ? { headerText: emailTemplate.headerText, footerText: emailTemplate.footerText } : undefined,
        }),
      });

      await fetchCertificates();
    } catch (error) {
      console.error('Error revoking certificate:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Check if a certificate is expired
  const isCertificateExpired = (certificate: Certificate): boolean => {
    if (!certificate.expiry_date) return false;
    return new Date(certificate.expiry_date) < new Date();
  };

  // Compute effective status (accounts for expiry)
  const getEffectiveStatus = (certificate: Certificate): string => {
    if (certificate.status === 'revoked') return 'revoked';
    if (isCertificateExpired(certificate)) return 'expired';
    return certificate.status;
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
        status: verificationResult.status as Database['public']['Enums']['certificate_status'],
        gpa: verificationResult.gpa,
        honors: verificationResult.honors,
        expiry_date: verificationResult.expiry_date,
        revocation_reason: verificationResult.revocation_reason,
        revoked_at: verificationResult.revoked_at,
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

  // Fetch certificates for a student (public, no auth required)
  const fetchStudentCertificates = async (studentId: string): Promise<Certificate[]> => {
    try {
      const { data, error } = await supabase
        .rpc('get_student_certificates', { student_id_param: studentId });

      if (error) {
        console.error('Error fetching student certificates:', error);
        throw error;
      }

      if (!data || data.length === 0) return [];

      return data.map((cert: any) => ({
        certificate_id: cert.certificate_id,
        student_name: cert.student_name,
        degree: cert.degree,
        field_of_study: cert.field_of_study,
        graduation_date: cert.graduation_date,
        university_name: cert.university_name,
        status: cert.status,
        issued_at: cert.issued_at,
        gpa: cert.gpa,
        honors: cert.honors,
        expiry_date: cert.expiry_date,
        is_expired: cert.is_expired,
        student_id: studentId,
        qr_code: null,
        university_code: 'Hidden for privacy',
        issued_by: 'Hidden for privacy' as any,
        id: 'Hidden for privacy' as any,
        created_at: cert.issued_at,
        updated_at: cert.issued_at,
        revocation_reason: null,
        revoked_at: null,
        revoked_by: null,
      })) as Certificate[];
    } catch (error) {
      console.error('Error fetching student certificates:', error);
      throw error;
    }
  };

  // Bulk issue certificates from parsed spreadsheet data
  const bulkIssueCertificates = async (
    rows: { student_name: string; student_id: string; degree: string; field_of_study: string; graduation_date: string; gpa?: number | null; honors?: string; expiry_date?: string | null }[]
  ): Promise<{ succeeded: number; failed: number; errors: { row: number; error: string }[] }> => {
    if (!user || !profile) throw new Error('User not authenticated');
    if (!profile.university_name || !profile.university_code) throw new Error('Profile incomplete');
    
    setLoading(true);
    const errors: { row: number; error: string }[] = [];
    let succeeded = 0;
    const batchSize = 50;

    try {
      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        const inserts = await Promise.allSettled(
          batch.map(async (row, batchIndex) => {
            const rowNumber = i + batchIndex + 2;

            // Generate certificate ID
            const { data: certificateId, error: idError } = await supabase
              .rpc('generate_certificate_id');
            if (idError || !certificateId) {
              errors.push({ row: rowNumber, error: 'Failed to generate certificate ID' });
              return;
            }

            // Insert certificate
            const insertData: any = {
              certificate_id: certificateId,
              student_name: row.student_name,
              student_id: row.student_id,
              degree: row.degree,
              field_of_study: row.field_of_study,
              graduation_date: row.graduation_date,
              university_name: profile.university_name,
              university_code: profile.university_code,
              issued_by: user.id,
              status: 'active',
            };

            if (row.gpa != null) insertData.gpa = row.gpa;
            if (row.honors) insertData.honors = row.honors;
            if (row.expiry_date) insertData.expiry_date = row.expiry_date;

            const { data: certificate, error: insertError } = await supabase
              .from('certificates')
              .insert(insertData)
              .select()
              .single();

            if (insertError) {
              errors.push({ row: rowNumber, error: insertError.message });
              return;
            }

            // Generate QR code
            try {
              const qrCodeData = await generateQRCode(certificate.certificate_id);
              await supabase
                .from('certificates')
                .update({ qr_code: qrCodeData })
                .eq('id', certificate.id);
            } catch {
              // Non-blocking: QR generation failure doesn't fail the cert
            }

            succeeded++;
          })
        );
      }

      // Log the bulk issue activity
      await supabase
        .from('activity_logs')
        .insert({
          action: 'bulk_issued',
          actor_id: user.id,
          university_code: profile.university_code,
          details: { total: rows.length, succeeded, failed: errors.length }
        });

      await fetchCertificates();
    } catch (error) {
      console.error('Error in bulk issue:', error);
      throw error;
    } finally {
      setLoading(false);
    }

    return { succeeded, failed: errors.length, errors };
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
    generateQRCode,
    revokeCertificate,
    isCertificateExpired,
    getEffectiveStatus,
    bulkIssueCertificates,
    fetchStudentCertificates
  };
}