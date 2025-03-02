import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { verificationTable } from "@/schema";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "URL parameter is required" }, { status: 400 });
  }

  try {
    // Query the database for the document with the matching URL
    const document = await db
      .select()
      .from(verificationTable)
      .where(eq(verificationTable.id, url))
      .limit(1);

    // Check if document exists
    if (document.length === 0) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Return the document
    return NextResponse.json({
      id: document[0].id,
      content: document[0].content,
      trustLevel: document[0].verificationLevel,
    });
  } catch (error) {
    console.error("Error fetching document:", error);
    return NextResponse.json({ error: "Failed to fetch document" }, { status: 500 });
  }
}
