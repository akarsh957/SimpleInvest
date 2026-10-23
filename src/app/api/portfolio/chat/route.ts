import { NextRequest, NextResponse } from "next/server";
import { getBackendBaseUrl } from "@/src/lib/backend";

export async function POST(request: NextRequest) {
  try {
    const backendUrl = getBackendBaseUrl();
    const bodyText = await request.text();
    const response = await fetch(`${backendUrl}/api/portfolio/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: bodyText,
      cache: "no-store",
    });

    const responseText = await response.text();
    let data: unknown;
    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch {
      data = { reply: responseText || "Copilot service returned an empty response." };
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Portfolio chat proxy error:", error);
    return NextResponse.json(
      {
        reply: "I'm having a momentary hiccup communicating with the intelligence service. You can ask me about your diversification score, sector concentration, or ideas to balance your risk!",
        suggested_followups: [
          "How can I improve my diversification?",
          "Which stock has the highest risk?",
          "What sector should I consider adding next?",
        ],
      },
      { status: 200 }
    );
  }
}
