import { NextResponse } from "next/server";
import { db } from "@/db";
import { verificationTable } from "@/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const { url, isTrusted } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Update the verification level based on the user's decision
    await db
      .update(verificationTable)
      .set({
        verificationLevel: isTrusted ? 2 : 0,
      })
      .where(eq(verificationTable.id, url));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in spot check verification:', error);
    return NextResponse.json(
      { error: 'Failed to process verification' },
      { status: 500 }
    );
  }
} 