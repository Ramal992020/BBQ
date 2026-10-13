import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems, ORDER_STATUS_LABELS, type OrderStatus } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireStaff } from "@/lib/auth";

const VALID_STATUSES = Object.keys(ORDER_STATUS_LABELS) as OrderStatus[];

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireStaff();
  } catch {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  try {
    const { id } = await params;
    const orderId = parseInt(id, 10);
    if (isNaN(orderId))
      return NextResponse.json({ error: "معرف غير صالح" }, { status: 400 });

    const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    if (!order) return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });

    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));

    return NextResponse.json({ order: { ...order, items } });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireStaff();
  } catch {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  try {
    const { id } = await params;
    const orderId = parseInt(id, 10);
    if (isNaN(orderId))
      return NextResponse.json({ error: "معرف غير صالح" }, { status: 400 });
    const body = await req.json();
    const { status } = body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: "حالة غير صالحة", valid: VALID_STATUSES },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(orders)
      .set({ status, updatedAt: new Date() })
      .where(eq(orders.id, orderId))
      .returning();
    if (!updated)
      return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });

    return NextResponse.json({ success: true, order: updated });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
