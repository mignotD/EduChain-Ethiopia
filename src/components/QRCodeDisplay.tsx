import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Share2, Copy, QrCode as QrCodeIcon } from 'lucide-react';
import { toast } from 'sonner';

interface QRCodeDisplayProps {
  isOpen: boolean;
  onClose: () => void;
  certificateId: string;
  studentName?: string;
}

export const QRCodeDisplay = ({ isOpen, onClose, certificateId, studentName }: QRCodeDisplayProps) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (isOpen && certificateId) {
      generateQRCode();
    }
  }, [isOpen, certificateId]);

  const generateQRCode = async () => {
    setIsGenerating(true);
    try {
      // Create verification URL
      const verificationUrl = `${window.location.origin}/verify/${certificateId}`;
      
      // Generate QR code with high quality settings
      const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
        width: 400,
        margin: 2,
        color: {
          dark: '#1f2937', // Dark gray
          light: '#ffffff' // White
        },
        errorCorrectionLevel: 'H' // High error correction
      });
      
      setQrCodeDataUrl(qrCodeDataUrl);
      
      // Also draw to canvas for download purposes
      if (canvasRef.current) {
        await QRCode.toCanvas(canvasRef.current, verificationUrl, {
          width: 400,
          margin: 2,
          color: {
            dark: '#1f2937',
            light: '#ffffff'
          },
          errorCorrectionLevel: 'H'
        });
      }
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast.error('Failed to generate QR code');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadQR = () => {
    if (qrCodeDataUrl) {
      const link = document.createElement('a');
      link.download = `QR_Code_${certificateId}_${studentName?.replace(/\s+/g, '_') || 'Certificate'}.png`;
      link.href = qrCodeDataUrl;
      link.click();
      toast.success('QR code downloaded successfully');
    }
  };

  const handleCopyLink = async () => {
    const verificationUrl = `${window.location.origin}/verify/${certificateId}`;
    try {
      await navigator.clipboard.writeText(verificationUrl);
      toast.success('Verification link copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const handleShare = async () => {
    const verificationUrl = `${window.location.origin}/verify/${certificateId}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Certificate Verification',
          text: `Verify certificate for ${studentName || 'student'}`,
          url: verificationUrl,
        });
      } catch (error) {
        // User cancelled or error occurred
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCodeIcon className="h-5 w-5" />
            Certificate QR Code
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* QR Code Display */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-center">
                {studentName ? `${studentName}'s Certificate` : 'Certificate Verification'}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4">
              {isGenerating ? (
                <div className="w-64 h-64 flex items-center justify-center border-2 border-dashed border-muted-foreground rounded-lg">
                  <div className="text-center">
                    <QrCodeIcon className="h-12 w-12 mx-auto mb-2 text-muted-foreground animate-pulse" />
                    <p className="text-sm text-muted-foreground">Generating QR Code...</p>
                  </div>
                </div>
              ) : qrCodeDataUrl ? (
                <div className="relative">
                  <img 
                    src={qrCodeDataUrl} 
                    alt="Certificate QR Code"
                    className="w-64 h-64 border rounded-lg shadow-sm"
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <div className="bg-black/50 rounded-lg p-2">
                      <p className="text-white text-xs">Scan to verify certificate</p>
                    </div>
                  </div>
                </div>
              ) : null}
              
              {/* Certificate ID */}
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Certificate ID</p>
                <p className="font-mono text-sm font-medium">{certificateId}</p>
              </div>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <p className="text-sm font-medium">How to use this QR code:</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Scan with any QR code reader</li>
                  <li>• Opens certificate verification page</li>
                  <li>• Shows authentic certificate details</li>
                  <li>• Verifies against blockchain database</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col space-y-2">
            <Button 
              onClick={handleDownloadQR} 
              className="w-full"
              disabled={!qrCodeDataUrl}
            >
              <Download className="h-4 w-4 mr-2" />
              Download QR Code
            </Button>
            
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant="outline" 
                onClick={handleShare}
                className="flex-1"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button 
                variant="outline" 
                onClick={handleCopyLink}
                className="flex-1"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Link
              </Button>
            </div>
          </div>
        </div>

        {/* Hidden canvas for download purposes */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </DialogContent>
    </Dialog>
  );
};