import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const res = await fetch(`${backendUrl}/api/trade/execute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(async () => {
      const text = await res.text();
      return { detail: text || "Backend request failed" };
    });

    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    console.error("Trade execution proxy error:", error);
    return NextResponse.json(
      { detail: error?.message || "Failed to forward trade execution request" },
      { status: 500 }
    );
  }
}
