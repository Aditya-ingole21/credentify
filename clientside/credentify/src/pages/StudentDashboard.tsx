// src/pages/StudentDashboard.tsx
import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/button';
import { Alert } from '../components/ui/alert';
import { Award, Download, ExternalLink, FileText, Calendar, AlertCircle, Loader2, QrCode } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { ethers } from 'ethers';
import { cn } from '../lib/utils'; // Assuming cn utility is imported

interface Certificate {
  id: string;
  studentName: string;
  studentWallet: string;
  courseName: string;
  degree: string;
  issueDate: string;
  ipfsHash: string;
  dataHash: string;
  qrData?: string;
}

export const StudentDashboard: React.FC = () => {
  const { account, contract, signer } = useWeb3();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
  const [generatingQR, setGeneratingQR] = useState(false);

  // --- THEME ACCENT COLORS ---
  const ACCENT_GRADIENT = "bg-gradient-to-r from-red-500 to-orange-500";
  const ACCENT_TEXT_COLOR = "text-red-600";
  const ACCENT_HOVER_COLOR = "hover:bg-red-500";
  const ACCENT_BG_COLOR = "bg-red-50";


  useEffect(() => {
    if (account && contract) {
      loadCertificates();
    }
  }, [account, contract]);

  const loadCertificates = async () => {
    // ... (Blockchain logic remains unchanged) ...
    if (!contract || !account) return;

    setLoading(true);
    try {
      const certIds = await contract.getStudentCertificateIds(account);

      const certs: Certificate[] = [];
      for (const id of certIds) {
        const cert = await contract.certificates(id);
        certs.push({
          id: cert.id.toString(),
          studentName: cert.studentName,
          studentWallet: cert.studentWallet,
          courseName: cert.courseName,
          degree: cert.degree,
          // IMPROVED: Ensure date formatting is clean
          issueDate: new Date(Number(cert.issueDate) * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
          ipfsHash: cert.ipfsHash,
          dataHash: cert.dataHash,
        });
      }

      setCertificates(certs);
    } catch (error) {
      console.error('Error loading certificates:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateQRCode = async (cert: Certificate) => {
    // ... (Blockchain logic remains unchanged) ...
    if (!signer) return;

    setGeneratingQR(true);
    try {
      // Generate certificate hash (same logic)
      const certHash = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
          ['string', 'string', 'string', 'string', 'string'],
          [cert.studentName, cert.studentWallet, cert.courseName, cert.degree, cert.ipfsHash]
        )
      );

      // Sign the certificate hash (same logic)
      const signature = await signer.signMessage(ethers.getBytes(certHash));

      // Create QR data (same logic)
      const qrData = JSON.stringify({
        certId: cert.id,
        studentWallet: cert.studentWallet,
        ipfsLink: `https://ipfs.io/ipfs/${cert.ipfsHash}`,
        certHash,
        signature,
      });

      setSelectedCert({ ...cert, qrData });
    } catch (error) {
      console.error('Error generating QR code:', error);
      alert('Failed to generate QR code');
    } finally {
      setGeneratingQR(false);
    }
  };

  const downloadQRCode = () => {
    // Get the canvas element directly — QRCodeCanvas renders a real <canvas> tag
    const canvasElement = document.getElementById(`qr-${selectedCert?.id}`) as HTMLCanvasElement | null;
    if (canvasElement) {
      const pngFile = canvasElement.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `certificate-${selectedCert?.id}-qr.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    } else {
      alert('QR code not found. Please generate it first.');
    }
  };

  const viewCertificate = (ipfsHash: string) => {
    if (!ipfsHash) {
      alert('No IPFS hash found for this certificate.');
      return;
    }
    // Try Cloudflare IPFS gateway first (fastest & most reliable)
    const gateways = [
      `https://cloudflare-ipfs.com/ipfs/${ipfsHash}`,
      `https://gateway.pinata.cloud/ipfs/${ipfsHash}`,
      `https://ipfs.io/ipfs/${ipfsHash}`,
    ];
    // Open the primary gateway; user can try others if it fails
    window.open(gateways[0], '_blank');
  };

  if (!account) {
    return (
      <div className="min-h-screen pt-24 px-4 bg-gray-50">
        <div className="max-w-2xl mx-auto text-center">
          {/* Alert styling aligned with light theme */}
          <div className="p-4 bg-red-100 border border-red-300 rounded-lg text-red-800 flex items-center shadow-sm">
            <AlertCircle className="w-5 h-5 mr-2" />
            <p className='font-medium'>Please connect your wallet to view your certificates.</p>
          </div>
        </div>
      </div>
    );
  }

  return (

    <div className="min-h-screen pt-24 pb-12 px-4 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          {/* Header: Accent Color */}
          <h1 className={cn("text-4xl font-bold mb-2 bg-clip-text text-transparent", ACCENT_GRADIENT)}>
            My Certificates
          </h1>
          <p className="text-gray-600">View and manage your academic credentials</p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            {/* Loading Spinner: Accent Color */}
            <Loader2 className={cn("w-12 h-12 animate-spin", ACCENT_TEXT_COLOR)} />
          </div>
        ) : certificates.length === 0 ? (

          <Card className="border border-gray-200 shadow-md">
            <CardContent className="py-12 text-center">
              <Award className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold mb-2 text-gray-900">
                No Certificates Yet
              </h3>
              <p className="text-gray-600">
                Your issued certificates will appear here once your institution adds them.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {certificates.map((cert) => (

              <Card key={cert.id} className="hover:shadow-lg transition-shadow border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg font-semibold text-gray-900">
                    {/* Icon: Accent Color */}
                    <Award className={cn("w-5 h-5 mr-2", ACCENT_TEXT_COLOR)} />
                    Certificate #{cert.id}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3 text-sm">
                    {/* Data Display */}
                    <div className="bg-gray-50 p-2 rounded-md">
                      <span className="font-medium text-gray-600">Name:</span>
                      <p className="text-gray-900 font-semibold">{cert.studentName}</p>
                    </div>
                    <div className="bg-gray-50 p-2 rounded-md">
                      <span className="font-medium text-gray-600">Course:</span>
                      <p className="text-gray-900 font-semibold">{cert.courseName}</p>
                    </div>
                    <div className="bg-gray-50 p-2 rounded-md">
                      <span className="font-medium text-gray-600">Degree:</span>
                      <p className="text-gray-900 font-semibold">{cert.degree}</p>
                    </div>
                    <div className="flex items-center text-gray-600 pt-1">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span className='text-xs font-medium'>Issued on: {cert.issueDate}</span>
                    </div>
                  </div>

                  <div className="pt-4 space-y-2">
                    {/* Primary Button: Accent Color */}
                    <Button
                      onClick={() => generateQRCode(cert)}
                      disabled={generatingQR}
                      className={cn("w-full text-white", ACCENT_GRADIENT, ACCENT_HOVER_COLOR)}
                      size="sm"
                    >
                      {generatingQR ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <QrCode className='w-4 h-4 mr-2' />
                          Generate Verification Code
                        </>
                      )}
                    </Button>

                    {/* Secondary Button: Clean Outline */}
                    <Button
                      onClick={() => viewCertificate(cert.ipfsHash)}
                      variant="outline"
                      className="w-full text-gray-800 border-gray-300 hover:bg-gray-100"
                      size="sm"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View Certificate
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* QR Code Modal */}
        {selectedCert && (

          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <Card className="max-w-md w-full border-gray-200 shadow-2xl">
              <CardHeader>
                <CardTitle className='text-gray-900'>Share Verification Code</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Certificate Info Box */}
                <div className="bg-gray-100 p-4 rounded-lg space-y-1 text-sm border border-gray-200">
                  <div><strong>Certificate ID:</strong> {selectedCert.id}</div>
                  <div><strong>Student:</strong> {selectedCert.studentName}</div>
                  <div><strong>Course:</strong> {selectedCert.courseName}</div>
                </div>

                {/* QR Code Display */}
                <div className="flex flex-col items-center p-6 bg-white rounded-lg border border-gray-200 shadow-inner">
                  <p className="text-sm text-gray-500 mb-4">
                    The signer wallet is required to generate this code.
                  </p>
                  {selectedCert.qrData && (
                    <QRCodeCanvas
                      id={`qr-${selectedCert.id}`}
                      value={selectedCert.qrData}
                      size={200}
                      level="H"
                      includeMargin={true}
                    />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <Button
                    onClick={downloadQRCode}
                    variant="outline"
                    className='w-full text-gray-800 border-gray-300 hover:bg-gray-100'
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download QR
                  </Button>
                  <Button
                    onClick={() => setSelectedCert(null)}
                    className={cn("w-full text-white", ACCENT_GRADIENT, ACCENT_HOVER_COLOR)}
                  >
                    Close
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};