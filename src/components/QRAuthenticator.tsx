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
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Modern background elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5"></div>
      <div className="absolute top-10 left-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl animate-float"></div>
      <div className="absolute bottom-10 right-10 w-40 h-40 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
      
      <div className="w-full max-w-2xl space-y-8 relative z-10 animate-fade-up">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-4 animate-float">
            <Scan className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">
            QR Authenticator
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl font-medium max-w-md mx-auto">
            Verify the authenticity of brand QR codes with confidence
          </p>
        </div>

        <Card className="glass-card border-0 modern-shadow">
          <CardHeader className="pb-6">
            <CardTitle className="text-2xl font-semibold text-center">Brand Verification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Brand Selection */}
            <div className="space-y-3">
              <Label htmlFor="brand-select" className="text-base font-medium">Select Brand</Label>
              <Select onValueChange={setSelectedBrand} value={selectedBrand}>
                <SelectTrigger className="w-full h-12 border-2 hover:border-primary/50 transition-all duration-200">
                  <SelectValue placeholder="Choose a brand to verify" />
                </SelectTrigger>
                <SelectContent className="glass-card border-0 shadow-2xl">
                  {brands.map((brand) => (
                    <SelectItem 
                      key={brand.name} 
                      value={brand.name}
                      className="hover:bg-primary/10 transition-colors duration-200"
                    >
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* QR Code Preview */}
            {(imagePreview || qrPreview) && (
              <div className="space-y-3 animate-fade-up">
                <Label className="text-base font-medium">QR Code Preview</Label>
                <div className="glass-card border-2 border-dashed border-primary/30 rounded-xl p-6">
                  {imagePreview ? (
                    <div className="text-center">
                      <img 
                        src={imagePreview} 
                        alt="Uploaded QR code" 
                        className="max-w-full max-h-52 mx-auto rounded-xl shadow-lg"
                      />
                      <p className="text-sm text-muted-foreground mt-3 font-medium">Uploaded QR Code</p>
                    </div>
                  ) : qrPreview ? (
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-28 h-28 bg-primary/15 rounded-2xl border-2 border-dashed border-primary/50 animate-pulse">
                        <Scan className="w-10 h-10 text-primary" />
                      </div>
                      <p className="text-sm text-muted-foreground mt-3 font-medium">
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
                className="w-full h-14 text-base font-medium border-2 hover:border-primary/50 hover:bg-primary/5 transition-all duration-200"
              >
                <Camera className="w-5 h-5 mr-3" />
                {isScanning ? 'Stop Camera' : 'Scan with Camera'}
              </Button>
              
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="w-full h-14 text-base font-medium border-2 hover:border-primary/50 hover:bg-primary/5 transition-all duration-200"
              >
                <Upload className="w-5 h-5 mr-3" />
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
              <div className="relative animate-fade-up">
                <video
                  ref={videoRef}
                  className="w-full max-w-sm mx-auto rounded-xl border-2 border-primary/30 shadow-lg"
                  playsInline
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="border-2 border-primary border-dashed rounded-xl w-48 h-48 flex items-center justify-center bg-black/10 backdrop-blur-sm">
                    <Scan className="w-10 h-10 text-primary animate-pulse" />
                  </div>
                </div>
              </div>
            )}

            {/* Check Button */}
            <Button
              onClick={checkAuthenticity}
              className="w-full h-14 text-base font-semibold gradient-primary hover:shadow-lg transition-all duration-300 disabled:opacity-50"
              disabled={!selectedBrand || !inputUrl}
            >
              <CheckCircle className="w-5 h-5 mr-3" />
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
                className="w-full h-12 font-medium hover:bg-muted/50 transition-all duration-200"
              >
                Clear QR Code
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        {authResult && (
          <Card className={`glass-card border-0 modern-shadow animate-fade-up ${
            authResult.isValid 
              ? 'bg-success/5 border-success/20' 
              : 'bg-destructive/5 border-destructive/20'
          }`}>
            <CardContent className="pt-8 pb-8">
              <div className="flex items-center justify-center space-x-4">
                <div className={`p-3 rounded-full ${
                  authResult.isValid ? 'bg-success/20' : 'bg-destructive/20'
                }`}>
                  {authResult.isValid ? (
                    <CheckCircle className="w-8 h-8 text-success" />
                  ) : (
                    <XCircle className="w-8 h-8 text-destructive" />
                  )}
                </div>
                <div className="text-center">
                  <h3 className={`text-2xl font-bold ${
                    authResult.isValid ? 'text-success' : 'text-destructive'
                  }`}>
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