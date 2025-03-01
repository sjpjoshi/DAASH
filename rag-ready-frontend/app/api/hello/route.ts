import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      message: "Hello from the API!",
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
    }
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    return NextResponse.json(
      {
        message: "Data received successfully",
        data: body,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to process request",
      },
      {
        status: 400,
      }
    );
  }
}
