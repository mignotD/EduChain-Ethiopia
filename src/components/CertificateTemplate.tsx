import { Database } from '@/integrations/supabase/types';
import { GraduationCap, Shield, Calendar } from 'lucide-react';

type Certificate = Database['public']['Tables']['certificates']['Row'];

interface CertificateTemplateProps {
  certificate: Certificate;
  className?: string;
}

export const CertificateTemplate = ({ certificate, className = "" }: CertificateTemplateProps) => {
  return (
    <div 
      id="certificate-template"
      className={`bg-white p-16 min-h-[800px] relative overflow-hidden ${className}`}
      style={{ 
        width: '1200px', 
        fontFamily: 'serif',
        background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)'
      }}
    >
      {/* Decorative Border */}
      <div className="absolute inset-4 border-8 border-double border-amber-600"></div>
      <div className="absolute inset-8 border-2 border-amber-400"></div>
      
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 text-8xl text-amber-600">
          <GraduationCap />
        </div>
        <div className="absolute bottom-20 right-20 text-8xl text-amber-600">
          <Shield />
        </div>
      </div>

      {/* Header */}
      <div className="text-center mb-12 relative z-10">
        <div className="flex justify-center mb-6">
          <div className="p-6 bg-amber-100 rounded-full border-4 border-amber-600">
            <GraduationCap className="h-16 w-16 text-amber-700" />
          </div>
        </div>
        
        <h1 className="text-6xl font-bold text-amber-800 mb-4 tracking-wide">
          CERTIFICATE
        </h1>
        <h2 className="text-3xl text-amber-700 mb-2 tracking-widest">
          OF GRADUATION
        </h2>
        <div className="w-48 h-1 bg-amber-600 mx-auto"></div>
      </div>

      {/* Main Content */}
      <div className="text-center mb-12 relative z-10">
        <p className="text-2xl text-gray-700 mb-8 italic">
          This is to certify that
        </p>
        
        <h3 className="text-5xl font-bold text-gray-900 mb-8 border-b-4 border-amber-600 pb-4 inline-block">
          {certificate.student_name}
        </h3>
        
        <p className="text-2xl text-gray-700 mb-6">
          has successfully completed the academic requirements for the degree of
        </p>
        
        <h4 className="text-4xl font-bold text-amber-800 mb-8">
          {certificate.degree}
        </h4>
        
        <p className="text-xl text-gray-700 mb-4">
          in the field of
        </p>
        
        <h5 className="text-3xl font-semibold text-gray-800 mb-8">
          {certificate.field_of_study}
        </h5>
        
        {certificate.gpa && (
          <p className="text-xl text-gray-700 mb-8">
            with a cumulative GPA of <span className="font-bold text-amber-700">{certificate.gpa}</span>
          </p>
        )}
      </div>

      {/* Institution Info */}
      <div className="text-center mb-12 relative z-10">
        <p className="text-xl text-gray-700 mb-2">
          from
        </p>
        <h6 className="text-3xl font-bold text-gray-900 mb-6">
          {certificate.university_name}
        </h6>
      </div>

      {/* Footer */}
      <div className="grid grid-cols-3 gap-8 items-end relative z-10">
        {/* Date */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            <Calendar className="h-5 w-5 text-amber-600 mr-2" />
            <p className="text-lg font-semibold text-gray-700">Graduation Date</p>
          </div>
          <p className="text-xl font-bold text-gray-900">
            {certificate.graduation_date ? new Date(certificate.graduation_date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }) : 'Date not available'}
          </p>
          <div className="w-32 h-0.5 bg-gray-400 mx-auto mt-4"></div>
        </div>

        {/* Certificate ID */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            <Shield className="h-5 w-5 text-amber-600 mr-2" />
            <p className="text-lg font-semibold text-gray-700">Certificate ID</p>
          </div>
          <p className="text-xl font-bold text-gray-900 font-mono">
            {certificate.certificate_id}
          </p>
          <div className="w-32 h-0.5 bg-gray-400 mx-auto mt-4"></div>
        </div>

        {/* Student ID */}
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-700 mb-2">Student ID</p>
          <p className="text-xl font-bold text-gray-900 font-mono">
            {certificate.student_id}
          </p>
          <div className="w-32 h-0.5 bg-gray-400 mx-auto mt-4"></div>
        </div>
      </div>

      {/* Verification Footer */}
      <div className="text-center mt-12 pt-8 border-t-2 border-amber-200 relative z-10">
        <p className="text-sm text-gray-600 mb-2">
          This certificate is verified by EduChain Ethiopia blockchain system
        </p>
        <p className="text-sm text-gray-500">
          Issued on {new Date(certificate.issued_at).toLocaleDateString()} | University Code: {certificate.university_code}
        </p>
        <div className="flex justify-center items-center mt-4">
          <Shield className="h-4 w-4 text-amber-600 mr-2" />
          <span className="text-sm font-semibold text-amber-700">Blockchain Verified</span>
        </div>
      </div>
    </div>
  );
};