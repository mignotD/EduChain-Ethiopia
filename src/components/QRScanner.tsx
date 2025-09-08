import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Camera, X, RotateCcw, Zap, ZapOff } from 'lucide-react';
import QrScanner from 'qr-scanner';

interface QRScannerProps {
  onScan: (result: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

const QRScannerComponent = ({ onScan, onClose, isOpen }: QRScannerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScanner | null>(null);
  const [hasCamera, setHasCamera] = useState<boolean | null>(null);
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !videoRef.current) return;

    const initScanner = async () => {
      try {
        // Check if camera is available
        const hasCamera = await QrScanner.hasCamera();
        setHasCamera(hasCamera);

        if (!hasCamera) {
          setError('No camera found on this device');
          return;
        }

        const scanner = new QrScanner(
          videoRef.current!,
          (result) => {
            setIsScanning(false);
            onScan(result.data);
            onClose();
          },
          {
            returnDetailedScanResult: true,
            highlightScanRegion: true,
            highlightCodeOutline: true,
          }
        );

        scannerRef.current = scanner;
        
        await scanner.start();
        setIsScanning(true);
        setError(null);
        
      } catch (err) {
        console.error('Scanner initialization error:', err);
        setError('Failed to access camera. Please ensure camera permissions are granted.');
        setHasCamera(false);
      }
    };

    initScanner();

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop();
        scannerRef.current.destroy();
        scannerRef.current = null;
      }
    };
  }, [isOpen, onScan, onClose]);

  const toggleFlash = async () => {
    if (scannerRef.current) {
      try {
        if (isFlashOn) {
          await scannerRef.current.turnFlashOff();
          setIsFlashOn(false);
        } else {
          await scannerRef.current.turnFlashOn();
          setIsFlashOn(true);
        }
      } catch (err) {
        console.error('Flash toggle error:', err);
      }
    }
  };

  const restartScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.start();
        setIsScanning(true);
        setError(null);
      } catch (err) {
        console.error('Scanner restart error:', err);
        setError('Failed to restart camera');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Scan QR Code
              </CardTitle>
              <CardDescription>
                Position the QR code within the camera view
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {hasCamera === false ? (
            <div className="text-center py-8">
              <div className="p-4 rounded-full bg-destructive/10 text-destructive w-fit mx-auto mb-4">
                <Camera className="h-8 w-8" />
              </div>
              <p className="text-sm text-muted-foreground">
                {error || 'Camera not available'}
              </p>
              <Button variant="outline" size="sm" onClick={onClose} className="mt-4">
                Close Scanner
              </Button>
            </div>
          ) : (
            <>
              {/* Camera View */}
              <div className="relative bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  className="w-full h-64 object-cover"
                  playsInline
                  muted
                />
                
                {/* Scanning Overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-48 border-2 border-primary rounded-lg relative">
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg"></div>
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg"></div>
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg"></div>
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg"></div>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="absolute top-2 left-2">
                  <Badge variant={isScanning ? "default" : "secondary"}>
                    {isScanning ? "Scanning..." : "Initializing..."}
                  </Badge>
                </div>
              </div>

              {/* Controls */}
              <div className="flex justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleFlash}
                  disabled={!isScanning}
                >
                  {isFlashOn ? (
                    <ZapOff className="h-4 w-4 mr-2" />
                  ) : (
                    <Zap className="h-4 w-4 mr-2" />
                  )}
                  {isFlashOn ? "Flash Off" : "Flash On"}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={restartScanner}
                  disabled={!hasCamera}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Restart
                </Button>
              </div>

              {error && (
                <div className="text-center text-sm text-destructive">
                  {error}
                </div>
              )}

              {/* Instructions */}
              <div className="text-center text-sm text-muted-foreground">
                <p>Hold your device steady and align the QR code within the frame</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default QRScannerComponent;