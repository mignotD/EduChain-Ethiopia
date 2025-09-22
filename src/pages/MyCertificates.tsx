import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCertificates } from '@/hooks/useCertificates';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  GraduationCap, 
  FileText, 
  Shield, 
  Search, 
  Download,
  QrCode,
  Calendar,
  User,
  School,
  ArrowLeft,
  Filter,
  Eye,
  LogOut,
  Ban,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { PageTransition } from '@/components/PageTransition';
import { Database } from '@/integrations/supabase/types';
import { QRCodeDisplay } from '@/components/QRCodeDisplay';
import { generateCertificatePDF } from '@/utils/pdfGenerator';
import { CertificateTemplate } from '@/components/CertificateTemplate';
import { useUniversitySettings } from '@/hooks/useUniversitySettings';
import { toast } from 'sonner';
import { format } from 'date-fns';

type Certificate = Database['public']['Tables']['certificates']['Row'];

const MyCertificates = () => {
  const { user, profile, signOut, loading: authLoading } = useAuth();
  const { certificates, loading: certsLoading, fetchCertificates, revokeCertificate, getEffectiveStatus, isCertificateExpired } = useCertificates();
  const { settings } = useUniversitySettings();
  const navigate = useNavigate();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'revoked' | 'expired'>('all');
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);
  const [certificateToRevoke, setCertificateToRevoke] = useState<Certificate | null>(null);
  const [revokeReason, setRevokeReason] = useState('');
  const [isRevoking, setIsRevoking] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && profile) {
      fetchCertificates();
    }
  }, [user, profile, fetchCertificates]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  const filteredCertificates = certificates.filter(cert => {
    const matchesSearch = searchQuery === '' || 
      cert.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.certificate_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.student_id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const effectiveStatus = getEffectiveStatus(cert);
    const matchesStatus = statusFilter === 'all' || effectiveStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleViewQRCode = (certificate: Certificate) => {
    setSelectedCertificate(certificate);
    setShowQRCode(true);
  };

  const handleDownloadPDF = async (certificate: Certificate) => {
    setIsGeneratingPDF(true);
    setSelectedCertificate(certificate);
    
    try {
      // Wait a bit for the template to render
      await new Promise(resolve => setTimeout(resolve, 100));
      await generateCertificatePDF(certificate);
      toast.success('Certificate PDF downloaded successfully');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF');
    } finally {
      setIsGeneratingPDF(false);
      setSelectedCertificate(null);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-primary text-primary-foreground">
                <GraduationCap className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold">My Certificates</h1>
                <p className="text-sm text-muted-foreground">
                  {profile.role === 'super_admin' ? 'All system certificates' : `${profile.university_name} certificates`}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <div className="text-right">
              <p className="text-sm font-medium">{profile.full_name}</p>
              <Badge variant={profile.role === 'super_admin' ? 'default' : 'secondary'}>
                {profile.role === 'super_admin' ? 'Super Admin' : 'University Admin'}
              </Badge>
            </div>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <PageTransition>
        {/* Search and Filter Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search & Filter Certificates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search by student name, certificate ID, or student ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <select 
                  value={statusFilter} 
                  onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                  className="border rounded px-3 py-2 text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                  <option value="revoked">Revoked</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Certificates</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{certificates.length}</div>
              <p className="text-xs text-muted-foreground">
                {profile.role === 'super_admin' ? 'System-wide' : 'Your university'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <Shield className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                {certificates.filter(c => c.status === 'active' && !isCertificateExpired(c)).length}
              </div>
              <p className="text-xs text-muted-foreground">Valid credentials</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expired</CardTitle>
              <Clock className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">
                {certificates.filter(c => c.status === 'active' && isCertificateExpired(c)).length}
              </div>
              <p className="text-xs text-muted-foreground">Past expiry date</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {certificates.filter(c => {
                  const issueDate = new Date(c.issued_at);
                  const now = new Date();
                  return issueDate.getMonth() === now.getMonth() && 
                         issueDate.getFullYear() === now.getFullYear();
                }).length}
              </div>
              <p className="text-xs text-muted-foreground">Issued this month</p>
            </CardContent>
          </Card>
        </div>

        {/* Certificates List */}
        <Card>
          <CardHeader>
            <CardTitle>Certificate Records</CardTitle>
            <CardDescription>
              {filteredCertificates.length} of {certificates.length} certificates
            </CardDescription>
          </CardHeader>
          <CardContent>
            {certsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading certificates...</p>
              </div>
            ) : filteredCertificates.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">No certificates found</p>
                <p className="text-sm">
                  {searchQuery || statusFilter !== 'all' 
                    ? 'Try adjusting your search or filter criteria'
                    : 'Start by issuing your first certificate'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredCertificates.map((certificate) => (
                  <Card key={certificate.id} className={`border-l-4 ${getEffectiveStatus(certificate) === 'active' ? 'border-l-primary' : getEffectiveStatus(certificate) === 'expired' ? 'border-l-amber-500' : 'border-l-destructive'}`}>
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                        {/* Student Info */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{certificate.student_name}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            ID: {certificate.student_id}
                          </p>
                          {getEffectiveStatus(certificate) === 'expired' ? (
                            <Badge variant="outline" className="text-amber-600 border-amber-600">
                              <Clock className="h-3 w-3 mr-1" />
                              Expired
                            </Badge>
                          ) : (
                            <Badge variant={certificate.status === 'active' ? 'default' : 'destructive'}>
                              {certificate.status === 'active' ? 'Active' : 'Revoked'}
                            </Badge>
                          )}
                        </div>

                        {/* Academic Info */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <GraduationCap className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{certificate.degree}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {certificate.field_of_study}
                          </p>
                          {certificate.gpa && (
                            <p className="text-sm text-muted-foreground">
                              GPA: {certificate.gpa}
                            </p>
                          )}
                          {certificate.expiry_date && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Expires: {format(new Date(certificate.expiry_date), 'PP')}
                            </p>
                          )}
                          {certificate.status === 'revoked' && certificate.revocation_reason && (
                            <p className="text-sm text-destructive flex items-center gap-1">
                              <Ban className="h-3 w-3" />
                              {certificate.revocation_reason}
                            </p>
                          )}
                        </div>

                        {/* Institution Info */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <School className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{certificate.university_name}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Code: {certificate.university_code}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Cert ID: {certificate.certificate_id}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/verify/${certificate.certificate_id}`)}
                            className="w-full"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewQRCode(certificate)}
                            className="w-full"
                          >
                            <QrCode className="h-4 w-4 mr-2" />
                            QR Code
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadPDF(certificate)}
                            disabled={isGeneratingPDF}
                            className="w-full"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            {isGeneratingPDF ? 'Generating...' : 'Download PDF'}
                          </Button>
                          {certificate.status === 'active' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setCertificateToRevoke(certificate);
                                setRevokeReason('');
                                setShowRevokeDialog(true);
                              }}
                              className="w-full text-destructive border-destructive hover:bg-destructive/10"
                            >
                              <Ban className="h-4 w-4 mr-2" />
                              Revoke
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Revoke Confirmation Dialog */}
        <AlertDialog open={showRevokeDialog} onOpenChange={setShowRevokeDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                <Ban className="h-5 w-5" />
                Revoke Certificate
              </AlertDialogTitle>
              <AlertDialogDescription>
                This will invalidate the certificate for <strong>{certificateToRevoke?.student_name}</strong> 
                ({certificateToRevoke?.certificate_id}). This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Reason for Revocation *</label>
                <Textarea
                  placeholder="e.g., Academic misconduct, administrative error, degree rescinded..."
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isRevoking}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                disabled={!revokeReason.trim() || isRevoking}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={async () => {
                  if (!certificateToRevoke || !revokeReason.trim()) return;
                  setIsRevoking(true);
                  try {
                    await revokeCertificate(certificateToRevoke.certificate_id, revokeReason.trim());
                    toast.success('Certificate revoked successfully');
                    setShowRevokeDialog(false);
                    setCertificateToRevoke(null);
                  } catch (err) {
                    toast.error('Failed to revoke certificate');
                  } finally {
                    setIsRevoking(false);
                  }
                }}
              >
                {isRevoking ? 'Revoking...' : 'Confirm Revocation'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Hidden Certificate Template for PDF Generation */}
        {selectedCertificate && (
          <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
            <CertificateTemplate certificate={selectedCertificate} settings={settings || undefined} />
          </div>
        )}

        {/* QR Code Display Modal */}
        {selectedCertificate && (
          <QRCodeDisplay
            isOpen={showQRCode}
            onClose={() => {
              setShowQRCode(false);
              setSelectedCertificate(null);
            }}
            certificateId={selectedCertificate.certificate_id}
            studentName={selectedCertificate.student_name}
          />
        )}
      </PageTransition>
      </div>
    </div>
  );
};

export default MyCertificates;