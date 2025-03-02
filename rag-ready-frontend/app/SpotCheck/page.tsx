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

  const documentId = searchParams.get("id");
  const [documentContent, setDocumentContent] = useState<string>("");
  const [gptAnalysis, setGptAnalysis] = useState<string>("");

  useEffect(() => {
    const fetchDocumentContent = async () => {
      if (!documentId) {
        console.error("No document ID provided");
        return;
      }

      try {
        console.log("Fetching document with ID:", documentId);
        const response = await fetch(`/api/documents/${encodeURIComponent(documentId)}`);
        console.log("Response status:", response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Error response:", errorText);
          throw new Error(`Failed to fetch document content: ${response.status}`);
        }

        const data = await response.json();
        console.log("Received document data:", data);

        if (!data.content) {
          throw new Error("Document content is missing");
        }

        setDocumentContent(data.content);
        setGptAnalysis(data.gptAnalysis || "");
      } catch (error) {
        console.error("Error fetching document content:", error);
        setError(error instanceof Error ? error.message : "Failed to fetch document content");
      }
    };

    if (documentId) {
      fetchDocumentContent();
    }
  }, [documentId]);

  const handleVerification = async (isTrusted: boolean) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/spot-check/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: documentId,
          isTrusted,
        }),
      });

      if (!response.ok) {
        throw new Error("Verification submission failed");
      }

      router.push("/DocumentData");
    } catch (error) {
      console.error("Error during verification:", error);
      setError(error instanceof Error ? error.message : "Verification failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="align-center relative flex w-full flex-col items-center justify-center">
      <ParticleConnections className="absolute inset-0 z-0" />

      <div className="align-center relative z-10 flex w-full flex-col items-center justify-center">
        <div className="flex min-w-[1000px] flex-col gap-6">
          <h1 className={title()}>
            Spot <span className={title({ color: "violet" })}>Check</span>
          </h1>

          {error && <div className="rounded-lg bg-red-100 p-4 text-red-500">Error: {error}</div>}

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border bg-content1 p-4">
              <h2 className="mb-4 text-xl font-bold">AI Analysis</h2>
              <div className="max-h-[60vh] overflow-y-auto whitespace-pre-wrap scrollbar-hide">
                {gptAnalysis}
              </div>
            </div>

            <div className="rounded-lg border bg-content1 p-4">
              <h2 className="mb-4 text-xl font-bold">Document Content</h2>
              <div className="max-h-[60vh] overflow-y-auto whitespace-pre-wrap scrollbar-hide">
                {documentContent}
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-center gap-4">
            <Button
              color="success"
              onPress={() => handleVerification(true)}
              disabled={isSubmitting}
            >
              Mark as Trusted
            </Button>
            <Button
              color="danger"
              onPress={() => handleVerification(false)}
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
