import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Database } from '@/integrations/supabase/types';
import { GraduationCap, Shield, Calendar, Award, ScrollText } from 'lucide-react';

type Certificate = Database['public']['Tables']['certificates']['Row'];

export interface TemplateSettings {
  logo_url?: string | null;
  primary_color?: string;
  accent_color?: string;
  certificate_theme?: 'classic' | 'modern' | 'traditional';
}

interface CertificateTemplateProps {
  certificate: Certificate;
  settings?: TemplateSettings;
  className?: string;
}

const getHonorsLabel = (gpa: number | null, honors: string | null): string | null => {
  if (honors) return honors;
  if (gpa === null || gpa === undefined) return null;
  if (gpa >= 3.9) return 'Summa Cum Laude';
  if (gpa >= 3.7) return 'Magna Cum Laude';
  if (gpa >= 3.5) return 'Cum Laude';
  return null;
};

const isExpired = (certificate: Certificate): boolean => {
  if (!certificate.expiry_date) return false;
  if (certificate.status === 'revoked') return false;
  return new Date(certificate.expiry_date) < new Date();
};

export const CertificateTemplate = ({ certificate, settings, className = "" }: CertificateTemplateProps) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const certRef = useRef<HTMLDivElement>(null);

  const primary = settings?.primary_color || '#1a7a5a';
  const accent = settings?.accent_color || '#d4942b';
  const theme = settings?.certificate_theme || 'classic';
  const logoUrl = settings?.logo_url;

  useEffect(() => {
    const verificationUrl = `${window.location.origin}/verify?id=${certificate.certificate_id}`;
    QRCode.toDataURL(verificationUrl, {
      width: 120,
      margin: 1,
      color: { dark: '#1a1a2e', light: '#fafafa' }
    }).then(setQrDataUrl);
  }, [certificate.certificate_id]);

  const honorsLabel = getHonorsLabel(certificate.gpa, certificate.honors);
  const expired = isExpired(certificate);
  const isRevoked = certificate.status === 'revoked';

  if (theme === 'modern') {
    return (
      <div ref={certRef} id="certificate-template"
        className={`bg-white p-16 min-h-[800px] relative overflow-hidden ${className}`}
        style={{ width: '1200px', fontFamily: 'Inter, system-ui, sans-serif', background: '#ffffff' }}
      >
        {/* Top accent bar */}
        <div className="absolute top-0 left-0 right-0 h-2" style={{ background: `linear-gradient(90deg, ${primary}, ${accent})` }} />

        {/* Minimal watermark */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-8xl font-bold opacity-[0.02] tracking-[0.3em] pointer-events-none select-none" style={{ color: primary }}>
          VERIFIED
        </div>

        {/* Status Overlay */}
        {(isRevoked || expired) && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-30deg] z-20">
            <div className={`px-12 py-4 border-4 text-5xl font-bold tracking-[0.15em] ${isRevoked ? 'text-red-600/30 border-red-600/30' : ''}`}
              style={!isRevoked ? { color: `${accent}40`, borderColor: `${accent}40` } : {}}>
              {isRevoked ? 'REVOKED' : 'EXPIRED'}
            </div>
          </div>
        )}

        <div className="text-center mb-12 relative z-10">
          <div className="flex justify-center mb-6">
            {logoUrl ? (
              <img src={logoUrl} alt="University Logo" className="h-20 w-20 object-contain" />
            ) : (
              <div className="p-4 rounded-full" style={{ background: `${primary}15` }}>
                <GraduationCap className="h-12 w-12" style={{ color: primary }} />
              </div>
            )}
          </div>
          <h1 className="text-5xl font-extrabold mb-2 tracking-tight" style={{ color: primary }}>CERTIFICATE</h1>
          <h2 className="text-2xl font-semibold mb-1 tracking-widest uppercase" style={{ color: primary }}>of Graduation</h2>
          <div className="flex items-center justify-center gap-2 my-4">
            <div className="h-px w-16" style={{ background: `linear-gradient(90deg, transparent, ${accent})` }} />
            <div className="p-1 rounded-full" style={{ background: `${accent}20` }}>
              <Award className="h-4 w-4" style={{ color: accent }} />
            </div>
            <div className="h-px w-16" style={{ background: `linear-gradient(270deg, transparent, ${accent})` }} />
          </div>
        </div>

        <div className="text-center mb-12 relative z-10 max-w-4xl mx-auto">
          <p className="text-base text-gray-500 mb-2">This is to certify that</p>
          <h3 className="text-4xl font-bold text-gray-900 mb-3">{certificate.student_name}</h3>
          {honorsLabel && (
            <div className="flex items-center justify-center gap-2 mb-3">
              <Award className="h-4 w-4" style={{ color: accent }} />
              <span className="text-lg font-semibold italic" style={{ color: accent }}>{honorsLabel}</span>
              <Award className="h-4 w-4" style={{ color: accent }} />
            </div>
          )}
          <p className="text-base text-gray-500 mb-2">has successfully completed</p>
          <h4 className="text-3xl font-bold text-gray-900 mb-1">{certificate.degree}</h4>
          <p className="text-base text-gray-500 mb-1">in the field of</p>
          <h5 className="text-xl font-semibold text-gray-700 mb-3">{certificate.field_of_study}</h5>
          {certificate.gpa && (
            <p className="text-base text-gray-500">
              with a GPA of <span className="font-bold" style={{ color: accent }}>{certificate.gpa.toFixed(2)}</span>
            </p>
          )}
          <h6 className="text-2xl font-bold text-gray-900 mt-4">{certificate.university_name}</h6>
        </div>

        <div className="grid grid-cols-2 gap-16 px-8 mb-12 relative z-10">
          <div className="text-center">
            <div className="border-b-2 border-gray-300 mb-2 h-12" />
            <p className="text-sm font-semibold text-gray-700">Registrar</p>
          </div>
          <div className="text-center">
            <div className="border-b-2 border-gray-300 mb-2 h-12" />
            <p className="text-sm font-semibold text-gray-700">Vice Chancellor</p>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-3 items-start relative z-10">
          {[
            { label: 'Graduation', value: certificate.graduation_date ? new Date(certificate.graduation_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—' },
            { label: 'Issued', value: new Date(certificate.issued_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) },
            { label: 'Valid Until', value: certificate.expiry_date ? new Date(certificate.expiry_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Lifetime', expired },
            { label: 'Cert ID', value: certificate.certificate_id, mono: true },
            { label: 'Student ID', value: certificate.student_id, mono: true },
          ].map((item, i) => (
            <div key={i} className="text-center">
              <Calendar className="h-4 w-4 mx-auto mb-1" style={{ color: accent }} />
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">{item.label}</p>
              <p className={`text-sm font-bold mt-1 ${(item as any).mono ? 'font-mono break-all' : ''} ${(item as any).expired ? 'text-red-600' : 'text-gray-900'}`}>{item.value}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200 relative z-10">
          <div className="flex items-center gap-2" style={{ color: primary }}>
            <Shield className="h-5 w-5" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider">Blockchain Verified</p>
              <p className="text-[10px] text-gray-400">Issued {new Date(certificate.issued_at).toLocaleDateString()} · {certificate.university_code}</p>
            </div>
          </div>
          {isRevoked && certificate.revocation_reason && <p className="text-xs text-red-600 font-medium">Revoked: {certificate.revocation_reason}</p>}
          {expired && <p className="text-xs font-medium" style={{ color: accent }}>This certificate has expired</p>}
          {qrDataUrl && (
            <div className="flex flex-col items-center">
              <img src={qrDataUrl} alt="QR" className="w-16 h-16" style={{ imageRendering: 'pixelated' }} />
              <p className="text-[9px] text-gray-400 mt-1 uppercase tracking-wider">Scan to Verify</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (theme === 'traditional') {
    return (
      <div ref={certRef} id="certificate-template"
        className={`bg-white p-16 min-h-[800px] relative overflow-hidden ${className}`}
        style={{
          width: '1200px',
          fontFamily: 'Georgia, "Times New Roman", serif',
          background: `linear-gradient(135deg, #fdfbf7 0%, #f8f6f0 50%, #fdfbf7 100%)`
        }}
      >
        {/* Ethiopian-inspired decorative border */}
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
          <div className="absolute inset-3" style={{ border: `3px solid ${primary}30` }} />
          <div className="absolute inset-6" style={{ border: `2px solid ${accent}20` }} />
          <div className="absolute inset-0 m-8" style={{ border: `1px solid ${primary}10` }} />
          {/* Traditional pattern top */}
          <div className="absolute top-4 left-12 right-12 h-2" style={{
            background: `repeating-linear-gradient(90deg, ${primary}40 0px, ${primary}40 8px, transparent 8px, transparent 16px, ${accent}40 16px, ${accent}40 24px, transparent 24px, transparent 32px)`
          }} />
          <div className="absolute bottom-4 left-12 right-12 h-2" style={{
            background: `repeating-linear-gradient(90deg, ${accent}40 0px, ${accent}40 8px, transparent 8px, transparent 16px, ${primary}40 16px, ${primary}40 24px, transparent 24px, transparent 32px)`
          }} />
        </div>

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-8xl font-bold opacity-[0.025] rotate-[-30deg] tracking-[0.3em] pointer-events-none select-none" style={{ color: primary }}>
          የምስክር
        </div>

        {(isRevoked || expired) && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-30deg] z-20">
            <div className={`px-12 py-4 border-4 text-5xl font-bold tracking-[0.15em] ${isRevoked ? 'text-red-600/30 border-red-600/30' : ''}`}
              style={!isRevoked ? { color: `${accent}40`, borderColor: `${accent}40` } : {}}>
              {isRevoked ? 'REVOKED' : 'EXPIRED'}
            </div>
          </div>
        )}

        <div className="text-center mb-10 relative z-10">
          <div className="flex justify-center mb-4">
            {logoUrl ? (
              <img src={logoUrl} alt="University Logo" className="h-16 w-16 object-contain rounded-full border-2 p-1" style={{ borderColor: accent }} />
            ) : (
              <div className="p-4 rounded-full border-[3px]" style={{ background: `linear-gradient(135deg, ${primary}10, ${primary}20)`, borderColor: accent }}>
                <GraduationCap className="h-12 w-12" style={{ color: primary }} />
              </div>
            )}
          </div>
          <h1 className="text-5xl font-bold mb-1 tracking-[0.08em]" style={{ color: primary }}>የምስክር ወረቀት</h1>
          <h2 className="text-2xl mb-1 tracking-[0.12em]" style={{ color: accent }}>CERTIFICATE OF GRADUATION</h2>
          <div className="flex items-center justify-center gap-2 my-3">
            <div className="h-px w-16" style={{ background: `linear-gradient(90deg, transparent, ${accent})` }} />
            <Award className="h-5 w-5" style={{ color: accent }} />
            <div className="h-px w-16" style={{ background: `linear-gradient(270deg, transparent, ${accent})` }} />
          </div>
        </div>

        <div className="text-center mb-10 relative z-10">
          <p className="text-lg text-gray-600 mb-2">This is to certify that</p>
          <h3 className="text-4xl font-bold text-gray-900 mb-3 px-8 py-3 inline-block" style={{ borderTop: `2px solid ${accent}60`, borderBottom: `2px solid ${accent}60` }}>
            {certificate.student_name}
          </h3>
          {honorsLabel && (
            <div className="flex items-center justify-center gap-2 my-3">
              <Award className="h-5 w-5" style={{ color: accent }} />
              <span className="text-xl font-semibold italic tracking-wide" style={{ color: `${primary}cc` }}>{honorsLabel}</span>
              <Award className="h-5 w-5" style={{ color: accent }} />
            </div>
          )}
          <p className="text-base text-gray-600 mt-4 mb-2">has successfully completed the academic requirements for the degree of</p>
          <h4 className="text-3xl font-bold mb-4" style={{ color: primary }}>{certificate.degree}</h4>
          <p className="text-base text-gray-600 mb-2">in the field of</p>
          <h5 className="text-xl font-semibold text-gray-800 mb-3">{certificate.field_of_study}</h5>
          {certificate.gpa && (
            <p className="text-base text-gray-600">
              with a cumulative GPA of <span className="font-bold" style={{ color: accent }}>{certificate.gpa.toFixed(2)}</span>
            </p>
          )}
          <h6 className="text-2xl font-bold text-gray-900 mt-4">{certificate.university_name}</h6>
        </div>

        <div className="grid grid-cols-2 gap-16 px-8 mb-10 relative z-10">
          <div className="text-center">
            <div className="border-b-2 border-gray-400 mb-2 h-12" />
            <p className="text-sm font-semibold text-gray-700">Registrar</p>
            <p className="text-xs text-gray-500">{certificate.university_name}</p>
          </div>
          <div className="text-center">
            <div className="border-b-2 border-gray-400 mb-2 h-12" />
            <p className="text-sm font-semibold text-gray-700">Vice Chancellor</p>
            <p className="text-xs text-gray-500">{certificate.university_name}</p>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-3 items-start relative z-10">
          {[
            { icon: Calendar, label: 'Graduation', value: certificate.graduation_date ? new Date(certificate.graduation_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—' },
            { icon: Calendar, label: 'Issued', value: new Date(certificate.issued_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) },
            { icon: Calendar, label: 'Valid Until', value: certificate.expiry_date ? new Date(certificate.expiry_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Lifetime', expired },
            { icon: Shield, label: 'Cert ID', value: certificate.certificate_id, mono: true },
            { icon: ScrollText, label: 'Student ID', value: certificate.student_id, mono: true },
          ].map((item, i) => (
            <div key={i} className="text-center">
              <div className="flex justify-center mb-1">
                <item.icon className="h-4 w-4" style={{ color: accent }} />
              </div>
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider">{item.label}</p>
              <p className={`text-sm font-bold mt-1 ${(item as any).mono ? 'font-mono break-all' : ''} ${(item as any).expired ? 'text-red-600' : 'text-gray-900'}`}>{item.value}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mt-8 pt-6 relative z-10" style={{ borderTop: `2px solid ${accent}40` }}>
          <div className="flex items-center gap-2" style={{ color: primary }}>
            <Shield className="h-5 w-5" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider">Blockchain Verified</p>
              <p className="text-[10px] text-gray-500">Issued {new Date(certificate.issued_at).toLocaleDateString()} · Code: {certificate.university_code}</p>
            </div>
          </div>
          {isRevoked && certificate.revocation_reason && <p className="text-xs text-red-600 font-medium">Revoked: {certificate.revocation_reason}</p>}
          {expired && <p className="text-xs font-medium" style={{ color: accent }}>This certificate has expired</p>}
          {qrDataUrl && (
            <div className="flex flex-col items-center">
              <img src={qrDataUrl} alt="QR" className="w-16 h-16" style={{ imageRendering: 'pixelated' }} />
              <p className="text-[9px] text-gray-500 mt-1 uppercase tracking-wider">Scan to Verify</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div ref={certRef} id="certificate-template"
      className={`bg-white p-16 min-h-[800px] relative overflow-hidden ${className}`}
      style={{
        width: '1200px',
        fontFamily: 'Georgia, "Times New Roman", serif',
        background: 'linear-gradient(135deg, #fdfbf7 0%, #f8f6f0 50%, #fdfbf7 100%)'
      }}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 40px, rgba(0,0,0,0.03) 40px, rgba(0,0,0,0.03) 80px)`
        }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-8xl font-bold text-gray-200/20 rotate-[-30deg] whitespace-nowrap tracking-[0.3em]">CERTIFIED</div>
      </div>

      <div className="absolute inset-3" style={{ border: `3px solid ${accent}40` }} />
      <div className="absolute inset-6" style={{ border: `2px solid ${accent}30` }} />
      <div className="absolute inset-0 m-8" style={{ border: `1px solid ${accent}20` }} />
      <div className="absolute top-8 left-8 w-16 h-16" style={{ borderTop: `4px solid ${accent}60`, borderLeft: `4px solid ${accent}60` }} />
      <div className="absolute top-8 right-8 w-16 h-16" style={{ borderTop: `4px solid ${accent}60`, borderRight: `4px solid ${accent}60` }} />
      <div className="absolute bottom-8 left-8 w-16 h-16" style={{ borderBottom: `4px solid ${accent}60`, borderLeft: `4px solid ${accent}60` }} />
      <div className="absolute bottom-8 right-8 w-16 h-16" style={{ borderBottom: `4px solid ${accent}60`, borderRight: `4px solid ${accent}60` }} />

      {(isRevoked || expired) && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-30deg] z-20">
          <div className={`px-12 py-4 border-4 text-5xl font-bold tracking-[0.15em] ${isRevoked ? 'text-red-600/30 border-red-600/30' : ''}`}
            style={!isRevoked ? { color: `${accent}40`, borderColor: `${accent}40` } : {}}>
            {isRevoked ? 'REVOKED' : 'EXPIRED'}
          </div>
        </div>
      )}

      <div className="text-center mb-10 relative z-10">
        <div className="flex justify-center mb-4">
          {logoUrl ? (
            <img src={logoUrl} alt="University Logo" className="h-16 w-16 object-contain rounded-full border-[3px] p-2" style={{ borderColor: accent, background: `linear-gradient(135deg, ${primary}10, ${primary}05)` }} />
          ) : (
            <div className="p-5 rounded-full border-[3px]" style={{ background: `linear-gradient(135deg, ${primary}10, ${primary}20)`, borderColor: accent }}>
              <GraduationCap className="h-14 w-14" style={{ color: primary }} />
            </div>
          )}
        </div>
        <h1 className="text-6xl font-bold mb-2 tracking-[0.08em]" style={{ color: primary }}>CERTIFICATE</h1>
        <h2 className="text-3xl mb-1 tracking-[0.12em]" style={{ color: accent }}>OF GRADUATION</h2>
        <div className="flex items-center justify-center gap-2 my-3">
          <div className="h-px w-20" style={{ background: `linear-gradient(90deg, transparent, ${accent})` }} />
          <Award className="h-5 w-5" style={{ color: accent }} />
          <div className="h-px w-20" style={{ background: `linear-gradient(270deg, transparent, ${accent})` }} />
        </div>
      </div>

      <div className="text-center mb-10 relative z-10">
        <p className="text-xl text-gray-600 mb-2">This is to certify that</p>
        <h3 className="text-5xl font-bold text-gray-900 mb-4 px-8 py-3 inline-block" style={{ borderTop: `2px solid ${accent}60`, borderBottom: `2px solid ${accent}60` }}>
          {certificate.student_name}
        </h3>
        {honorsLabel && (
          <div className="flex items-center justify-center gap-2 my-3">
            <Award className="h-5 w-5" style={{ color: accent }} />
            <span className="text-xl font-semibold italic tracking-wide" style={{ color: `${primary}cc` }}>{honorsLabel}</span>
            <Award className="h-5 w-5" style={{ color: accent }} />
          </div>
        )}
        <p className="text-lg text-gray-600 mb-2 mt-4">has successfully completed the academic requirements for the degree of</p>
        <h4 className="text-4xl font-bold mb-4" style={{ color: primary }}>{certificate.degree}</h4>
        <p className="text-lg text-gray-600 mb-2">in the field of</p>
        <h5 className="text-2xl font-semibold text-gray-800 mb-4">{certificate.field_of_study}</h5>
        {certificate.gpa && (
          <p className="text-lg text-gray-600">with a cumulative GPA of <span className="font-bold" style={{ color: accent }}>{certificate.gpa.toFixed(2)}</span></p>
        )}
        <p className="text-lg text-gray-600 mt-2">from</p>
        <h6 className="text-3xl font-bold text-gray-900 mt-1">{certificate.university_name}</h6>
      </div>

      <div className="grid grid-cols-2 gap-16 px-8 mb-10 relative z-10">
        <div className="text-center">
          <div className="border-b-2 border-gray-400 mb-2 h-12" />
          <p className="text-sm font-semibold text-gray-700">Registrar</p>
          <p className="text-xs text-gray-500">{certificate.university_name}</p>
        </div>
        <div className="text-center">
          <div className="border-b-2 border-gray-400 mb-2 h-12" />
          <p className="text-sm font-semibold text-gray-700">Vice Chancellor</p>
          <p className="text-xs text-gray-500">{certificate.university_name}</p>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-3 items-start relative z-10">
        {[
          { icon: Calendar, label: 'Graduation', value: certificate.graduation_date ? new Date(certificate.graduation_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—' },
          { icon: Calendar, label: 'Issued', value: new Date(certificate.issued_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) },
          { icon: Calendar, label: 'Valid Until', value: certificate.expiry_date ? new Date(certificate.expiry_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Lifetime', expired },
          { icon: Shield, label: 'Cert ID', value: certificate.certificate_id, mono: true },
          { icon: ScrollText, label: 'Student ID', value: certificate.student_id, mono: true },
        ].map((item, i) => (
          <div key={i} className="text-center">
            <item.icon className="h-4 w-4 mx-auto mb-1" style={{ color: accent }} />
            <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider">{item.label}</p>
            <p className={`text-sm font-bold mt-1 ${(item as any).mono ? 'font-mono break-all' : ''} ${(item as any).expired ? 'text-red-600' : 'text-gray-900'}`}>{item.value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mt-8 pt-6 relative z-10" style={{ borderTop: `2px solid ${accent}40` }}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2" style={{ color: primary }}>
            <Shield className="h-5 w-5" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider">Blockchain Verified</p>
              <p className="text-[10px] text-gray-500">Issued {new Date(certificate.issued_at).toLocaleDateString()} · Code: {certificate.university_code}</p>
            </div>
          </div>
        </div>
        <div className="text-center">
          {isRevoked && certificate.revocation_reason && <p className="text-xs text-red-600 font-medium">Revoked: {certificate.revocation_reason}</p>}
          {expired && <p className="text-xs font-medium" style={{ color: accent }}>This certificate has expired</p>}
        </div>
        {qrDataUrl && (
          <div className="flex flex-col items-center">
            <img src={qrDataUrl} alt="QR" className="w-16 h-16" style={{ imageRendering: 'pixelated' }} />
            <p className="text-[9px] text-gray-500 mt-1 uppercase tracking-wider">Scan to Verify</p>
          </div>
        )}
      </div>
    </div>
  );
};
