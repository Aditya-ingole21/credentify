// src/pages/VerifierDashboard.tsx
import React, { useState, useRef } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/button';
// import { Alert } from '../components/ui/alert'; // Using inline div for theme consistency
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { 
  Camera, 
  Upload, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Shield,
  FileText,
  Calendar,
  User,
  Award,
  Loader2, // Added Loader2 for verifying state visual consistency
  ExternalLink
} from 'lucide-react';
import jsQR from 'jsqr';
import { ethers } from 'ethers';
import { cn } from '../lib/utils'; // Assuming cn utility is imported

interface VerificationResult {
  isValid: boolean;
  certId?: string;
  studentName?: string;
  studentWallet?: string;
  courseName?: string;
  degree?: string;
  issueDate?: string;
  ipfsHash?: string;
  message?: string;
}

export const VerifierDashboard: React.FC = () => {
  const { contract } = useWeb3();
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [scanning, setScanning] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

    // --- THEME ACCENT COLORS (Coral/Orange) ---
    const ACCENT_GRADIENT = "bg-gradient-to-r from-red-500 to-orange-500";
    const ACCENT_TEXT_COLOR = "text-red-600";
    const ACCENT_HOVER_COLOR = "hover:bg-red-600";
    const ACCENT_SCAN_FRAME = "border-red-500";


  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // ... (Logic remains unchanged) ...
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const image = new Image();
      image.onload = async () => {
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(image, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          
          if (code) {
            await verifyQRData(code.data);
          } else {
            setError('No QR code found in the image');
          }
        }
      };
      image.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const startCamera = async () => {
    // ... (Logic remains unchanged) ...
    setScanning(true);
    setError('');
    setVerificationResult(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        requestAnimationFrame(scanQRCode);
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Failed to access camera. Please upload QR code image instead.');
      setScanning(false);
    }
  };

  const stopCamera = () => {
    // ... (Logic remains unchanged) ...
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setScanning(false);
  };

  const scanQRCode = () => {
    // ... (Logic remains unchanged) ...
    if (!scanning || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code) {
        stopCamera();
        verifyQRData(code.data);
        return;
      }
    }

    requestAnimationFrame(scanQRCode);
  };

  const verifyQRData = async (qrDataString: string) => {
    // ... (Logic remains unchanged) ...
    if (!contract) {
      setError('Please connect to the blockchain first');
      return;
    }

    setVerifying(true);
    setError('');
    setVerificationResult(null);

    try {
      const qrData = JSON.parse(qrDataString);
      const { certId, studentWallet, certHash, signature } = qrData;

      // Recover signer from signature (Logic kept the same)
      const recoveredAddress = ethers.verifyMessage(ethers.getBytes(certHash), signature);

      // Check if recovered address has UNIVERSITY_ROLE (Logic kept the same)
      const universityRole = ethers.keccak256(ethers.toUtf8Bytes("UNIVERSITY_ROLE"));
      const hasUniversityRole = await contract.hasRole(universityRole, recoveredAddress);

      if (!hasUniversityRole) {
        setVerificationResult({
          isValid: false,
          message: 'Invalid signature: Signer is not an authorized university',
        });
        return;
      }

      // Get certificate from blockchain (Logic kept the same)
      const cert = await contract.certificates(certId);

      // Verify certificate data (Logic kept the same)
      const isValid = await contract.verifyCertificate(
        certId,
        cert.studentName,
        studentWallet,
        cert.courseName,
        cert.degree,
        cert.ipfsHash
      );

      if (isValid) {
        setVerificationResult({
          isValid: true,
          certId: cert.id.toString(),
          studentName: cert.studentName,
          studentWallet: cert.studentWallet,
          courseName: cert.courseName,
          degree: cert.degree,
          issueDate: new Date(Number(cert.issueDate) * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
          ipfsHash: cert.ipfsHash,
          message: 'Certificate is valid and verified',
        });
      } else {
        setVerificationResult({
          isValid: false,
          message: 'Certificate data does not match blockchain records',
        });
      }
    } catch (err: any) {
      console.error('Verification error:', err);
      setError(err.message || 'Failed to verify certificate');
    } finally {
      setVerifying(false);
    }
  };

  return (
   
    <div className="min-h-screen pt-24 pb-12 px-4 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          {/* Header: Accent Color */}
          <h1 className={cn("text-4xl font-bold mb-2 bg-clip-text text-transparent", ACCENT_GRADIENT)}>
            Verify Certificate
          </h1>
          <p className="text-gray-600">
            Scan or upload a QR code to verify academic credentials
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Card: Scanner */}
          <Card className='shadow-xl border-gray-200'>
            <CardHeader>
              <CardTitle className="flex items-center text-gray-900">
                {/* Icon: Accent Color */}
                <Camera className={cn("w-6 h-6 mr-2", ACCENT_TEXT_COLOR)} />
                QR Code Scanner
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
                {/* Initial State / Upload */}
              {!scanning ? (
                <div className="space-y-4">
                  <Button 
                        onClick={startCamera} 
                        className={cn("w-full text-white", ACCENT_GRADIENT, ACCENT_HOVER_COLOR)} 
                        size="lg"
                    >
                    <Camera className="w-5 h-5 mr-2" />
                    Scan with Camera
                  </Button>

                  {/* OR Divider */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">or</span>
                    </div>
                  </div>

                  {/* File Upload Button */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="w-full text-gray-800 border-gray-300 hover:bg-gray-100"
                    size="lg"
                  >
                    <Upload className="w-5 h-5 mr-2" />
                    Upload QR Image
                  </Button>
                </div>
              ) : (

                <div className="space-y-4">
                  <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden border border-gray-700">
                    <video
                      ref={videoRef}
                      className="w-full h-full object-cover"
                      playsInline
                    />
                    {/* Scanning Frame (Accent Color) */}
                    <div className={cn("absolute inset-0 m-12 rounded-lg pointer-events-none", `border-4 ${ACCENT_SCAN_FRAME}`)}>
                      {/* Corner accents matching the Coral theme */}
                      <div className={cn("absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4", ACCENT_SCAN_FRAME)}></div>
                      <div className={cn("absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4", ACCENT_SCAN_FRAME)}></div>
                      <div className={cn("absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4", ACCENT_SCAN_FRAME)}></div>
                      <div className={cn("absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4", ACCENT_SCAN_FRAME)}></div>
                    </div>
                  </div>
                  <canvas ref={canvasRef} className="hidden" />
                  <Button onClick={stopCamera} variant="outline" className="w-full text-gray-800 border-gray-300 hover:bg-gray-100">
                    Stop Scanning
                  </Button>
                  <p className="text-sm text-center text-gray-500">
                    Position QR code within the frame
                  </p>
                </div>
              )}

              {/* Verifying State */}
              {verifying && (
                <div className="p-4 bg-gray-100 border border-gray-300 rounded-lg text-gray-800 flex items-center shadow-sm">
                  <Loader2 className="w-5 h-5 mr-2 animate-spin text-gray-500" />
                  <p className='font-medium'>Verifying certificate on blockchain...</p>
                </div>
              )}

              {/* Error Alert */}
              {error && (
                <div className="p-4 bg-red-100 border border-red-300 rounded-lg text-red-800 flex items-center shadow-sm">
                  <XCircle className="w-5 h-5 mr-2" />
                  <p className='font-medium'>{error}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Right Card: Verification Result */}
          <Card className='shadow-xl border-gray-200'>
            <CardHeader>
              <CardTitle className="flex items-center text-gray-900">
                {/* Icon: Accent Color */}
                <Shield className={cn("w-6 h-6 mr-2", ACCENT_TEXT_COLOR)} />
                Verification Result
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!verificationResult ? (
                <div className="py-12 text-center">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">
                    Scan or upload a QR code to see verification results
                  </p>
                </div>
              ) : verificationResult.isValid ? (
                <div className="space-y-6">
                  {/* Success Alert (Green) */}
                  <div className="p-4 bg-green-100 border border-green-300 rounded-lg text-green-800 flex items-center shadow-sm">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    <p className='font-medium'>{verificationResult.message}</p>
                  </div>

                  <div className="space-y-4">
                    {/* Data Blocks - Use light gray BG */}
                    <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <Award className={cn("w-5 h-5 mt-1", ACCENT_TEXT_COLOR)} />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-700">Certificate ID</p>
                        <p className={cn("text-lg font-mono text-gray-900", ACCENT_TEXT_COLOR)}>
                          #{verificationResult.certId}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <User className={cn("w-5 h-5 mt-1", ACCENT_TEXT_COLOR)} />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-700">Student Name</p>
                        <p className="text-lg text-gray-900">
                          {verificationResult.studentName}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <FileText className={cn("w-5 h-5 mt-1", ACCENT_TEXT_COLOR)} />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-700">Course & Degree</p>
                        <p className="text-gray-900">{verificationResult.courseName}</p>
                        <p className="text-sm text-gray-600">{verificationResult.degree}</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <Calendar className={cn("w-5 h-5 mt-1", ACCENT_TEXT_COLOR)} />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-700">Issue Date</p>
                        <p className="text-gray-900">{verificationResult.issueDate}</p>
                      </div>
                    </div>

                        {/* Button for IPFS Document */}
                    <Button
                      onClick={() => {
                        if (!verificationResult.ipfsHash) {
                          alert('No document found for this certificate.');
                          return;
                        }
                        window.open("https://dweb.link/ipfs/" + verificationResult.ipfsHash, "_blank");
                      }}
                      variant="outline"
                      className="w-full text-gray-800 border-gray-300 hover:bg-gray-100"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View Certificate Document
                    </Button>
                  </div>
                </div>
              ) : (
              
              
                <div className="space-y-6">
                  {/* Error Alert (Red) */}
                  <div className="p-4 bg-red-100 border border-red-300 rounded-lg text-red-800 flex items-center shadow-sm">
                    <XCircle className="w-5 h-5 mr-2" />
                    <p className='font-medium'>{verificationResult.message}</p>
                  </div>

                  <div className="py-8 text-center">
                    <XCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
                    <h3 className="text-xl font-semibold mb-2 text-gray-900">
                      Invalid Certificate
                    </h3>
                    <p className="text-gray-600">
                      This certificate could not be verified. It may be forged or tampered with.
                    </p>
                  </div>
                </div>
              )}

              {verificationResult && (
              
                <Button
                  onClick={() => setVerificationResult(null)}
                  variant="outline"
                  className="w-full mt-6 text-gray-800 border-gray-300 hover:bg-gray-100"
                >
                  Verify Another Certificate
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
