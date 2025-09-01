import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, Upload, CheckCircle, XCircle, Scan } from 'lucide-react';
import QrScanner from 'qr-scanner';

const brands = [
  { name: "Nike", domain: "nike.com" },
  { name: "Adidas", domain: "adidas.com" },
  { name: "Puma", domain: "puma.com" },
  { name: "US Polo", domain: "uspolo.org" },
  { name: "Levi's", domain: "levi.com" },
  { name: "Zara", domain: "zara.com" },
  { name: "H&M", domain: "hm.com" },
  { name: "Louis Vuitton", domain: "louisvuitton.com" },
  { name: "Gucci", domain: "gucci.com" },
  { name: "Under Armour", domain: "underarmour.com" }
];

export const QRAuthenticator = () => {
  const [selectedBrand, setSelectedBrand] = useState('');
  const [inputUrl, setInputUrl] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [authResult, setAuthResult] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [qrPreview, setQrPreview] = useState(null);
  const videoRef = useRef(null);
  const qrScannerRef = useRef(null);
  const fileInputRef = useRef(null);

  const extractDomain = (url) => {
    try {
      const parsedUrl = new URL(url.startsWith('http') ? url : `https://${url}`);
      return parsedUrl.hostname.replace('www.', '');
    } catch (error) {
      return null;
    }
  };

  const checkAuthenticity = () => {
    if (!selectedBrand || !inputUrl) {
      alert('Please select a brand and scan/upload a QR code');
      return;
    }

    const brand = brands.find(b => b.name === selectedBrand);
    const urlDomain = extractDomain(inputUrl);

    if (!urlDomain) {
      setAuthResult({ isValid: false, message: 'Invalid URL format' });
      return;
    }

    const isAuthentic = urlDomain === brand.domain;
    setAuthResult({
      isValid: isAuthentic,
      message: isAuthentic ? 'Authenticated' : 'Unauthenticated',
      brand: brand.name,
      expectedDomain: brand.domain,
      actualDomain: urlDomain
    });
  };

  const startWebcamScan = async () => {
    try {
      setIsScanning(true);
      setAuthResult(null);
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();

        qrScannerRef.current = new QrScanner(
          videoRef.current,
          (result) => {
            setInputUrl(result.data);
            setScanResult(result.data);
            setQrPreview({ type: 'camera', data: result.data });
            setImagePreview(null);
            stopScanning();
          },
          {
            highlightScanRegion: true,
            highlightCodeOutline: true,
          }
        );

        await qrScannerRef.current.start();
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Could not access camera. Please check permissions.');
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current.destroy();
    }
    
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    
    setIsScanning(false);
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Create image preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);

    try {
      const result = await QrScanner.scanImage(file);
      setInputUrl(result);
      setScanResult(result);
      setQrPreview({ type: 'upload', data: result });
    } catch (error) {
      console.error('Error scanning QR code from image:', error);
      alert('Could not detect QR code in the uploaded image');
      setImagePreview(null);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">QR Code Authenticator</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Verify the authenticity of brand QR codes
          </p>
        </div>

        <Card className="border shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">Brand Verification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Brand Selection */}
            <div className="space-y-2">
              <Label htmlFor="brand-select">Select Brand</Label>
              <Select onValueChange={setSelectedBrand} value={selectedBrand}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a brand to verify" />
                </SelectTrigger>
                <SelectContent className="bg-popover border shadow-lg">
                  {brands.map((brand) => (
                    <SelectItem key={brand.name} value={brand.name}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* QR Code Preview */}
            {(imagePreview || qrPreview) && (
              <div className="space-y-2">
                <Label>QR Code Preview</Label>
                <div className="border rounded-lg p-4 bg-muted/50">
                  {imagePreview ? (
                    <div className="text-center">
                      <img 
                        src={imagePreview} 
                        alt="Uploaded QR code" 
                        className="max-w-full max-h-48 mx-auto rounded-lg border"
                      />
                      <p className="text-sm text-muted-foreground mt-2">Uploaded QR Code</p>
                    </div>
                  ) : qrPreview ? (
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-24 h-24 bg-primary/10 rounded-lg border-2 border-dashed border-primary">
                        <Scan className="w-8 h-8 text-primary" />
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        {qrPreview.type === 'camera' ? 'Scanned with Camera' : 'QR Code Detected'}
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>
            )}

            {/* QR Scanning Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={isScanning ? stopScanning : startWebcamScan}
                variant="outline"
                className="w-full"
              >
                <Camera className="w-4 h-4 mr-2" />
                {isScanning ? 'Stop Camera' : 'Scan with Camera'}
              </Button>
              
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="w-full"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload QR Image
              </Button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* Camera Preview */}
            {isScanning && (
              <div className="relative">
                <video
                  ref={videoRef}
                  className="w-full max-w-sm mx-auto rounded-lg border"
                  playsInline
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="border-2 border-primary border-dashed rounded-lg w-48 h-48 flex items-center justify-center">
                    <Scan className="w-8 h-8 text-primary animate-pulse" />
                  </div>
                </div>
              </div>
            )}

            {/* Check Button */}
            <Button
              onClick={checkAuthenticity}
              className="w-full"
              disabled={!selectedBrand || !inputUrl}
            >
              Check Authenticity
            </Button>
            
            {/* Clear Button */}
            {(imagePreview || qrPreview || inputUrl) && (
              <Button
                onClick={() => {
                  setImagePreview(null);
                  setQrPreview(null);
                  setInputUrl('');
                  setScanResult(null);
                  setAuthResult(null);
                }}
                variant="outline"
                className="w-full"
              >
                Clear QR Code
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        {authResult && (
          <Card className={`border-2 ${authResult.isValid ? 'border-success bg-success/5' : 'border-destructive bg-destructive/5'}`}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-center space-x-3">
                {authResult.isValid ? (
                  <CheckCircle className="w-8 h-8 text-success" />
                ) : (
                  <XCircle className="w-8 h-8 text-destructive" />
                )}
                <div className="text-center">
                  <h3 className={`text-xl font-bold ${authResult.isValid ? 'text-success' : 'text-destructive'}`}>
                    {authResult.isValid ? 'Authenticated' : 'Unauthenticated / fake product'}
                  </h3>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};