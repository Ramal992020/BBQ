import { NextResponse } from "next/server";
import { db } from "@/db";
import { menuItems } from "@/db/schema";
import { eq, or } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";

const CATEGORY_IMAGES: Record<string, string> = {
  "برجر فحم": "/menu/charcoal-burger.jpg",
  "تشكن برجر": "/menu/chicken-burger.jpg",
  "سماش برجر": "/menu/smash-burger.jpg",
  وجبات: "/menu/meals-platter.jpg",
  "رول بطاطس": "/menu/potato-roll.jpg",
  بطاطس: "/menu/loaded-fries.jpg",
  "رول ساندوتش": "/menu/wrap-sandwich.jpg",
};

export async function POST() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const all = await db.select().from(menuItems);
  let updated = 0;
  for (const item of all) {
    if (!item.image || item.image === "") {
      const img = CATEGORY_IMAGES[item.category] || "/menu/hero-bbq.jpg";
      await db
        .update(menuItems)
        .set({ image: img })
        .where(eq(menuItems.id, item.id));
      updated++;
    }
  }
  return NextResponse.json({ success: true, updated });
}
