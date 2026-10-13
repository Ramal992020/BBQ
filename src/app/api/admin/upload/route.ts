import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

export async function POST(req: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "لم يتم رفع ملف" }, { status: 400 });
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const originalName = file.name || "upload.jpg";
    const ext = path.extname(originalName) || ".jpg";
    const safeName = `img-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    if (!existsSync(uploadDir)) await mkdir(uploadDir, { recursive: true });
    const fullPath = path.join(uploadDir, safeName);
    await writeFile(fullPath, buffer);

    return NextResponse.json({ url: `/uploads/${safeName}` });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: "فشل الرفع", details: msg }, { status: 500 });
  }
}
