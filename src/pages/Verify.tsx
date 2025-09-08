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
  ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCertificates } from '@/hooks/useCertificates';
import { Database } from '@/integrations/supabase/types';
import QRScannerComponent from '@/components/QRScanner';
import { CertificateTemplate } from '@/components/CertificateTemplate';
import { generateCertificatePDF } from '@/utils/pdfGenerator';
import { QRCodeDisplay } from '@/components/QRCodeDisplay';
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
  const [showScanner, setShowScanner] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

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

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Verification Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
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
                  <Input
                    id="certificateId"
                    placeholder="e.g., EC-2024-ABC123"
                    value={certificateId}
                    onChange={(e) => setCertificateId(e.target.value)}
                    className="flex-1"
                  />
                  <Button 
                    type="submit" 
                    disabled={isVerifying}
                    className="px-6"
                  >
                    {isVerifying ? (
                      <>Verifying...</>
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
          <Alert className="mb-8 border-destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Verification Result */}
        {hasSearched && !isVerifying && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {certificate ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-success" />
                    Certificate Verified
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-destructive" />
                    Certificate Not Found
                  </>
                )}
              </CardTitle>
            </CardHeader>
            
            {certificate && (
              <CardContent className="space-y-6">
                {/* Status Badge */}
                <div>
                  <Badge 
                    variant={certificate.status === 'active' ? 'default' : 'secondary'}
                    className="text-sm"
                  >
                    {certificate.status === 'active' ? 'Valid Certificate' : 'Invalid Certificate'}
                  </Badge>
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

        {/* Hidden Certificate Template for PDF Generation */}
        {certificate && (
          <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
            <CertificateTemplate certificate={certificate} />
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
  );
};

export default Verify;