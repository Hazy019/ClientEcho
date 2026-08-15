import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { createClient } from "@/lib/supabase/server";
import { sendSupportEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { subject, message } = body;

    if (!subject || !message || typeof subject !== "string" || typeof message !== "string") {
      return NextResponse.json({ error: "Subject and message are required" }, { status: 400 });
    }

    const result = await sendSupportEmail({
      fromEmail: user.email || "creator@domain.com",
      subject: subject.trim(),
      message: message.trim(),
    });

    if (result.success) {
      return NextResponse.json({ success: true, message: "Support ticket submitted successfully!" });
    } else {
      return NextResponse.json({ error: result.error || "Failed to send support email" }, { status: 500 });
    }
  } catch (error: any) {
    console.error("Support submission error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
