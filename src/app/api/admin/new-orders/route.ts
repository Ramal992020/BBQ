import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { eq, desc, gt } from "drizzle-orm";
import { requireStaff } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    await requireStaff();
  } catch {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const sinceParam = searchParams.get("since");
  const sinceMs = parseInt(sinceParam || "0", 10);
  const sinceDate = new Date(Math.max(0, sinceMs));

  const newOrders = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      customerName: orders.customerName,
      total: orders.total,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .where(eq(orders.status, "new"))
    .orderBy(desc(orders.createdAt))
    .limit(5);

  const fresh = newOrders.filter(
    (o) => o.createdAt && new Date(o.createdAt).getTime() > sinceMs
  );

  return NextResponse.json({
    orders: fresh,
    serverTime: Date.now(),
    sinceDate,
  });
}
