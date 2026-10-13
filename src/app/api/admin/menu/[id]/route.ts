import { NextResponse } from "next/server";
import { db } from "@/db";
import { menuItems } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  try {
    const { id } = await params;
    const itemId = parseInt(id, 10);
    if (isNaN(itemId))
      return NextResponse.json({ error: "معرف غير صالح" }, { status: 400 });

    const body = await req.json();
    const fields: Record<string, unknown> = {};
    if (body.code !== undefined) fields.code = String(body.code).trim();
    if (body.name !== undefined) fields.name = String(body.name).trim();
    if (body.category !== undefined) fields.category = String(body.category).trim();
    if (body.description !== undefined)
      fields.description = body.description?.toString().trim() || null;
    if (body.price !== undefined) {
      const p = typeof body.price === "string" ? parseFloat(body.price) : Number(body.price);
      fields.price = p.toFixed(2);
    }
    if (body.available !== undefined) fields.available = Boolean(body.available);
    if (body.featured !== undefined) fields.featured = Boolean(body.featured);
    if (body.image !== undefined) fields.image = body.image?.toString() || "";

    const [updated] = await db
      .update(menuItems)
      .set(fields)
      .where(eq(menuItems.id, itemId))
      .returning();

    if (!updated)
      return NextResponse.json({ error: "الصنف غير موجود" }, { status: 404 });
    return NextResponse.json({ item: updated });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: "فشل التحديث", details: msg }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  try {
    const { id } = await params;
    const itemId = parseInt(id, 10);
    if (isNaN(itemId))
      return NextResponse.json({ error: "معرف غير صالح" }, { status: 400 });

    await db.delete(menuItems).where(eq(menuItems.id, itemId));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: "فشل الحذف", details: msg }, { status: 500 });
  }
}
