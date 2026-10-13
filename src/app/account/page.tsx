"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type User = {
  id: number;
  name: string;
  email: string;
  role: "customer" | "supervisor" | "admin";
  phone: string | null;
};

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Profile edit state
  const [profileName, setProfileName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchUser();
  }, []);

  async function fetchUser() {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        setProfileName(data.user.name);
        setProfilePhone(data.user.phone || "");
      } else {
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const url = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "حدث خطأ");
        return;
      }
      await fetchUser();
      router.refresh();
      if (data.user?.role === "admin" || data.user?.role === "supervisor") {
        router.push("/admin");
      } else {
        router.push("/orders");
      }
    } catch {
      setError("حدث خطأ، برجاء المحاولة لاحقًا");
    } finally {
      setSubmitting(false);
    }
  };

  const onLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.refresh();
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg(null);
    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: profileName, phone: profilePhone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setProfileMsg(data.error || "فشل التحديث");
        return;
      }
      setUser(data.user);
      setProfileMsg("✅ تم تحديث البيانات بنجاح");
      router.refresh();
    } catch {
      setProfileMsg("حدث خطأ");
    } finally {
      setSavingProfile(false);
    }
  };

  if (loading) {
    return <div className="bbq-container py-10 text-center">جاري التحميل...</div>;
  }

  if (user) {
    const roleLabel =
      user.role === "admin"
        ? "مدير"
        : user.role === "supervisor"
        ? "مشرف"
        : "عميل";
    const roleColor =
      user.role === "admin"
        ? "bg-red-100 text-red-700"
        : user.role === "supervisor"
        ? "bg-amber-100 text-amber-700"
        : "bg-stone-100 text-stone-700";

    return (
      <div className="bbq-container py-6 max-w-2xl mx-auto">
        <div className="card p-6 mb-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-600 to-amber-500 text-white flex items-center justify-center text-3xl font-black">
              {user.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-black">{user.name}</h1>
              <div className="text-stone-500 text-sm">{user.email}</div>
              <span className={`badge ${roleColor} mt-1`}>{roleLabel}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/orders" className="btn-primary">
              📋 طلباتي
            </Link>
            {(user.role === "admin" || user.role === "supervisor") && (
              <Link href="/admin" className="btn-secondary bg-amber-100 text-amber-800">
                🛠️ لوحة الإدارة
              </Link>
            )}
            <button onClick={onLogout} className="btn-danger">
              تسجيل الخروج
            </button>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="font-black text-xl mb-4">تحديث بياناتي</h2>
          <form onSubmit={saveProfile} className="space-y-3">
            <div>
              <label className="label">الاسم</label>
              <input
                className="input"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">الهاتف</label>
              <input
                className="input"
                type="tel"
                value={profilePhone}
                onChange={(e) => setProfilePhone(e.target.value)}
              />
            </div>
            <div>
              <label className="label">البريد الإلكتروني</label>
              <input className="input" value={user.email} disabled />
            </div>
            {profileMsg && (
              <div
                className={`rounded-lg p-3 text-sm ${
                  profileMsg.startsWith("✅")
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {profileMsg}
              </div>
            )}
            <button type="submit" className="btn-primary" disabled={savingProfile}>
              {savingProfile ? "جاري الحفظ..." : "حفظ التغييرات"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="bbq-container py-6 max-w-md mx-auto">
      <div className="card p-6">
        <div className="text-center mb-4">
          <div className="text-4xl mb-2">👤</div>
          <h1 className="text-2xl font-black">
            {mode === "login" ? "تسجيل الدخول" : "إنشاء حساب جديد"}
          </h1>
          <p className="text-stone-500 text-sm mt-1">
            {mode === "login"
              ? "سجل دخولك لمتابعة طلباتك"
              : "أنشئ حسابك لتبدأ الطلب بسهولة"}
          </p>
        </div>

        <div className="flex rounded-xl bg-stone-100 p-1 mb-4">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError(null);
            }}
            className={`flex-1 py-2 rounded-lg font-bold text-sm transition ${
              mode === "login" ? "bg-white shadow text-red-700" : "text-stone-600"
            }`}
          >
            تسجيل الدخول
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("register");
              setError(null);
            }}
            className={`flex-1 py-2 rounded-lg font-bold text-sm transition ${
              mode === "register" ? "bg-white shadow text-red-700" : "text-stone-600"
            }`}
          >
            حساب جديد
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          {mode === "register" && (
            <div>
              <label className="label">الاسم</label>
              <input
                className="input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
          )}
          <div>
            <label className="label">البريد الإلكتروني</label>
            <input
              className="input"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              autoComplete="email"
            />
          </div>
          {mode === "register" && (
            <div>
              <label className="label">الهاتف (اختياري)</label>
              <input
                className="input"
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
          )}
          <div>
            <label className="label">كلمة المرور</label>
            <input
              className="input"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              minLength={6}
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button type="submit" className="btn-primary w-full py-3" disabled={submitting}>
            {submitting
              ? "جاري..."
              : mode === "login"
              ? "دخول"
              : "إنشاء الحساب"}
          </button>
        </form>

        <div className="mt-4 text-center text-xs text-stone-500">
          بالتسجيل أنت توافق على الشروط والأحكام.
        </div>
      </div>
    </div>
  );
}
