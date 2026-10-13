import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems, menuItems } from "@/db/schema";
import { eq, desc, inArray } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth";
import { generateOrderNumber } from "@/lib/utils";
import { buildNewOrderMessage, buildWhatsAppUrl } from "@/lib/whatsapp";

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    const body = await req.json();
    const { customerName, phone, address, notes, paymentMethod, items } = body;

    if (!customerName || !phone || !address || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "برجاء استكمال البيانات وإضافة أصناف للسلة" },
        { status: 400 }
      );
    }

    const menuItemIds: number[] = items.map((i: { menuItemId: number }) => i.menuItemId);
    const dbItems = await db
      .select()
      .from(menuItems)
      .where(eq(menuItems.available, true));

    const availableMap = new Map(
      dbItems.filter((m) => menuItemIds.includes(m.id)).map((m) => [m.id, m])
    );

    let total = 0;
    const preparedItems: {
      menuItemId: number;
      itemName: string;
      quantity: number;
      unitPrice: number;
      total: number;
    }[] = [];

    for (const i of items) {
      const mi = availableMap.get(i.menuItemId);
      if (!mi) {
        return NextResponse.json(
          { error: `أحد الأصناف غير متاح أو لم يعد موجودًا` },
          { status: 400 }
        );
      }
      const qty = Math.max(1, parseInt(i.quantity, 10) || 1);
      const price = parseFloat(mi.price as string);
      const lineTotal = price * qty;
      total += lineTotal;
      preparedItems.push({
        menuItemId: mi.id,
        itemName: mi.name,
        quantity: qty,
        unitPrice: price,
        total: lineTotal,
      });
    }

    const orderNumber = generateOrderNumber();

    const [newOrder] = await db
      .insert(orders)
      .values({
        orderNumber,
        userId: user?.id ?? null,
        customerName: customerName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        notes: notes?.toString().trim() || null,
        paymentMethod: paymentMethod?.toString().trim() || "cash",
        total: total.toFixed(2),
        status: "new",
      })
      .returning();

    for (const it of preparedItems) {
      await db.insert(orderItems).values({
        orderId: newOrder.id,
        menuItemId: it.menuItemId,
        itemName: it.itemName,
        quantity: it.quantity,
        unitPrice: it.unitPrice.toFixed(2),
        total: it.total.toFixed(2),
      });
    }

    const whatsappMessage = buildNewOrderMessage({
      orderNumber,
      customerName: customerName.trim(),
      total: total.toFixed(2),
      phone: phone.trim(),
      address: address.trim(),
      items: preparedItems.map((p) => ({ name: p.itemName, qty: p.quantity })),
    });
    const whatsappUrl = buildWhatsAppUrl(whatsappMessage);

    return NextResponse.json({
      success: true,
      orderNumber,
      orderId: newOrder.id,
      total: total.toFixed(2),
      whatsappUrl,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Create order error:", msg);
    return NextResponse.json(
      { error: "فشل إنشاء الطلب", details: msg },
      { status: 500 }
    );
  }
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ orders: [] });
  }
  const userOrders = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      customerName: orders.customerName,
      phone: orders.phone,
      address: orders.address,
      notes: orders.notes,
      paymentMethod: orders.paymentMethod,
      total: orders.total,
      status: orders.status,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .where(eq(orders.userId, user.id))
    .orderBy(desc(orders.createdAt));

  const orderIds = userOrders.map((o) => o.id);
  let allItems: (typeof orderItems.$inferSelect)[] = [];
  if (orderIds.length > 0) {
    allItems = await db
      .select()
      .from(orderItems)
      .where(inArray(orderItems.orderId, orderIds));
  }

  const itemsByOrder = new Map<number, (typeof allItems)[number][]>();
  for (const it of allItems) {
    const arr = itemsByOrder.get(it.orderId) || [];
    arr.push(it);
    itemsByOrder.set(it.orderId, arr);
  }

  return NextResponse.json({
    orders: userOrders.map((o) => ({
      ...o,
      items: itemsByOrder.get(o.id) || [],
    })),
  });
}
