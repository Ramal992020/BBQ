"use client";

import { useEffect, useState } from "react";

type User = {
  id: number;
  name: string;
  email: string;
  role: "customer" | "supervisor" | "admin";
  active: boolean;
  phone: string | null;
  createdAt: string;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [updating, setUpdating] = useState<number | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      if (res.status === 403) {
        setForbidden(true);
        return;
      }
      const data = await res.json();
      setUsers(data.users || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (!data.user || data.user.role !== "admin") {
          setForbidden(true);
          return;
        }
        fetchUsers();
      });
  }, []);

  const updateUser = async (id: number, fields: Partial<User>) => {
    setUpdating(id);
    try {
      const res = await fetch(`/api/admin/users`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...fields }),
      });
      const data = await res.json();
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === id ? { ...u, ...data.user } : u))
        );
      } else {
        alert(data.error || "فشل التحديث");
      }
    } finally {
      setUpdating(null);
    }
  };

  if (forbidden) {
    return (
      <div className="bbq-container py-16 text-center">
        <div className="text-6xl mb-4">🚫</div>
        <h1 className="text-2xl font-black">هذه الصفحة للمدير فقط</h1>
      </div>
    );
  }

  const roleBadge = (r: string) => {
    if (r === "admin") return "bg-red-100 text-red-700";
    if (r === "supervisor") return "bg-amber-100 text-amber-700";
    return "bg-stone-100 text-stone-700";
  };
  const roleLabel = (r: string) =>
    r === "admin" ? "مدير" : r === "supervisor" ? "مشرف" : "عميل";

  return (
    <div className="bbq-container py-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h1 className="text-3xl font-black">
          <span className="text-red-700">إدارة</span> المستخدمين
        </h1>
        <button onClick={fetchUsers} className="btn-secondary">
          تحديث
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10">جاري التحميل...</div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 text-stone-700">
              <tr>
                <th className="p-3 text-right">الاسم</th>
                <th className="p-3 text-right">البريد</th>
                <th className="p-3 text-right">الهاتف</th>
                <th className="p-3 text-right">الدور</th>
                <th className="p-3 text-right">الحالة</th>
                <th className="p-3 text-right">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-stone-50">
                  <td className="p-3 font-bold">{u.name}</td>
                  <td className="p-3 font-mono text-xs">{u.email}</td>
                  <td className="p-3">{u.phone || "—"}</td>
                  <td className="p-3">
                    <span className={`badge ${roleBadge(u.role)}`}>
                      {roleLabel(u.role)}
                    </span>
                  </td>
                  <td className="p-3">
                    <span
                      className={`badge ${
                        u.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}
                    >
                      {u.active ? "نشط" : "معطل"}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1 flex-wrap">
                      {u.role !== "admin" && (
                        <>
                          {u.role === "customer" ? (
                            <button
                              disabled={updating === u.id}
                              onClick={() => updateUser(u.id, { role: "supervisor" })}
                              className="text-xs px-2 py-1 rounded-lg bg-amber-100 text-amber-800 font-bold hover:bg-amber-200 disabled:opacity-50"
                            >
                              ترقية لمشرف
                            </button>
                          ) : (
                            <button
                              disabled={updating === u.id}
                              onClick={() => updateUser(u.id, { role: "customer" })}
                              className="text-xs px-2 py-1 rounded-lg bg-stone-100 text-stone-700 font-bold hover:bg-stone-200 disabled:opacity-50"
                            >
                              خفض لعميل
                            </button>
                          )}
                        </>
                      )}
                      <button
                        disabled={updating === u.id}
                        onClick={() => updateUser(u.id, { active: !u.active })}
                        className={`text-xs px-2 py-1 rounded-lg font-bold disabled:opacity-50 ${
                          u.active
                            ? "bg-red-50 text-red-700 hover:bg-red-100"
                            : "bg-green-50 text-green-700 hover:bg-green-100"
                        }`}
                      >
                        {u.active ? "تعطيل" : "تفعيل"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
