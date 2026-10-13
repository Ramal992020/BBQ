import { NextResponse } from "next/server";
import { db } from "@/db";
import { menuItems } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { code, name, category, description, price, available, featured, image } = body;
    if (!code || !name || !category || !price) {
      return NextResponse.json(
        { error: "الكود والاسم والتصنيف والسعر مطلوبون" },
        { status: 400 }
      );
    }
    const numericPrice = typeof price === "string" ? parseFloat(price) : Number(price);
    if (isNaN(numericPrice) || numericPrice < 0) {
      return NextResponse.json({ error: "سعر غير صالح" }, { status: 400 });
    }
    const [newItem] = await db
      .insert(menuItems)
      .values({
        code: String(code).trim(),
        name: String(name).trim(),
        category: String(category).trim(),
        description: description?.toString().trim() || null,
        price: numericPrice.toFixed(2),
        available: available ?? true,
        featured: featured ?? false,
        image: image?.toString() || "",
      })
      .returning();

    return NextResponse.json({ item: newItem });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Create menu item error:", msg);
    return NextResponse.json(
      { error: "فشل الإضافة", details: msg },
      { status: 500 }
    );
  }
}
