import { NextResponse } from "next/server";
import { db } from "@/db";
import { menuItems } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const all = searchParams.get("all") === "1";

  let items;
  if (all) {
    items = await db
      .select()
      .from(menuItems)
      .orderBy(asc(menuItems.category), asc(menuItems.price), asc(menuItems.name));
  } else {
    items = await db
      .select()
      .from(menuItems)
      .where(eq(menuItems.available, true))
      .orderBy(asc(menuItems.category), asc(menuItems.price), asc(menuItems.name));
  }

  return NextResponse.json({ items });
}
