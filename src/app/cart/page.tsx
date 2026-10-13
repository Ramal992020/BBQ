"use client";

import { useCart } from "@/components/cart-context";
import { formatEGP } from "@/lib/utils";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function CartPage() {
  const { items, updateQuantity, removeItem, total, clear } = useCart();

  // Checkout form state
  const [user, setUser] = useState<{
    id?: number;
    name: string;
    email: string;
    phone?: string | null;
    role?: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    orderNumber: string;
    whatsappUrl: string;
    total: string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data?.user) {
          setUser(data.user);
          setCustomerName(data.user.name || "");
          setPhone(data.user.phone || "");
        }
      })
      .catch(() => {});
  }, []);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!customerName.trim() || !phone.trim() || !address.trim()) {
      setError("برجاء إدخال الاسم والهاتف والعنوان");
      return;
    }
    if (items.length === 0) {
      setError("السلة فارغة!");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          phone,
          address,
          notes,
          paymentMethod,
          items: items.map((i) => ({ menuItemId: i.menuItemId, quantity: i.quantity })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "فشل إنشاء الطلب");
        return;
      }
      setSuccess({
        orderNumber: data.orderNumber,
        whatsappUrl: data.whatsappUrl,
        total: data.total,
      });
      clear();
    } catch (err) {
      setError("حدث خطأ، برجاء المحاولة لاحقًا");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="bbq-container py-10">
        <div className="card p-8 text-center max-w-lg mx-auto">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-3xl font-black text-stone-900 mb-2">
            تم استلام طلبك!
          </h1>
          <p className="text-stone-600 mb-4">
            رقم الطلب:{" "}
            <span className="font-black text-red-700 text-xl">
              {success.orderNumber}
            </span>
          </p>
          <p className="text-stone-600 mb-6">
            الإجمالي:{" "}
            <span className="font-black text-green-700 text-xl">
              {formatEGP(success.total)}
            </span>
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            {user ? (
              <Link href="/orders" className="btn-primary">
                📋 عرض طلباتي
              </Link>
            ) : (
              <Link href="/account" className="btn-primary">
                👤 تسجيل الدخول لمتابعة الطلب
              </Link>
            )}
            <a
              href={success.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary bg-green-600 text-white hover:bg-green-700"
            >
              📱 إرسال للواتساب
            </a>
          </div>
          <div className="mt-6 text-sm text-stone-500">
            سيتم التواصل معك قريبًا لتأكيد الطلب. يمكنك متابعة حالة الطلب من
            صفحة "طلباتي".
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bbq-container py-16 text-center">
        <div className="text-6xl mb-4">🛒</div>
        <h1 className="text-3xl font-black mb-2">سلتك فارغة</h1>
        <p className="text-stone-600 mb-6">ابدأ بإضافة أصناف من المنيو</p>
        <Link href="/menu" className="btn-primary px-6 py-3">
          تصفح المنيو
        </Link>
      </div>
    );
  }

  return (
    <div className="bbq-container py-6">
      <h1 className="text-3xl font-black mb-6">
        <span className="text-red-700">سلة</span> الطلبات
      </h1>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Items */}
        <div className="lg:col-span-2 space-y-3">
          {items.map((item) => (
            <div
              key={item.menuItemId}
              className="card p-3 flex items-center gap-3"
            >
              <div className="w-20 h-20 rounded-xl bg-stone-100 overflow-hidden shrink-0">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl">
                    🍔
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-black truncate">{item.name}</div>
                <div className="text-red-700 font-bold">
                  {formatEGP(item.price)}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() =>
                    updateQuantity(item.menuItemId, item.quantity - 1)
                  }
                  className="w-8 h-8 rounded-lg bg-stone-100 hover:bg-stone-200 font-black"
                >
                  −
                </button>
                <div className="w-8 text-center font-bold">{item.quantity}</div>
                <button
                  onClick={() =>
                    updateQuantity(item.menuItemId, item.quantity + 1)
                  }
                  className="w-8 h-8 rounded-lg bg-red-600 text-white hover:bg-red-700 font-black"
                >
                  +
                </button>
              </div>
              <button
                onClick={() => removeItem(item.menuItemId)}
                className="text-stone-400 hover:text-red-600 p-2"
                aria-label="حذف"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>

        {/* Checkout form */}
        <div className="card p-5 h-fit lg:sticky lg:top-28">
          <h2 className="font-black text-xl mb-4">إتمام الطلب</h2>
          <form onSubmit={handleCheckout} className="space-y-3">
            {!user && (
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
                💡 <Link href="/account" className="font-bold underline">سجل دخولك</Link> أو أنشئ حسابًا لتتمكن من متابعة طلباتك لاحقًا.
              </div>
            )}
            <div>
              <label className="label">الاسم</label>
              <input
                className="input"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">رقم الهاتف</label>
              <input
                className="input"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">العنوان</label>
              <textarea
                className="input"
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">ملاحظات (اختياري)</label>
              <textarea
                className="input"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <div>
              <label className="label">طريقة الدفع</label>
              <select
                className="input"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="cash">💵 كاش عند الاستلام</option>
                <option value="wallet">📱 محفظة إلكترونية</option>
                <option value="card">💳 بطاقة</option>
              </select>
            </div>

            <div className="border-t border-stone-200 pt-3 mt-3">
              <div className="flex justify-between mb-1">
                <span className="text-stone-600">الإجمالي الفرعي</span>
                <span className="font-bold">{formatEGP(total)}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span className="text-stone-600">التوصيل</span>
                <span className="font-bold text-green-600">مجانًا (حسب المنطقة)</span>
              </div>
              <div className="flex justify-between text-xl font-black text-red-700 border-t border-stone-200 pt-2 mt-2">
                <span>الإجمالي</span>
                <span>{formatEGP(total)}</span>
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn-primary w-full py-3 text-base"
              disabled={submitting}
            >
              {submitting ? "جاري إرسال الطلب..." : "✅ تأكيد الطلب"}
            </button>
            <button
              type="button"
              onClick={clear}
              className="btn-secondary w-full text-sm"
            >
              إفراغ السلة
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
