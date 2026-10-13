"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ORDER_STATUS_FLOW,
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

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders");
      if (res.status === 401) {
        setError("يجب تسجيل الدخول");
        return;
      }
      const data = await res.json();
      setOrders(data.orders || []);
    } catch {
      setError("فشل تحميل الطلبات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // Poll every 15 seconds to update status live
    const interval = setInterval(fetchOrders, 15000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="bbq-container py-10 text-center">جاري تحميل طلباتك...</div>;
  }

  if (error === "يجب تسجيل الدخول") {
    return (
      <div className="bbq-container py-16 text-center">
        <div className="text-6xl mb-4">🔒</div>
        <h1 className="text-3xl font-black mb-2">يجب تسجيل الدخول</h1>
        <p className="text-stone-600 mb-6">
          سجل دخولك لعرض طلباتك السابقة ومتابعة الحالة.
        </p>
        <Link href="/account" className="btn-primary px-6 py-3">
          تسجيل الدخول / إنشاء حساب
        </Link>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="bbq-container py-16 text-center">
        <div className="text-6xl mb-4">📋</div>
        <h1 className="text-3xl font-black mb-2">لا توجد طلبات بعد</h1>
        <p className="text-stone-600 mb-6">ابدأ بطلب أول أوردر من المنيو</p>
        <Link href="/menu" className="btn-primary px-6 py-3">
          تصفح المنيو
        </Link>
      </div>
    );
  }

  return (
    <div className="bbq-container py-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-black mb-6">
        <span className="text-red-700">طلباتي</span>
      </h1>
      <div className="space-y-4">
        {orders.map((order) => (
          <OrderCard key={order.id} order={order} />
        ))}
      </div>
    </div>
  );
}

function OrderCard({ order }: { order: Order }) {
  const statusLabels = ORDER_STATUS_LABELS;
  const flow = ORDER_STATUS_FLOW;
  const isCancelled = order.status === "cancelled";
  const currentIndex = isCancelled ? -1 : flow.indexOf(order.status);
  const payLabel: Record<string, string> = {
    cash: "💵 كاش",
    wallet: "📱 محفظة",
    card: "💳 بطاقة",
  };

  return (
    <div className="card overflow-hidden">
      <div
        className={`px-4 py-3 flex items-center justify-between border-b ${
          isCancelled
            ? "bg-red-50 border-red-200"
            : order.status === "delivered"
            ? "bg-green-50 border-green-200"
            : "bg-amber-50 border-amber-200"
        }`}
      >
        <div>
          <div className="font-black">
            <span className="text-stone-500 text-sm">رقم الطلب: </span>
            {order.orderNumber}
          </div>
          <div className="text-xs text-stone-500">
            {formatArDate(order.createdAt)}
          </div>
        </div>
        <div className="text-left">
          <div
            className={`badge ${
              isCancelled
                ? "bg-red-600 text-white"
                : order.status === "delivered"
                ? "bg-green-600 text-white"
                : "bg-amber-500 text-white"
            }`}
          >
            {statusLabels[order.status]}
          </div>
          <div className="text-lg font-black text-red-700 mt-1">
            {formatEGP(order.total)}
          </div>
        </div>
      </div>

      <div className="p-4">
        {!isCancelled && <Timeline currentIndex={currentIndex} />}
        <div className="mt-4 space-y-1 text-sm">
          {order.items.map((it) => (
            <div key={it.id} className="flex justify-between">
              <span>
                <span className="font-bold">{it.quantity}×</span> {it.itemName}
              </span>
              <span className="text-stone-600">{formatEGP(it.total)}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-3 border-t border-stone-100 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-stone-600">
          <div>
            <span className="text-stone-400">العنوان:</span> {order.address}
          </div>
          <div>
            <span className="text-stone-400">الهاتف:</span> {order.phone}
          </div>
          <div>
            <span className="text-stone-400">الدفع:</span>{" "}
            {payLabel[order.paymentMethod] || order.paymentMethod}
          </div>
          {order.notes && (
            <div className="col-span-2">
              <span className="text-stone-400">ملاحظات:</span> {order.notes}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Timeline({ currentIndex }: { currentIndex: number }) {
  const steps = ORDER_STATUS_FLOW;
  return (
    <div className="flex items-center justify-between">
      {steps.map((s, i) => {
        const done = i <= currentIndex;
        const current = i === currentIndex;
        return (
          <div key={s} className="flex-1 flex flex-col items-center relative">
            {i < steps.length - 1 && (
              <div
                className={`absolute top-4 right-[-50%] left-[50%] h-1 ${
                  i < currentIndex ? "bg-green-500" : "bg-stone-200"
                }`}
              />
            )}
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm z-10 relative ${
                done
                  ? current
                    ? "bg-amber-400 text-white animate-pulse-bounce ring-4 ring-amber-200"
                    : "bg-green-500 text-white"
                  : "bg-stone-200 text-stone-400"
              }`}
            >
              {done ? (current ? "●" : "✓") : i + 1}
            </div>
            <div
              className={`mt-1.5 text-[10px] md:text-xs text-center font-bold leading-tight ${
                done ? "text-stone-800" : "text-stone-400"
              }`}
            >
              {ORDER_STATUS_LABELS[s]}
            </div>
          </div>
        );
      })}
    </div>
  );
}
