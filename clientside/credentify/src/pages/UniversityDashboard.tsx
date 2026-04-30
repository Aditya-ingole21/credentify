// src/pages/UniversityDashboard.tsx
import React, { useState } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Upload, FileText, Award, Plus, CheckCircle, AlertCircle, Loader2, Download } from 'lucide-react';
import { ethers } from 'ethers';
import { QRCodeCanvas } from 'qrcode.react';
import { cn } from '../lib/utils'; // Imported cn utility

interface CertificateForm {
  studentName: string;
  studentWallet: string;
  courseName: string;
  degree: string;
  ipfsHash: string;
}

interface IssuedCertificate {
  certId: string;
  studentName: string;
  studentWallet: string;
  courseName: string;
  degree: string;
  ipfsHash: string;
  qrData?: string;
}

export const UniversityDashboard: React.FC = () => {
  const { account, contract, isAdmin, signer } = useWeb3();
  const [formData, setFormData] = useState<CertificateForm>({
    studentName: '',
    studentWallet: '',
    courseName: '',
    degree: '',
    ipfsHash: '',
  });
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [issuedCert, setIssuedCert] = useState<IssuedCertificate | null>(null);
  const [uploadingToIPFS, setUploadingToIPFS] = useState(false);

  const ACCENT_GRADIENT = "bg-gradient-to-r from-red-500 to-orange-500";
  const ACCENT_TEXT_COLOR = "text-red-600";
  const ACCENT_BG_COLOR = "bg-red-50";
  const ACCENT_HOVER_COLOR = "hover:bg-red-600";
  const ACCENT_BORDER_COLOR = "border-red-500/50";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setFormData({ ...formData, ipfsHash: '' });
      setIssuedCert(null);
    }
  };

  const uploadToIPFS = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setUploadingToIPFS(true);
    setError('');

    try {
      const mockIPFSHash = `Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
      setFormData({ ...formData, ipfsHash: mockIPFSHash });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);

    } catch (err) {
      console.error('IPFS upload error:', err);
      setError('Failed to upload to IPFS');
    } finally {
      setUploadingToIPFS(false);
    }
  };

  const issueCertificate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!contract || !signer) {
      setError('Please connect your wallet');
      return;
    }

    if (!formData.ipfsHash) {
      setError('Please upload the certificate file to IPFS first.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);
    setIssuedCert(null);

    try {
      const tx = await contract.issueCertificate(
        formData.studentWallet,
        formData.studentName,
        formData.courseName,
        formData.degree,
        formData.ipfsHash
      );

      const receipt = await tx.wait();
      const event = receipt.logs.find((log: any) => {
        try {
          const parsed = contract.interface.parseLog(log);
          return parsed?.name === 'CertificateIssued';
        } catch {
          return false;
        }
      });

      let certId = '1';
      if (event) {
        const parsed = contract.interface.parseLog(event);
        certId = parsed?.args[0].toString();
      }

      const certHash = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
          ['string', 'address', 'string', 'string', 'string'],
          [formData.studentName, formData.studentWallet, formData.courseName, formData.degree, formData.ipfsHash]
        )
      );

      const signature = await signer.signMessage(ethers.getBytes(certHash));

      const qrData = JSON.stringify({
        certId,
        studentWallet: formData.studentWallet,
        ipfsLink: `https://ipfs.io/ipfs/${formData.ipfsHash}`,
        certHash,
        signature,
      });

      setIssuedCert({
        certId,
        studentName: formData.studentName,
        studentWallet: formData.studentWallet,
        courseName: formData.courseName,
        degree: formData.degree,
        ipfsHash: formData.ipfsHash,
        qrData,
      });

      setSuccess(true);

      setFormData({
        studentName: '',
        studentWallet: '',
        courseName: '',
        degree: '',
        ipfsHash: '',
      });

      setFile(null);

    } catch (err: any) {
      console.error('Error issuing certificate:', err);
      setError(err.message || 'Failed to issue certificate');
    } finally {
      setLoading(false);
    }
  };

  const downloadQRCode = () => {
    const canvas = document.getElementById('qr-code') as HTMLCanvasElement;
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `certificate-${issuedCert?.certId}-qr.png`;
      link.href = url;
      link.click();
    }
  };

  if (!account) {
    return (
      <div className="min-h-screen pt-24 px-4 bg-gray-50">
        <div className="max-w-2xl mx-auto text-center">
          <div className="p-4 bg-red-100 border border-red-300 rounded-lg text-red-800 flex items-center shadow-sm">
            <AlertCircle className="w-5 h-5 mr-2" />
            <p className='font-medium'>Please connect your wallet to access the university dashboard.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-6 pb-6 bg-gray-50">
      <div className="mx-auto px-4 md:px-8 lg:px-12">
        <div className="mb-8">
          <h1 className={cn("text-4xl font-bold mb-2 bg-clip-text text-transparent", ACCENT_GRADIENT)}>
            University Issuer Dashboard
          </h1>
          <p className="text-gray-600">Issue and manage academic credentials on-chain</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">

          {/* ⬇⬇⬇ ONLY CHANGE APPLIED HERE ⬇⬇⬇ */}
          <Card className='shadow-xl border-gray-200 w-full col-span-full'>
            {/* ⬆⬆⬆ ONLY CHANGE APPLIED HERE ⬆⬆⬆ */}

            <CardHeader>
              <CardTitle className="flex items-center text-gray-900">
                <Award className={cn("w-6 h-6 mr-2", ACCENT_TEXT_COLOR)} />
                Issue New Certificate
              </CardTitle>
            </CardHeader>

            <CardContent>
              <form onSubmit={issueCertificate} className="space-y-6 w-full">

                <div className='border-b border-gray-100 pb-6 w-full'>
                  <Label className='text-sm font-semibold text-gray-700'>1. Certificate PDF & IPFS Link</Label>
                  <div className="mt-2 flex items-center space-x-3 w-full">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className={cn(
                        "flex-1 cursor-pointer flex items-center justify-center px-4 py-3 border-2 border-dashed rounded-lg transition",
                        file ? "border-green-400 bg-green-50" : "border-gray-300 hover:border-red-400"
                      )}
                    >
                      <Upload className={cn("w-5 h-5 mr-2", file ? "text-green-600" : "text-gray-400")} />
                      <span className="text-sm text-gray-700">
                        {file ? file.name : 'Choose PDF file'}
                      </span>
                    </label>
                    <Button
                      type="button"
                      onClick={uploadToIPFS}
                      disabled={!file || uploadingToIPFS || !!formData.ipfsHash}
                      className={cn("text-white", ACCENT_GRADIENT, ACCENT_HOVER_COLOR)}
                      size="sm"
                    >
                      {uploadingToIPFS ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Upload'}
                    </Button>
                  </div>

                  {formData.ipfsHash && (
                    <p className="mt-2 text-xs text-green-600 flex items-center">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Certificate Hash Generated: {formData.ipfsHash.slice(0, 10)}...
                    </p>
                  )}
                </div>

                <div className='space-y-4 w-full'>
                  <Label className='text-sm font-semibold text-gray-700'>2. Student & Course Details</Label>

                  <Input
                    type="text"
                    placeholder="Student Name"
                    value={formData.studentName}
                    onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                    required
                    className="w-full border-gray-300 focus:border-red-400 focus:ring-red-400"
                  />

                  <Input
                    type="text"
                    placeholder="Student Wallet Address (0x...)"
                    value={formData.studentWallet}
                    onChange={(e) => setFormData({ ...formData, studentWallet: e.target.value })}
                    required
                    className="w-full border-gray-300 focus:border-red-400 focus:ring-red-400"
                  />

                  <div className='grid grid-cols-2 gap-4 w-full'>
                    <Input
                      type="text"
                      placeholder="Course Name"
                      value={formData.courseName}
                      onChange={(e) => setFormData({ ...formData, courseName: e.target.value })}
                      required
                      className="w-full border-gray-300 focus:border-red-400 focus:ring-red-400"
                    />
                    <Input
                      type="text"
                      placeholder="Degree (e.g., BSc, PhD)"
                      value={formData.degree}
                      onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                      required
                      className="w-full border-gray-300 focus:border-red-400 focus:ring-red-400"
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-4 bg-red-100 border border-red-300 rounded-lg text-red-800 flex items-center shadow-sm w-full">
                    <AlertCircle className="w-5 h-5 mr-2" />
                    <p className='font-medium'>{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading || !formData.ipfsHash}
                  className={cn("w-full text-white", ACCENT_GRADIENT, ACCENT_HOVER_COLOR)}
                  size="lg"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Issue Certificate on Blockchain'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {issuedCert && (
            <Card className='shadow-xl border-gray-200 w-full'>
              <CardHeader>
                <CardTitle className="flex items-center text-gray-900">
                  <FileText className={cn("w-6 h-6 mr-2", ACCENT_TEXT_COLOR)} />
                  Certificate Minted!
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="p-4 bg-green-100 border border-green-300 rounded-lg text-green-800 flex items-center shadow-sm">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  <p className='font-medium'>Certificate #{issuedCert.certId} has been issued successfully!</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm border border-gray-200">
                  <div><strong>Certificate ID:</strong> <span className='font-mono text-red-600'>{issuedCert.certId}</span></div>
                  <div><strong>Student Wallet:</strong> <span className='font-mono text-gray-700'>{issuedCert.studentWallet.slice(0, 8)}...{issuedCert.studentWallet.slice(-6)}</span></div>
                  <div className="break-all"><strong>IPFS Hash:</strong> <span className='font-mono text-gray-700'>{issuedCert.ipfsHash.slice(0, 20)}...</span></div>
                </div>

                <div className="flex flex-col items-center p-6 bg-white rounded-lg border border-gray-300 shadow-inner w-full">
                  <p className="text-sm text-gray-500 mb-4">
                    Share this code for instant verification.
                  </p>

                  <QRCodeCanvas
                    id="qr-code"
                    value={issuedCert.qrData || ''}
                    size={200}
                    level="H"
                    includeMargin={true}
                  />

                  <Button
                    onClick={downloadQRCode}
                    variant="outline"
                    className="mt-4 w-full text-gray-800 border-gray-300 hover:bg-gray-100"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download QR Code
                  </Button>
                </div>

                <Button
                  onClick={() => { setIssuedCert(null); setError(''); }}
                  className={cn("w-full text-white", ACCENT_GRADIENT, ACCENT_HOVER_COLOR)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Issue Another Certificate
                </Button>
              </CardContent>
            </Card>
          )}

        </div>
      </div>
    </div>
  );
};
