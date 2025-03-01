import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import * as cheerio from "cheerio";

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

async function extractTextFromWebpage(url: string): Promise<string> {
  try {
    const response = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      timeout: 5000, // 5 second timeout
    });

    const $ = cheerio.load(response.data);

    // Remove common non-content elements like ads, navigation, scripts, etc.
    $(
      'nav, footer, header, aside, .ads, .advertisement, script, style, [class*="banner"], [class*="menu"], [id*="menu"], [class*="nav"], [id*="nav"]'
    ).remove();

    // Look for main content containers first (such as <main>, <article>, etc.)
    const mainContent = $(
      'main, article, [role="main"], .main-content, #main-content, .content, #content'
    );

    let content;
    if (mainContent.length > 0) {
      // Extract from identified main content if found
      content = mainContent;
    } else {
      // Fallback to the whole body if no main content container is found
      content = $("body");
    }

    // Get text from semantic elements in the content area
    const textElements = content.find("p, h1, h2, h3, h4, h5, h6, li, blockquote, pre, table, dl");

    // Join the text with appropriate spacing
    const textArray: string[] = [];
    textElements.each((_, elem) => {
      const text = $(elem).text().trim();
      if (text) {
        textArray.push(text);
      }
    });

    // Join and clean up excessive whitespace
    let text = textArray.join(" ");
    text = text.replace(/\s+/g, " ").trim();

    return text;
  } catch (error) {
    return `Error extracting text: ${error instanceof Error ? error.message : String(error)}`;
  }
}
