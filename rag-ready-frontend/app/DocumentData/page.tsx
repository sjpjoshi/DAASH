"use client";

import { title } from "@/components/primitives";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { useState, useEffect } from "react";
import type { SelectDocument } from "@/schema";
import { ChangeEvent } from "react";
import ParticleConnections from "@/components/particleConnections";

export default function DocumentDataPage() {
  const [documents, setDocuments] = useState<SelectDocument[]>([]);
  const [urlToVerify, setUrlToVerify] = useState("");
  const [manualVerifyUrl, setManualVerifyUrl] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setError(null);
        const response = await fetch('/api/documents');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new TypeError("Response was not JSON");
        }

        const text = await response.text(); // Get the raw text first
        console.log('Raw response:', text); // Debug log
        
        const data = JSON.parse(text); // Parse it manually
        
        if (!Array.isArray(data)) {
          throw new TypeError('Expected an array of documents');
        }

        setDocuments(data);
      } catch (error) {
        console.error('Failed to fetch documents:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch documents');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  const handleAIVerification = async () => {
    if (!urlToVerify.trim()) return;
    
    setIsVerifying(true);
    setError(null);
    try {
      const response = await fetch('/api/verify-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: urlToVerify }),
      });

      if (!response.ok) {
        throw new Error('Verification request failed');
      }

      // Refresh the documents list after verification
      const response2 = await fetch('/api/documents');
      if (!response2.ok) {
        throw new Error('Failed to refresh documents');
      }
      const newData = await response2.json();
      setDocuments(newData);
      setUrlToVerify(''); // Clear input after successful verification
    } catch (error) {
      console.error('Error during AI verification:', error);
      setError(error instanceof Error ? error.message : 'Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleManualVerification = async () => {
    if (!manualVerifyUrl.trim()) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch('/api/manual-verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: manualVerifyUrl }),
      });

      if (!response.ok) {
        throw new Error('Manual verification submission failed');
      }

      // Refresh the documents list after verification
      const response2 = await fetch('/api/documents');
      if (!response2.ok) {
        throw new Error('Failed to refresh documents');
      }
      const newData = await response2.json();
      setDocuments(newData);
      setManualVerifyUrl(''); // Clear input after successful submission
    } catch (error) {
      console.error('Error during manual verification:', error);
      setError(error instanceof Error ? error.message : 'Manual verification failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex flex-col align-center items-center justify-center w-full">
      <ParticleConnections className="absolute inset-0 z-0"/>
      
      {/* Main content with higher z-index to appear above particles */}
      <div className="relative z-10 flex flex-col align-center items-center justify-center w-full">
        <div className="flex flex-col gap-6 min-w-[1000px]">
          <h1 className={title()}>Document <span className={title({ color: "violet" })}>Trust</span> Data</h1>
          
          {error && (
            <div className="p-4 text-red-500 bg-red-100 rounded-lg">
              Error: {error}
            </div>
          )}

          <div className="border rounded-lg bg-content1">
            <div className="h-[500px] overflow-y-auto p-4">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 px-4 text-center">ID</th>
                    <th className="py-2 px-4 text-center">Verification Level</th>
                    <th className="py-2 px-4 text-center">Query Count</th>
                    <th className="py-2 px-4 text-center">Verification Priority</th>
                    <th className="py-2 px-4 text-center">Common Query</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="py-4 text-center">Loading...</td>
                    </tr>
                  ) : documents.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-4 text-center">No documents found</td>
                    </tr>
                  ) : (
                    documents.map((doc) => (
                      <tr key={doc.id} className="border-b">
                        <td className="py-2 px-4">{doc.id}</td>
                        <td className="py-2 px-4">{doc.verificationLevel}</td>
                        <td className="py-2 px-4">{doc.queryCount}</td>
                        <td className="py-2 px-4">{doc.verificationPriority}</td>
                        <td className="py-2 px-4">{doc.commonQuery || "NULL"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg bg-content1">
              <div className="flex gap-2">
                <Input
                  label="URL to Verify"
                  placeholder="Enter URL for AI verification"
                  value={urlToVerify}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setUrlToVerify(e.target.value)}
                />
                <Button
                color="secondary"
                  onClick={handleAIVerification}
                  disabled={isVerifying || !urlToVerify.trim()}
                >
                  {isVerifying ? 'Verifying...' : 'Verify URL'}
                </Button>
              </div>
            </div>

            <div className="p-4 border rounded-lg bg-content1">
              <div className="flex gap-2">
                <Input
                  label="Manual Verification"
                  placeholder="Enter URL to mark as verified"
                  value={manualVerifyUrl}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setManualVerifyUrl(e.target.value)}
                />
                <Button 
                  color="secondary"
                  onClick={handleManualVerification}
                  disabled={isSubmitting || !manualVerifyUrl.trim()}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Verified'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
