import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateImageMagicBytes } from "@/lib/security/file-validation";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const validation = validateImageMagicBytes(arrayBuffer, file.type);

    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Generate random, collision-resistant storage key (prevent path traversal or overwrite)
    const randomKey = crypto.randomBytes(16).toString("hex");
    const sanitizedFilename = `proof_${user.id}_${randomKey}.${validation.extension}`;

    return NextResponse.json({
      success: true,
      filename: sanitizedFilename,
      mimeType: validation.mimeType,
      size: arrayBuffer.byteLength,
    });
  } catch (error) {
    console.error("Proof upload error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
