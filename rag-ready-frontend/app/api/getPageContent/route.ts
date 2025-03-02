import { NextRequest, NextResponse } from "next/server";
import { extractTextFromWebpage } from "@/lib/contentExtraction";

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch (e) {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
    }

    const extractedText = await extractTextFromWebpage(url);
    return NextResponse.json({ text: extractedText });
  } catch (error) {
    console.error("Error in content extraction:", error);
    return NextResponse.json(
      {
        error: `Error extracting content: ${error instanceof Error ? error.message : String(error)}`,
      },
      { status: 500 }
    );
  }
}
