import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Search, 
  QrCode, 
  CheckCircle, 
  XCircle, 
  GraduationCap,
  Calendar,
  School,
  User,
  FileText,
  Shield,
  ArrowLeft,
  Clock,
  Ban
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCertificates } from '@/hooks/useCertificates';
import { Database } from '@/integrations/supabase/types';
import QRScannerComponent from '@/components/QRScanner';
import { CertificateTemplate } from '@/components/CertificateTemplate';
import { fetchSettingsByUniversityCode } from '@/hooks/useUniversitySettings';
import { generateCertificatePDF } from '@/utils/pdfGenerator';
import { QRCodeDisplay } from '@/components/QRCodeDisplay';
import { PageTransition } from '@/components/PageTransition';
import { toast } from 'sonner';

type Certificate = Database['public']['Tables']['certificates']['Row'];

const Verify = () => {
  const navigate = useNavigate();
  const { certificateId: urlCertificateId } = useParams();
  const [searchParams] = useSearchParams();
  const { verifyCertificate } = useCertificates();
  
  const [certificateId, setCertificateId] = useState(urlCertificateId || searchParams.get('id') || '');
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [certSettings, setCertSettings] = useState<any>(null);

  // Fetch university settings when certificate is loaded
  useEffect(() => {
    if (certificate?.university_code) {
      fetchSettingsByUniversityCode(certificate.university_code).then(setCertSettings);
    } else {
      setCertSettings(null);
    }
  }, [certificate?.university_code]);

  // Auto-verify if certificateId is in URL
  useEffect(() => {
    if (urlCertificateId) {
      handleVerify(urlCertificateId);
    }
  }, [urlCertificateId]);

  const handleVerify = async (idToVerify?: string) => {
    const id = idToVerify || certificateId.trim();
    if (!id) {
      setError('Please enter a certificate ID');
      return;
    }

    setIsVerifying(true);
    setError(null);
    setHasSearched(true);
    setCertificate(null);

    try {
      const result = await verifyCertificate(id);
      setCertificate(result);
      
      if (!result) {
        setError('Certificate not found or invalid');
      } else {
        // Check if certificate is expired
        const expired = result.expiry_date ? new Date(result.expiry_date) < new Date() : false;
        setIsExpired(expired);
      }
    } catch (err) {
      setError('An error occurred while verifying the certificate');
      console.error('Verification error:', err);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleVerify();
  };

  const handleQRScan = (scannedData: string) => {
    // Extract certificate ID from scanned data if it's a URL
    const url = new URL(scannedData.includes('http') ? scannedData : `https://example.com/${scannedData}`);
    const certId = url.pathname.split('/').pop() || url.searchParams.get('id') || scannedData;
    
    setCertificateId(certId);
    handleVerify(certId);
    setShowScanner(false);
  };

  const handleDownloadPDF = async () => {
    if (!certificate) {
      toast.error('No certificate to download');
      return;
    }

    setIsGeneratingPDF(true);
    try {
      await generateCertificatePDF(certificate);
      toast.success('Certificate PDF downloaded successfully');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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
              <p className="text-xs text-muted-foreground">Certificate Verification</p>
            </div>
          </div>
        </div>
      </header>

      <div className="relative">
        {/* Background decoration (matches landing page) */}
        <div className="absolute inset-0 bg-grid-pattern pointer-events-none" />
        <div className="absolute top-10 -right-20 w-80 h-80 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-accent/5 blur-3xl pointer-events-none" />

        <div className="container mx-auto px-4 py-8 max-w-4xl relative">
        <PageTransition>
        {/* Verification Form */}
        <Card className="mb-8 gradient-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Verify Academic Certificate
            </CardTitle>
            <CardDescription>
              Enter a certificate ID or scan a QR code to verify academic credentials instantly
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="certificateId">Certificate ID</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="certificateId"
                      placeholder="e.g., EC-2024-ABC123"
                      value={certificateId}
                      onChange={(e) => setCertificateId(e.target.value)}
                      className="pl-9 h-11"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={isVerifying}
                    className="px-6 h-11"
                  >
                    {isVerifying ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                        Verifying
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4 mr-2" />
                        Verify
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Or</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowScanner(true)}
                >
                  <QrCode className="h-4 w-4 mr-2" />
                  Scan QR Code
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Error Message */}
        {error && (
          <Alert className="mb-8 border-destructive animate-slide-up">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Verification Result */}
        {hasSearched && !isVerifying && (
          <Card className="animate-scale-in overflow-hidden">
            {certificate ? (
              <>
                {/* Integrity Seal Banner */}
                {(() => {
                  const seal = certificate.status === 'revoked'
                    ? {
                        ring: 'bg-destructive/10 text-destructive ring-destructive/30',
                        band: 'from-destructive/10 to-destructive/5',
                        Icon: Ban,
                        title: 'Certificate Revoked',
                        subtitle: 'This credential has been revoked and is no longer valid.',
                      }
                    : isExpired
                    ? {
                        ring: 'bg-amber-500/10 text-amber-600 ring-amber-500/30',
                        band: 'from-amber-500/10 to-amber-500/5',
                        Icon: Clock,
                        title: 'Certificate Expired',
                        subtitle: 'This credential was genuine but has passed its expiry date.',
                      }
                    : {
                        ring: 'bg-success/10 text-success ring-success/30',
                        band: 'from-success/10 to-success/5',
                        Icon: CheckCircle,
                        title: 'Certificate Verified',
                        subtitle: 'This credential is authentic and matches the EduChain Ethiopia record.',
                      };
                  return (
                    <div className={`flex items-center gap-4 p-6 bg-gradient-to-r ${seal.band} border-b`}>
                      <div className={`p-3 rounded-full ring-4 ${seal.ring}`}>
                        <seal.Icon className="h-7 w-7" />
                      </div>
                      <div>
                        <h2 className="text-xl font-heading font-bold leading-tight">{seal.title}</h2>
                        <p className="text-sm text-muted-foreground mt-0.5">{seal.subtitle}</p>
                      </div>
                    </div>
                  );
                })()}

                <CardContent className="space-y-6 pt-6">
                  {/* Status Badge */}
                  <div className="flex flex-wrap gap-2">
                    {certificate.status === 'revoked' ? (
                      <Badge variant="destructive" className="text-sm">
                        <Ban className="h-3 w-3 mr-1" />
                        Revoked Certificate
                      </Badge>
                    ) : isExpired ? (
                      <Badge variant="outline" className="text-amber-600 border-amber-600 text-sm">
                        <Clock className="h-3 w-3 mr-1" />
                        Expired Certificate
                      </Badge>
                    ) : (
                      <Badge variant="default" className="text-sm">
                        Valid Certificate
                      </Badge>
                    )}
                  </div>

                {/* Certificate Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                        Student Information
                      </Label>
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{certificate.student_name}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Student ID: Protected for privacy
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                        Academic Information
                      </Label>
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center gap-2">
                          <GraduationCap className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{certificate.degree}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Field of Study: {certificate.field_of_study}
                        </div>
                        {certificate.gpa && (
                          <div className="text-sm text-muted-foreground">
                            GPA: {certificate.gpa}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                        Institution
                      </Label>
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center gap-2">
                          <School className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{certificate.university_name}</span>
                        </div>
                         <div className="text-sm text-muted-foreground">
                           University Code: Protected for privacy
                         </div>
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                        Certificate Details
                      </Label>
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{certificate.certificate_id}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          Graduation: {new Date(certificate.graduation_date).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Issued: {new Date(certificate.issued_at).toLocaleDateString()}
                        </div>
                        {certificate.expiry_date && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            Expires: {new Date(certificate.expiry_date).toLocaleDateString()}
                          </div>
                        )}
                        {certificate.status === 'revoked' && certificate.revocation_reason && (
                          <div className="flex items-center gap-2 text-sm text-destructive">
                            <Ban className="h-4 w-4" />
                            Revoked: {certificate.revocation_reason}
                          </div>
                        )}
                        {certificate.status === 'revoked' && certificate.revoked_at && (
                          <div className="text-sm text-destructive ml-6">
                            Revoked on: {new Date(certificate.revoked_at).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Additional Actions */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={handleDownloadPDF}
                    disabled={isGeneratingPDF}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    {isGeneratingPDF ? 'Generating PDF...' : 'Download PDF'}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setShowQRCode(true)}
                  >
                    <QrCode className="h-4 w-4 mr-2" />
                    View QR Code
                  </Button>
                </div>

                {/* Verification Footer */}
                <div className="text-center pt-4 border-t">
                  <p className="text-xs text-muted-foreground">
                    This certificate has been verified against the EduChain Ethiopia database.
                    <br />
                    Verified on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
                  </p>
                </div>
              </CardContent>
              </>
            ) : (
              <>
                {/* Not Found Banner */}
                <div className="flex items-center gap-4 p-6 bg-gradient-to-r from-destructive/10 to-destructive/5 border-b">
                  <div className="p-3 rounded-full ring-4 bg-destructive/10 text-destructive ring-destructive/30">
                    <XCircle className="h-7 w-7" />
                  </div>
                  <div>
                    <h2 className="text-xl font-heading font-bold leading-tight">Certificate Not Found</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      No matching credential exists in the EduChain Ethiopia database. Double-check the certificate ID.
                    </p>
                  </div>
                </div>
              </>
            )}
          </Card>
        )}

        {/* How it Works */}
        {!hasSearched && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>How Verification Works</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="p-3 rounded-full bg-primary/10 text-primary w-fit mx-auto mb-3">
                    <FileText className="h-6 w-6" />
                  </div>
                  <h3 className="font-medium mb-2">Enter Certificate ID</h3>
                  <p className="text-sm text-muted-foreground">
                    Input the unique certificate ID found on the academic document
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="p-3 rounded-full bg-primary/10 text-primary w-fit mx-auto mb-3">
                    <Search className="h-6 w-6" />
                  </div>
                  <h3 className="font-medium mb-2">Instant Verification</h3>
                  <p className="text-sm text-muted-foreground">
                    Our system checks the certificate against the secure database
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="p-3 rounded-full bg-primary/10 text-primary w-fit mx-auto mb-3">
                    <CheckCircle className="h-6 w-6" />
                  </div>
                  <h3 className="font-medium mb-2">Get Results</h3>
                  <p className="text-sm text-muted-foreground">
                    View complete certificate details and verification status
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        </PageTransition>

        {/* Hidden Certificate Template for PDF Generation */}
        {certificate && (
          <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
            <CertificateTemplate certificate={certificate} settings={certSettings || undefined} />
          </div>
        )}

        {/* QR Scanner Modal */}
        <QRScannerComponent
          isOpen={showScanner}
          onScan={handleQRScan}
          onClose={() => setShowScanner(false)}
        />

        {/* QR Code Display Modal */}
        {certificate && (
          <QRCodeDisplay
            isOpen={showQRCode}
            onClose={() => setShowQRCode(false)}
            certificateId={certificate.certificate_id}
            studentName={certificate.student_name}
          />
        )}
        </div>
      </div>
    </div>
  );
};

export default Verify;