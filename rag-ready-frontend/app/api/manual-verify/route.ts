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

    // Check if the URL already exists in the database
    const existingDoc = await db
      .select()
      .from(verificationTable)
      .where(eq(verificationTable.id, url))
      .limit(1);

    if (existingDoc.length > 0) {
      // Update existing document's verification level
      await db
        .update(verificationTable)
        .set({ verificationLevel: 2 })
        .where(eq(verificationTable.id, url));
    } else {
      // Insert new document with verification level 2
      await db.insert(verificationTable).values({
        id: url,
        verificationLevel: 2,
        queryCount: 0,
        verificationPriority: 0,
        commonQuery: null,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in manual verification:', error);
    return NextResponse.json(
      { error: 'Failed to process manual verification' },
      { status: 500 }
    );
  }
} 