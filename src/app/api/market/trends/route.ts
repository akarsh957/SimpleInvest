import { NextRequest, NextResponse } from "next/server";
import { getBackendBaseUrl } from "@/src/lib/backend";

export async function GET(_request: NextRequest) {
  try {
    const backendUrl = getBackendBaseUrl();
    const response = await fetch(`${backendUrl}/api/market/trends`, {
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    const responseText = await response.text();
    let data: unknown;
    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch {
      data = { all_items: [], detail: responseText };
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Market trends proxy error:", error);
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : "Failed to load market trends" },
      { status: 500 }
    );
  }
}
