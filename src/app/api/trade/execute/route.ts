import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getBackendBaseUrl } from "@/src/lib/backend";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (userError || !user || !session?.access_token) {
      return NextResponse.json({ detail: "You must be signed in to trade" }, { status: 401 });
    }

    const backendUrl = getBackendBaseUrl();
    const res = await fetch(`${backendUrl}/api/trade/execute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ ...body, user_id: user.id }),
    });

    const responseText = await res.text();
    let data: unknown;
    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch {
      data = { detail: responseText || "Backend request failed" };
    }

    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Trade execution proxy error:", error);
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : "Failed to forward trade execution request" },
      { status: 500 }
    );
  }
}
