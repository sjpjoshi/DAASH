import { NextResponse } from "next/server";
import { db } from "@/db";
import { verificationTable } from "@/schema";

export async function GET() {
  try {
    const documents = await db.select().from(verificationTable);
    
    // Transform the documents to handle NULL values
    const transformedDocuments = documents.map(doc => ({
      ...doc,
      commonQuery: doc.commonQuery === null ? "NULL" : doc.commonQuery
    }));

    return NextResponse.json(transformedDocuments);
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
} 