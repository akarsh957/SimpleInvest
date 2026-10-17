import { NextRequest, NextResponse } from "next/server";
import { getBackendBaseUrl } from "@/src/lib/backend";

export async function POST(request: NextRequest) {
  try {
    const backendUrl = getBackendBaseUrl();
    const response = await fetch(`${backendUrl}/api/market/forecast`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: await request.text(),
      cache: "no-store",
    });

    const responseText = await response.text();
    let data: unknown;
    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch {
      data = { detail: responseText || "Forecast request failed" };
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Stock forecast proxy error:", error);
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : "Failed to load stock forecast" },
      { status: 500 }
    );
  }
}
