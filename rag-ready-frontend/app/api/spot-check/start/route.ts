import { NextResponse } from "next/server";
import { db } from "@/db";
import { verificationTable } from "@/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Call the Flask backend API for analysis
    const response = await fetch('http://localhost:5000/api/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      throw new Error('AI Verification API request failed');
    }

    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      analysis: data.output.Analysis,
      gptAnalysis: data.output.GPT_Analysis,
    });
  } catch (error) {
    console.error('Error in spot check:', error);
    return NextResponse.json(
      { error: 'Failed to process spot check' },
      { status: 500 }
    );
  }
} 