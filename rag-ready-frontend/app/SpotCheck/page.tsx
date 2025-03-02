"use client";

import { title } from "@/components/primitives";
import { Button } from "@heroui/button";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ParticleConnections from "@/components/particleConnections";

export default function SpotCheckPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const documentId = searchParams.get('id');
  const [documentContent, setDocumentContent] = useState<string>("");
  const [gptAnalysis, setGptAnalysis] = useState<string>("");

  useEffect(() => {
    const fetchDocumentContent = async () => {
      if (!documentId) {
        console.error('No document ID provided');
        return;
      }

      try {
        console.log('Fetching document with ID:', documentId);
        const response = await fetch(`/api/documents/${encodeURIComponent(documentId)}`);
        console.log('Response status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Error response:', errorText);
          throw new Error(`Failed to fetch document content: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Received document data:', data);
        
        if (!data.content) {
          throw new Error('Document content is missing');
        }
        
        setDocumentContent(data.content);
        setGptAnalysis(data.gptAnalysis || '');
      } catch (error) {
        console.error('Error fetching document content:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch document content');
      }
    };

    if (documentId) {
      fetchDocumentContent();
    }
  }, [documentId]);

  const handleVerification = async (isTrusted: boolean) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/spot-check/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: documentId,
          isTrusted,
        }),
      });

      if (!response.ok) {
        throw new Error('Verification submission failed');
      }

      router.push('/DocumentData');
    } catch (error) {
      console.error('Error during verification:', error);
      setError(error instanceof Error ? error.message : 'Verification failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex flex-col align-center items-center justify-center w-full">
      <ParticleConnections className="absolute inset-0 z-0"/>
      
      <div className="relative z-10 flex flex-col align-center items-center justify-center w-full">
        <div className="flex flex-col gap-6 min-w-[1000px]">
          <h1 className={title()}>Spot <span className={title({ color: "violet" })}>Check</span></h1>
          
          {error && (
            <div className="p-4 text-red-500 bg-red-100 rounded-lg">
              Error: {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg bg-content1">
              <h2 className="text-xl font-bold mb-4">AI Analysis</h2>
              <div className="whitespace-pre-wrap">
                {gptAnalysis}
              </div>
            </div>

            <div className="p-4 border rounded-lg bg-content1">
              <h2 className="text-xl font-bold mb-4">Document Content</h2>
              <div className="whitespace-pre-wrap">
                {documentContent}
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-4 mt-4">
            <Button
              color="success"
              onClick={() => handleVerification(true)}
              disabled={isSubmitting}
            >
              Mark as Trusted
            </Button>
            <Button
              color="danger"
              onClick={() => handleVerification(false)}
              disabled={isSubmitting}
            >
              Mark as Untrusted
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 