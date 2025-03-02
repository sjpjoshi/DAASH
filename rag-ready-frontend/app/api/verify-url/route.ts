import { NextResponse } from "next/server";
import { db } from "@/db";
import { verificationTable } from "@/schema";
import { eq } from "drizzle-orm";

async function checkUrlTrustworthy(url: string): Promise<boolean> {
  try {
    // Call the Flask backend API
    console.log('Attempting to call Flask backend at http://localhost:5000/api/query with URL:', url);
    const response = await fetch('http://localhost:5000/api/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    console.log('Flask response status:', response.status);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Flask API error response:', errorText);
      throw new Error(`AI Verification API failed with status ${response.status}: ${errorText}`);
    }

    console.log('Parsing Flask response...');
    const data = await response.json();
    console.log('Received data from Flask:', data);

    // Check the Analysis field from the Flask response
    if (!data.output?.Analysis) {
      console.error('Unexpected response format:', data);
      throw new Error('Invalid response format from AI Verification API');
    }

    return data.output.Analysis === "Trusted";
  } catch (error) {
    console.error('Detailed error in checkUrlTrustworthy:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      url
    });
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    console.log('Starting verification process for URL:', url);
    // Get the trust status from AI Verification API
    const response = await fetch('http://localhost:5000/api/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      throw new Error(`AI Verification API failed with status ${response.status}`);
    }

    const data = await response.json();
    const isTrusted = data.output.Analysis === "Trusted";
    const verificationLevel = isTrusted ? 1 : 0;

    // Check if the URL already exists
    const existingDoc = await db
      .select()
      .from(verificationTable)
      .where(eq(verificationTable.id, url))
      .limit(1);

    if (existingDoc.length > 0) {
      // Only update verification level if it's not already at level 2 or 3
      const currentVerificationLevel = existingDoc[0].verificationLevel;
      const newVerificationLevel = currentVerificationLevel >= 2 
        ? currentVerificationLevel  // Keep level 2 or 3 if it's already there
        : verificationLevel;  // Otherwise use the AI verification result

      // Update existing document with new verification level and increment query count
      await db
        .update(verificationTable)
        .set({
          verificationLevel: newVerificationLevel,
          queryCount: existingDoc[0].queryCount + 1,
          content: data.content,
          gptAnalysis: data.output.GPT_Analysis,
        })
        .where(eq(verificationTable.id, url));

      return NextResponse.json({
        success: true,
        isTrusted,
        verificationLevel: newVerificationLevel,
        preserved: currentVerificationLevel >= 2,
      });
    } else {
      // Insert new document with initial values
      await db.insert(verificationTable).values({
        id: url,
        verificationLevel,
        queryCount: 1,
        verificationPriority: 0,
        commonQuery: null,
        content: data.content,
        gptAnalysis: data.output.GPT_Analysis,
      });

      return NextResponse.json({
        success: true,
        isTrusted,
        verificationLevel,
        preserved: false,
      });
    }
  } catch (error) {
    console.error('Error in AI verification:', error);
    return NextResponse.json(
      { error: 'Failed to process AI verification' },
      { status: 500 }
    );
  }
} 