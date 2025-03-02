import axios from "axios";
import * as cheerio from "cheerio";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { verificationTable } from "@/schema";

export async function extractTextFromWebpage(url: string): Promise<string> {
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

export async function gatherContext(
  trustedUrls: string[],
  untrustedUrls: string[]
): Promise<{
  untrustedContent: string[];
  level0Content: string[];
  level1Content: string[];
  level2Content: string[];
  level3Content: string[];
}> {
  // Initialize content arrays for each trust level
  const untrustedContent: string[] = [];
  const level0Content: string[] = [];
  const level1Content: string[] = [];
  const level2Content: string[] = [];
  const level3Content: string[] = [];

  // Process trusted documents from DB
  if (trustedUrls.length > 0) {
    const trustedDocs = await Promise.all(
      trustedUrls.map(async url => {
        try {
          const document = await db
            .select()
            .from(verificationTable)
            .where(eq(verificationTable.id, url))
            .limit(1);

          if (document.length > 0) {
            return {
              url,
              content: document[0].content,
              trustLevel: document[0].verificationLevel,
            };
          }
          return null;
        } catch (error) {
          console.error(`Error fetching trusted document ${url}:`, error);
          return null;
        }
      })
    );

    //guard against null contents, throw an error if there is a null content
    if (
      trustedDocs.some(
        doc => doc?.content === null || doc?.content === undefined || doc?.content === ""
      )
    ) {
      const problematicDoc = trustedDocs.find(
        doc => doc?.content === null || doc?.content === undefined || doc?.content === ""
      );
      throw new Error(`Null content found in DB document: ${JSON.stringify(problematicDoc)}`);
    }

    // Sort content into appropriate trust level arrays
    trustedDocs.forEach(doc => {
      if (doc && doc.content) {
        // Add content to the appropriate array based on trust level
        switch (doc.trustLevel) {
          case 0:
            level0Content.push(doc.content);
            break;
          case 1:
            level1Content.push(doc.content);
            break;
          case 2:
            level2Content.push(doc.content);
            break;
          case 3:
            level3Content.push(doc.content);
            break;
          default:
            level0Content.push(doc.content);
        }
      }
    });
  }

  // Process untrusted URLs by fetching their content directly
  if (untrustedUrls.length > 0) {
    const untrustedResults = await Promise.all(
      untrustedUrls.map(async url => {
        try {
          // Use the shared extraction function directly
          const content = await extractTextFromWebpage(url);
          return content;
        } catch (error) {
          console.error(`Error fetching untrusted URL ${url}:`, error);
          return null;
        }
      })
    );

    // Add valid content to untrusted array
    untrustedResults.forEach(content => {
      if (content) {
        untrustedContent.push(content);
      }
    });
  }

  // Return organized content by trust level
  return {
    untrustedContent,
    level0Content,
    level1Content,
    level2Content,
    level3Content,
  };
}
