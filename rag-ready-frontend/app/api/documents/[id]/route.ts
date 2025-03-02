import { NextResponse } from "next/server";
import { db } from "@/db";
import { verificationTable } from "@/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Fetching document with ID:', params.id);
    const document = await db
      .select()
      .from(verificationTable)
      .where(eq(verificationTable.id, params.id))
      .limit(1);

    if (!document.length) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(document[0]);
  } catch (error) {
    console.error('Error fetching document:', error);
    return NextResponse.json(
      { error: 'Failed to fetch document' },
      { status: 500 }
    );
  }
} 