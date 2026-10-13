"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type NewOrderNotif = {
  orderNumber: string;
  customerName: string;
  total: string;
  id: number;
};

export default function AdminCheck() {
  const [isStaff, setIsStaff] = useState(false);
  const [notif, setNotif] = useState<NewOrderNotif | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastOrderId = useRef<number>(0);

  useEffect(() => {
    // Determine if current user is staff by checking a cookie set by layout.
    // Instead of a dedicated endpoint, we will piggy-back by fetching /api/auth/me.
    let cancelled = false;
    let interval: ReturnType<typeof setInterval>;

    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data?.user && (data.user.role === "admin" || data.user.role === "supervisor")) {
          setIsStaff(true);
          lastOrderId.current = Date.now();
          startPolling();
        }
      })
      .catch(() => {});

    function startPolling() {
      interval = setInterval(async () => {
        try {
          const res = await fetch("/api/admin/new-orders?since=" + lastOrderId.current);
          if (!res.ok) return;
          const data = await res.json();
          if (data && data.orders && data.orders.length > 0) {
            const latest = data.orders[0];
            lastOrderId.current = Math.max(lastOrderId.current, latest.id);
            setNotif(latest);
            // Play a subtle beep using WebAudio
            try {
              const ctx = new (window.AudioContext ||
                (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.frequency.value = 880;
              gain.gain.setValueAtTime(0.2, ctx.currentTime);
              gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
              osc.start();
              osc.stop(ctx.currentTime + 0.6);
            } catch {}
          }
        } catch {}
      }, 15000);
    }

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
    };
  }, []);

  if (!isStaff || !notif) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 max-w-xs w-80 animate-slide-up">
      <div className="card bg-gradient-to-l from-red-700 to-red-600 text-white shadow-2xl border-red-500">
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl flame">🔔</span>
              <div>
                <div className="font-black">طلب جديد!</div>
                <div className="text-sm opacity-90">رقم الطلب: {notif.orderNumber}</div>
              </div>
            </div>
            <button
              onClick={() => setNotif(null)}
              className="text-white/80 hover:text-white text-xl leading-none"
              aria-label="إغلاق"
            >
              ×
            </button>
          </div>
          <div className="mt-2 text-sm">
            <div>العميل: <span className="font-bold">{notif.customerName}</span></div>
            <div>الإجمالي: <span className="font-bold">{notif.total} جنيه</span></div>
          </div>
          <Link
            href={`/admin/orders#${notif.orderNumber}`}
            onClick={() => setNotif(null)}
            className="mt-3 inline-flex w-full items-center justify-center gap-1 rounded-lg bg-white text-red-700 font-bold px-3 py-2 text-sm hover:bg-amber-100 transition"
          >
            عرض التفاصيل ←
          </Link>
        </div>
      </div>
    </div>
  );
}
