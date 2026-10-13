import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems } from "@/db/schema";
import { eq, desc, and, gte, inArray, sql } from "drizzle-orm";
import { requireStaff } from "@/lib/auth";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/db/schema";

export async function GET(req: Request) {
  try {
    await requireStaff();
  } catch {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const today = searchParams.get("today") === "1";
  const search = searchParams.get("search")?.toString().trim();

  const conditions = [];
  if (status && status !== "all") {
    conditions.push(eq(orders.status, status));
  }
  if (today) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    conditions.push(gte(orders.createdAt, start));
  }

  let allOrders;
  if (conditions.length > 0) {
    allOrders = await db
      .select()
      .from(orders)
      .where(and(...conditions))
      .orderBy(desc(orders.createdAt));
  } else {
    allOrders = await db
      .select()
      .from(orders)
      .orderBy(desc(orders.createdAt));
  }

  if (search) {
    const s = `%${search}%`;
    allOrders = allOrders.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
        o.customerName.toLowerCase().includes(search.toLowerCase()) ||
        o.phone.includes(search)
    );
  }

  const orderIds = allOrders.map((o) => o.id);
  let items: (typeof orderItems.$inferSelect)[] = [];
  if (orderIds.length > 0) {
    items = await db
      .select()
      .from(orderItems)
      .where(inArray(orderItems.orderId, orderIds));
  }
  const itemsByOrder = new Map<number, (typeof items)[number][]>();
  for (const it of items) {
    const arr = itemsByOrder.get(it.orderId) || [];
    arr.push(it);
    itemsByOrder.set(it.orderId, arr);
  }

  // Stats
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayOrders = await db
    .select({ total: orders.total, status: orders.status })
    .from(orders)
    .where(gte(orders.createdAt, todayStart));

  const statsByStatus: Record<string, number> = {};
  for (const s of Object.keys(ORDER_STATUS_LABELS)) {
    statsByStatus[s] = 0;
  }
  let todayTotalSales = 0;
  for (const o of todayOrders) {
    statsByStatus[o.status] = (statsByStatus[o.status] || 0) + 1;
    if (o.status !== "cancelled") {
      todayTotalSales += parseFloat(o.total as string);
    }
  }

  return NextResponse.json({
    orders: allOrders.map((o) => ({
      ...o,
      items: itemsByOrder.get(o.id) || [],
    })),
    stats: {
      byStatus: statsByStatus,
      totalToday: todayOrders.length,
      totalSales: todayTotalSales,
    },
  });
}
