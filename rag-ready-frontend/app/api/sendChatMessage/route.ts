//Does async call to openai chat to get a response with the context files provided
//from the augmented chat page (aka the trusted docs from the db and the untrusted urls)
//returns the response text from openai

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { verificationTable } from "@/schema";
import { extractTextFromWebpage } from "@/lib/contentExtraction";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { prompt, trustedUrls, untrustedUrls } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const hasContext = trustedUrls.length > 0 || untrustedUrls.length > 0;
    // Gather context from both trusted and untrusted sources using the shared function
    const context = await gatherContext(trustedUrls || [], untrustedUrls || []);

    // Format the context for OpenAI with appropriate labels
    let formattedContext = "";

    // Add untrusted content with appropriate label
    if (context.untrustedContent.length > 0) {
      formattedContext +=
        "UNCHECKED SOURCES:\n" +
        context.untrustedContent
          .map((content, i) => `[Unchecked Source ${i + 1}]:\n${content}`)
          .join("\n\n") +
        "\n\n";
    }

    // Add trusted content with appropriate labels by trust level
    if (context.level0Content.length > 0) {
      formattedContext +=
        "UNKNOWN TRUST LEVEL SOURCES:\n" +
        context.level0Content
          .map((content, i) => `[Unknown Trust Level Source ${i + 1}]:\n${content}`)
          .join("\n\n") +
        "\n\n";
    }

    if (context.level1Content.length > 0) {
      formattedContext +=
        "MACHINE CHECKED SOURCES:\n" +
        context.level1Content
          .map((content, i) => `[Machine Checked Source ${i + 1}]:\n${content}`)
          .join("\n\n") +
        "\n\n";
    }

    if (context.level2Content.length > 0) {
      formattedContext +=
        "AI ASSISTED SPOT CHECKED SOURCES:\n" +
        context.level2Content
          .map((content, i) => `[AI Assisted Spot Checked Source ${i + 1}]:\n${content}`)
          .join("\n\n") +
        "\n\n";
    }

    if (context.level3Content.length > 0) {
      formattedContext +=
        "HUMAN VERIFIED SOURCES:\n" +
        context.level3Content
          .map((content, i) => `[Human Verified Source ${i + 1}]:\n${content}`)
          .join("\n\n");
    }

    if (!hasContext) {
      formattedContext = "No context provided.";
    }

    // Prepare the messages for OpenAI
    const messages = [
      {
        role: "system",
        content:
          "You are a helpful assistant. Answer the user's question based on the provided context. Some context documents can have a known level of trust, and others do not. Use the trust level to determine the reliability of the information. If the context doesn't contain relevant information, say so shortly and ignore it.",
      },
      {
        role: "system",
        content: `Context information:\n${formattedContext}\n\n`,
      },
      {
        role: "user",
        content: `Please answer the following question based on the context provided: ${prompt}`,
      },
    ];

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo", // Could be changed to a cheaper model but this is just a demo
      messages: messages as any,
      temperature: 0.7,
    });

    return NextResponse.json({
      response: response.choices[0].message.content,
      usage: response.usage,
    });
  } catch (error) {
    console.error("Error in sendChatMessage:", error);
    return NextResponse.json(
      {
        error: `Error processing request: ${error instanceof Error ? error.message : String(error)}`,
      },
      { status: 500 }
    );
  }
}

async function gatherContext(
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

  // Process untrusted URLs by fetching their content
  if (untrustedUrls.length > 0) {
    const untrustedResults = await Promise.all(
      untrustedUrls.map(async url => {
        try {
          // Use the imported extractTextFromWebpage function directly
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
