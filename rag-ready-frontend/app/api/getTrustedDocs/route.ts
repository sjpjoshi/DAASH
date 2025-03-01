//Used to get trusted docs from the database with level of minimum trust
//0 - untrusted, 1 - machine checked, 2 - AI Assisted Spot Check, 3 - Full Human Verification or just All documents
//returns a list of documents in tuple format (id (the url), level of trust)
//if no trustlevel is provided, it will return all documents

import { NextRequest, NextResponse } from "next/server";
import { gte } from "drizzle-orm";
import { db } from "@/db";
import { verificationTable } from "@/schema";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const level = searchParams.get("level");

  try {
    let documents;

    if (level === null) {
      // If no level is provided, return all documents
      documents = await db.select().from(verificationTable);
    } else {
      const trustLevel = parseInt(level);

      if (isNaN(trustLevel)) {
        return NextResponse.json({ error: "Invalid trust level format" }, { status: 400 });
      }

      // Return documents with verification level greater than or equal to the specified level
      documents = await db
        .select()
        .from(verificationTable)
        .where(gte(verificationTable.verificationLevel, trustLevel));
    }

    // Transform to the required tuple format (id, level of trust)
    const formattedDocs = documents.map(doc => ({
      id: doc.id,
      trustLevel: doc.verificationLevel,
    }));

    return NextResponse.json(formattedDocs);
  } catch (error) {
    console.error("Error fetching documents:", error);
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
  }
}
