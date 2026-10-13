import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import Link from "next/link";
import { db } from "@/db";
import { orders, orderItems, ORDER_STATUS_LABELS } from "@/db/schema";
import { eq, desc, gte, inArray, and } from "drizzle-orm";
import { formatEGP } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const user = await getSessionUser();
  if (!user || (user.role !== "admin" && user.role !== "supervisor")) {
    redirect("/account?redirect=/admin");
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayOrders = await db
    .select()
    .from(orders)
    .where(gte(orders.createdAt, todayStart))
    .orderBy(desc(orders.createdAt));

  const counts: Record<string, number> = {};
  let todayTotal = 0;
  for (const o of todayOrders) {
    counts[o.status] = (counts[o.status] || 0) + 1;
    if (o.status !== "cancelled") {
      todayTotal += parseFloat(o.total as string);
    }
  }

  const recentOrders = await db
    .select()
    .from(orders)
    .orderBy(desc(orders.createdAt))
    .limit(10);

  const orderIds = recentOrders.map((o) => o.id);
  let items: (typeof orderItems.$inferSelect)[] = [];
  if (orderIds.length) {
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

  const statsCards = [
    {
      label: "إجمالي طلبات اليوم",
      value: todayOrders.length,
      icon: "📦",
      color: "bg-blue-50 text-blue-700 border-blue-200",
    },
    {
      label: "طلبات جديدة",
      value: counts["new"] || 0,
      icon: "🔔",
      color: "bg-amber-50 text-amber-700 border-amber-200",
    },
    {
      label: "جاري التجهيز",
      value: counts["preparing"] || 0,
      icon: "🔥",
      color: "bg-orange-50 text-orange-700 border-orange-200",
    },
    {
      label: "خرج للتوصيل",
      value: counts["out_for_delivery"] || 0,
      icon: "🚚",
      color: "bg-purple-50 text-purple-700 border-purple-200",
    },
    {
      label: "تم التوصيل",
      value: counts["delivered"] || 0,
      icon: "✅",
      color: "bg-green-50 text-green-700 border-green-200",
    },
    {
      label: "مبيعات اليوم",
      value: formatEGP(todayTotal),
      icon: "💰",
      color: "bg-red-50 text-red-700 border-red-200",
    },
  ];

  return (
    <div className="bbq-container py-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-3xl font-black">
            <span className="text-red-700">لوحة</span> الإدارة
          </h1>
          <p className="text-stone-500 text-sm">
            مرحبًا، {user.name} ({user.role === "admin" ? "مدير" : "مشرف"})
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href="/admin/orders" className="btn-primary">
            📋 إدارة الطلبات
          </Link>
          {user.role === "admin" && (
            <>
              <Link href="/admin/menu" className="btn-secondary">
                🍔 إدارة المنيو
              </Link>
              <Link href="/admin/users" className="btn-secondary">
                👥 المستخدمون
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {statsCards.map((s) => (
          <div key={s.label} className={`card p-4 border ${s.color}`}>
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-xs text-stone-500 font-semibold mb-0.5">
              {s.label}
            </div>
            <div className="text-xl font-black">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b bg-stone-50 flex items-center justify-between">
          <h2 className="font-black">أحدث الطلبات</h2>
          <Link href="/admin/orders" className="text-red-700 font-bold text-sm hover:underline">
            عرض الكل ←
          </Link>
        </div>
        <div className="divide-y divide-stone-100">
          {recentOrders.length === 0 && (
            <div className="p-6 text-center text-stone-500">لا توجد طلبات بعد</div>
          )}
          {recentOrders.map((o) => {
            const oItems = itemsByOrder.get(o.id) || [];
            return (
              <Link
                key={o.id}
                href={`/admin/orders#${o.orderNumber}`}
                className="p-4 flex items-center gap-3 hover:bg-stone-50 transition block"
              >
                <div className="w-12 h-12 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-black shrink-0">
                  #{o.id}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black">{o.orderNumber}</span>
                    <span className="badge bg-stone-100 text-stone-700">
                      {ORDER_STATUS_LABELS[o.status as keyof typeof ORDER_STATUS_LABELS]}
                    </span>
                  </div>
                  <div className="text-sm text-stone-600 truncate">
                    {o.customerName} - {o.phone} - {oItems.length} صنف
                  </div>
                </div>
                <div className="text-left shrink-0">
                  <div className="font-black text-red-700">{formatEGP(o.total as string)}</div>
                  <div className="text-xs text-stone-400">
                    {new Date(o.createdAt).toLocaleTimeString("ar-EG", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
