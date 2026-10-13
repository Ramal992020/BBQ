"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ORDER_STATUS_LABELS,
  type OrderStatus,
} from "@/db/schema";
import { formatEGP, formatArDate } from "@/lib/utils";

type OrderItem = {
  id: number;
  itemName: string;
  quantity: number;
  unitPrice: string;
  total: string;
};

type Order = {
  id: number;
  orderNumber: string;
  customerName: string;
  phone: string;
  address: string;
  notes: string | null;
  paymentMethod: string;
  total: string;
  status: OrderStatus;
  createdAt: string;
  items: OrderItem[];
};

type Stats = {
  byStatus: Record<string, number>;
  totalToday: number;
  totalSales: number;
};

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: "all", label: "الكل" },
  { value: "new", label: "طلب جديد" },
  { value: "received", label: "تم الاستلام" },
  { value: "preparing", label: "جاري التجهيز" },
  { value: "out_for_delivery", label: "خرج للتوصيل" },
  { value: "delivered", label: "تم التوصيل" },
  { value: "cancelled", label: "ملغي" },
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<Stats>({
    byStatus: {},
    totalToday: 0,
    totalSales: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [todayOnly, setTodayOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Order | null>(null);
  const [updating, setUpdating] = useState<number | null>(null);
  const [forbidden, setForbidden] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filter !== "all") params.set("status", filter);
      if (todayOnly) params.set("today", "1");
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/orders?${params.toString()}`);
      if (res.status === 403) {
        setForbidden(true);
        return;
      }
      const data = await res.json();
      setOrders(data.orders || []);
      setStats(data.stats || { byStatus: {}, totalToday: 0, totalSales: 0 });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filter, todayOnly, search]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Poll every 10 seconds for live updates
  useEffect(() => {
    const t = setInterval(fetchOrders, 10000);
    return () => clearInterval(t);
  }, [fetchOrders]);

  const updateStatus = async (orderId: number, status: OrderStatus) => {
    setUpdating(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        await fetchOrders();
        if (selected?.id === orderId) {
          setSelected((prev) => (prev ? { ...prev, status } : prev));
        }
      }
    } finally {
      setUpdating(null);
    }
  };

  if (forbidden) {
    return (
      <div className="bbq-container py-16 text-center">
        <div className="text-6xl mb-4">🚫</div>
        <h1 className="text-2xl font-black">غير مصرح بالدخول</h1>
      </div>
    );
  }

  return (
    <div className="bbq-container py-6">
      <h1 className="text-3xl font-black mb-4">
        <span className="text-red-700">إدارة</span> الطلبات
      </h1>

      {/* Stats row */}
      <div className="grid grid-cols-3 md:grid-cols-7 gap-2 mb-5">
        {STATUS_FILTERS.map((f) => {
          const count =
            f.value === "all"
              ? stats.totalToday
              : stats.byStatus?.[f.value] || 0;
          const active = filter === f.value;
          return (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`card p-2 text-center transition ${
                active
                  ? "bg-red-700 text-white border-red-700"
                  : "hover:border-red-300"
              }`}
            >
              <div className="text-xs font-semibold">{f.label}</div>
              <div className="text-lg font-black">{count}</div>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="card p-4 mb-4 flex flex-wrap gap-3 items-center">
        <input
          type="search"
          placeholder="ابحث (رقم الطلب / الاسم / الهاتف)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input flex-1 min-w-[200px]"
        />
        <label className="inline-flex items-center gap-2 font-semibold text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={todayOnly}
            onChange={(e) => setTodayOnly(e.target.checked)}
            className="w-4 h-4 accent-red-700"
          />
          طلبات اليوم فقط
        </label>
        <button onClick={fetchOrders} className="btn-secondary">
          تحديث
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10">جاري التحميل...</div>
      ) : orders.length === 0 ? (
        <div className="card p-10 text-center text-stone-500">
          لا توجد طلبات مطابقة.
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <OrderRow
              key={o.id}
              order={o}
              selected={selected?.id === o.id}
              onSelect={() => setSelected(o)}
              onUpdateStatus={(s) => updateStatus(o.id, s)}
              updating={updating === o.id}
            />
          ))}
        </div>
      )}

      {selected && (
        <OrderDetailModal
          order={selected}
          onClose={() => setSelected(null)}
          onUpdateStatus={(s) => updateStatus(selected.id, s)}
          updating={updating === selected.id}
        />
      )}
    </div>
  );
}

function OrderRow({
  order,
  selected,
  onSelect,
  onUpdateStatus,
  updating,
}: {
  order: Order;
  selected: boolean;
  onSelect: () => void;
  onUpdateStatus: (s: OrderStatus) => void;
  updating: boolean;
}) {
  const statusColor: Record<string, string> = {
    new: "bg-amber-100 text-amber-800",
    received: "bg-blue-100 text-blue-800",
    preparing: "bg-orange-100 text-orange-800",
    out_for_delivery: "bg-purple-100 text-purple-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };

  return (
    <div
      id={order.orderNumber}
      className={`card p-4 scroll-mt-28 ${
        selected ? "border-red-500 ring-2 ring-red-200" : ""
      } ${order.status === "new" ? "animate-pulse-bounce-once" : ""}`}
    >
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <button
            onClick={onSelect}
            className="w-11 h-11 rounded-full bg-red-100 text-red-700 font-black flex items-center justify-center hover:bg-red-200 transition"
          >
            #{order.id}
          </button>
          <div>
            <div className="font-black flex items-center gap-2 flex-wrap">
              {order.orderNumber}
              <span
                className={`badge ${statusColor[order.status] || ""}`}
              >
                {ORDER_STATUS_LABELS[order.status]}
              </span>
            </div>
            <div className="text-sm text-stone-600">
              👤 {order.customerName} · 📱{" "}
              <a href={`tel:${order.phone}`} className="underline">
                {order.phone}
              </a>
            </div>
            <div className="text-xs text-stone-500 truncate max-w-md">
              📍 {order.address}
            </div>
          </div>
        </div>
        <div className="text-left">
          <div className="text-xl font-black text-red-700">
            {formatEGP(order.total)}
          </div>
          <div className="text-xs text-stone-500">
            {formatArDate(order.createdAt)}
          </div>
          <div className="text-xs text-stone-500">{order.items.length} صنف</div>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 flex-wrap">
        <button onClick={onSelect} className="btn-secondary text-sm py-1.5">
          عرض التفاصيل
        </button>
        <div className="flex gap-1 flex-wrap">
          {(["received", "preparing", "out_for_delivery", "delivered", "cancelled"] as OrderStatus[]).map(
            (s) => (
              <button
                key={s}
                disabled={updating || order.status === s}
                onClick={() => onUpdateStatus(s)}
                className={`text-xs px-2 py-1 rounded-lg font-bold transition ${
                  order.status === s
                    ? "bg-stone-800 text-white"
                    : "bg-stone-100 hover:bg-stone-200 text-stone-700"
                } disabled:opacity-50`}
              >
                → {ORDER_STATUS_LABELS[s]}
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}

function OrderDetailModal({
  order,
  onClose,
  onUpdateStatus,
  updating,
}: {
  order: Order;
  onClose: () => void;
  onUpdateStatus: (s: OrderStatus) => void;
  updating: boolean;
}) {
  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-2 md:p-4"
      onClick={onClose}
    >
      <div
        className="card w-full max-w-xl max-h-[90vh] overflow-y-auto animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white">
          <div>
            <div className="font-black text-lg">{order.orderNumber}</div>
            <div className="text-xs text-stone-500">
              {formatArDate(order.createdAt)}
            </div>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-900 text-2xl leading-none">
            ×
          </button>
        </div>
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <div className="text-stone-500">العميل</div>
              <div className="font-bold">{order.customerName}</div>
            </div>
            <div>
              <div className="text-stone-500">الهاتف</div>
              <a href={`tel:${order.phone}`} className="font-bold text-blue-600 underline">
                {order.phone}
              </a>
            </div>
            <div className="col-span-2">
              <div className="text-stone-500">العنوان</div>
              <div className="font-bold">{order.address}</div>
            </div>
            {order.notes && (
              <div className="col-span-2">
                <div className="text-stone-500">ملاحظات</div>
                <div className="font-bold">{order.notes}</div>
              </div>
            )}
            <div>
              <div className="text-stone-500">الدفع</div>
              <div className="font-bold">
                {order.paymentMethod === "cash" ? "💵 كاش" : order.paymentMethod}
              </div>
            </div>
            <div>
              <div className="text-stone-500">الحالة</div>
              <div className="font-bold">{ORDER_STATUS_LABELS[order.status]}</div>
            </div>
          </div>

          <div className="border-t pt-3">
            <div className="font-black mb-2">الأصناف ({order.items.length})</div>
            <div className="space-y-1.5 text-sm">
              {order.items.map((it) => (
                <div key={it.id} className="flex justify-between items-center">
                  <span>
                    <span className="font-bold text-red-700">{it.quantity}×</span>{" "}
                    {it.itemName}
                  </span>
                  <span className="font-bold">{formatEGP(it.total)}</span>
                </div>
              ))}
            </div>
            <div className="border-t mt-3 pt-3 flex justify-between text-xl font-black text-red-700">
              <span>الإجمالي</span>
              <span>{formatEGP(order.total)}</span>
            </div>
          </div>

          <div className="border-t pt-3">
            <div className="font-black mb-2">تغيير الحالة</div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {(Object.keys(ORDER_STATUS_LABELS) as OrderStatus[]).map((s) => (
                <button
                  key={s}
                  disabled={updating || order.status === s}
                  onClick={() => onUpdateStatus(s)}
                  className={`text-sm px-2 py-2 rounded-lg font-bold transition ${
                    order.status === s
                      ? "bg-stone-800 text-white"
                      : "bg-stone-100 hover:bg-stone-200 text-stone-700"
                  } disabled:opacity-50`}
                >
                  {ORDER_STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
