import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCertificates } from '@/hooks/useCertificates';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { QRCodeDisplay } from '@/components/QRCodeDisplay';
import { generateCertificatePDF } from '@/utils/pdfGenerator';
import { CertificateTemplate } from '@/components/CertificateTemplate';
import { fetchSettingsByUniversityCode } from '@/hooks/useUniversitySettings';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';
import {
  GraduationCap, Search, User, School, FileText, QrCode,
  Download, Calendar, Clock, CheckCircle, XCircle, ArrowLeft, Loader2, IdCard
} from 'lucide-react';
import { format } from 'date-fns';

type Certificate = Database['public']['Tables']['certificates']['Row'];

const StudentPortal = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { fetchStudentCertificates, isCertificateExpired } = useCertificates();

  const [studentId, setStudentId] = useState(searchParams.get('id') || '');
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [studentName, setStudentName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const [certSettings, setCertSettings] = useState<Record<string, any>>({});

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = studentId.trim();
    if (!id) {
      setError('Please enter your student ID');
      return;
    }

    setLoading(true);
    setError(null);
    setSearched(true);
    setCertificates([]);
    setStudentName('');

    try {
      const results = await fetchStudentCertificates(id);
      if (results.length === 0) {
        setError('No certificates found for this student ID');
      } else {
        setCertificates(results);
        setStudentName(results[0].student_name);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch university settings when certificates load
  useEffect(() => {
    certificates.forEach(cert => {
      if (cert.university_code) {
        fetchSettingsByUniversityCode(cert.university_code).then(data => {
          if (data) setCertSettings(prev => ({ ...prev, [cert.university_code]: data }));
        });
      }
    });
  }, [certificates]);

  const handleDownloadPDF = async (cert: Certificate) => {
    setIsDownloadingPDF(true);
    setSelectedCert(cert);
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      await generateCertificatePDF(cert);
      toast.success('Certificate PDF downloaded');
    } catch (err) {
      toast.error('Failed to generate PDF');
    } finally {
      setIsDownloadingPDF(false);
      setSelectedCert(null);
    }
  };

  const getStatusBadge = (cert: Certificate) => {
    if (cert.status === 'revoked') {
      return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Revoked</Badge>;
    }
    if (isCertificateExpired(cert)) {
      return <Badge variant="outline" className="text-amber-600 border-amber-600"><Clock className="h-3 w-3 mr-1" />Expired</Badge>;
    }
    return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Valid</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </div>
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-primary text-primary-foreground">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-primary">EduChain Ethiopia</h1>
              <p className="text-xs text-muted-foreground">Student Certificates</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Search Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IdCard className="h-5 w-5" />
              Find Your Certificates
            </CardTitle>
            <CardDescription>
              Enter your student ID to view all your academic certificates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="studentId">Student ID</Label>
                <div className="flex gap-2">
                  <Input
                    id="studentId"
                    placeholder="e.g., STU-2020-12345"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="submit" disabled={loading} className="px-6">
                    {loading ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Searching...</>
                    ) : (
                      <><Search className="h-4 w-4 mr-2" />Search</>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Error */}
        {error && (
          <Alert variant="destructive" className="mb-8">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Results */}
        {!loading && searched && certificates.length > 0 && (
          <div className="space-y-6">
            {/* Student Info Header */}
            <Card className="bg-gradient-to-r from-primary/5 to-accent/5">
              <CardContent className="py-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-primary/10 text-primary">
                    <User className="h-8 w-8" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{studentName}</h2>
                    <p className="text-muted-foreground flex items-center gap-2">
                      <IdCard className="h-4 w-4" />
                      Student ID: {studentId}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Certificates</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{certificates.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-success">Valid</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-success">
                    {certificates.filter(c => c.status === 'active' && !isCertificateExpired(c)).length}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Institutions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {new Set(certificates.map(c => c.university_name)).size}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Certificate Cards */}
            {certificates.map((cert) => (
              <Card key={cert.certificate_id} className={`border-l-4 ${
                cert.status === 'revoked' ? 'border-l-destructive' :
                isCertificateExpired(cert) ? 'border-l-amber-500' :
                'border-l-primary'
              }`}>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{cert.degree}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{cert.field_of_study}</p>
                      {cert.gpa && (
                        <p className="text-sm text-muted-foreground">GPA: {cert.gpa}</p>
                      )}
                      {getStatusBadge(cert)}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <School className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{cert.university_name}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3 inline mr-1" />
                        Graduated: {format(new Date(cert.graduation_date), 'PP')}
                      </p>
                      {cert.expiry_date && (
                        <p className="text-sm text-muted-foreground">
                          <Clock className="h-3 w-3 inline mr-1" />
                          {isCertificateExpired(cert) ? 'Expired:' : 'Expires:'} {format(new Date(cert.expiry_date), 'PP')}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium">Certificate ID</p>
                      <p className="text-sm font-mono text-muted-foreground">{cert.certificate_id}</p>
                      <p className="text-sm text-muted-foreground">
                        Issued: {format(new Date(cert.issued_at), 'PP')}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button
                        variant="outline" size="sm"
                        onClick={() => navigate(`/verify/${cert.certificate_id}`)}
                        className="w-full"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                      <Button
                        variant="outline" size="sm"
                        onClick={() => { setSelectedCert(cert); setShowQR(true); }}
                        className="w-full"
                      >
                        <QrCode className="h-4 w-4 mr-2" />
                        QR Code
                      </Button>
                      <Button
                        variant="outline" size="sm"
                        onClick={() => handleDownloadPDF(cert)}
                        disabled={isDownloadingPDF}
                        className="w-full"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        {isDownloadingPDF && selectedCert?.certificate_id === cert.certificate_id ? 'Downloading...' : 'Download PDF'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Verification Footer */}
            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                Certificates are verified through the EduChain Ethiopia system.
                Employers can verify any certificate by its unique ID.
              </p>
            </div>
          </div>
        )}

        {/* Hidden template for PDF */}
        {selectedCert && (
          <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
            <CertificateTemplate certificate={selectedCert} settings={certSettings[selectedCert.university_code] || undefined} />
          </div>
        )}

        {/* QR Code Modal */}
        {selectedCert && (
          <QRCodeDisplay
            isOpen={showQR}
            onClose={() => { setShowQR(false); setSelectedCert(null); }}
            certificateId={selectedCert.certificate_id}
            studentName={selectedCert.student_name}
          />
        )}
      </div>
    </div>
  );
};

export default StudentPortal;
