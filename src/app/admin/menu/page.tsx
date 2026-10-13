"use client";

import { useEffect, useState } from "react";
import { formatEGP } from "@/lib/utils";

type MenuItem = {
  id: number;
  code: string;
  name: string;
  category: string;
  description: string | null;
  price: string;
  available: boolean;
  featured: boolean;
  image: string | null;
};

const CATEGORIES = [
  "برجر فحم",
  "تشكن برجر",
  "سماش برجر",
  "وجبات",
  "رول ساندوتش",
  "رول بطاطس",
  "بطاطس",
  "إضافات",
  "مشروبات",
];

export default function AdminMenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [filterCat, setFilterCat] = useState("all");

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/menu?all=1");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setItems(data.items || []);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Verify admin
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (!data.user || data.user.role !== "admin") {
          setForbidden(true);
          return;
        }
        fetchItems();
      });
  }, []);

  const onSave = async (form: Partial<MenuItem>) => {
    try {
      let res;
      if (editing) {
        res = await fetch(`/api/admin/menu/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      } else {
        res = await fetch(`/api/admin/menu`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      }
      if (res.ok) {
        setShowForm(false);
        setEditing(null);
        await fetchItems();
      } else {
        const d = await res.json();
        alert(d.error || "فشل الحفظ");
      }
    } catch {
      alert("فشل الحفظ");
    }
  };

  const onDelete = async (id: number) => {
    if (!confirm("هل أنت متأكد من الحذف؟")) return;
    const res = await fetch(`/api/admin/menu/${id}`, { method: "DELETE" });
    if (res.ok) fetchItems();
    else alert("فشل الحذف");
  };

  const filtered =
    filterCat === "all" ? items : items.filter((i) => i.category === filterCat);

  if (forbidden) {
    return (
      <div className="bbq-container py-16 text-center">
        <div className="text-6xl mb-4">🚫</div>
        <h1 className="text-2xl font-black">هذه الصفحة للمدير فقط</h1>
      </div>
    );
  }

  return (
    <div className="bbq-container py-6">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <h1 className="text-3xl font-black">
          <span className="text-red-700">إدارة</span> المنيو
        </h1>
        <div className="flex gap-2">
          <button
            onClick={fetchItems}
            className="btn-secondary"
          >
            تحديث
          </button>
          <button
            onClick={() => {
              setEditing(null);
              setShowForm(true);
            }}
            className="btn-primary"
          >
            + صنف جديد
          </button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-3 mb-4">
        <button
          onClick={() => setFilterCat("all")}
          className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-bold ${
            filterCat === "all" ? "bg-red-700 text-white" : "bg-white border"
          }`}
        >
          الكل ({items.length})
        </button>
        {CATEGORIES.filter((c) => items.some((i) => i.category === c)).map((c) => (
          <button
            key={c}
            onClick={() => setFilterCat(c)}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-bold ${
              filterCat === c ? "bg-red-700 text-white" : "bg-white border"
            }`}
          >
            {c} ({items.filter((i) => i.category === c).length})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-10">جاري التحميل...</div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-stone-50 text-stone-700">
                <tr>
                  <th className="p-3 text-right">الصورة</th>
                  <th className="p-3 text-right">الاسم</th>
                  <th className="p-3 text-right">الكود</th>
                  <th className="p-3 text-right">التصنيف</th>
                  <th className="p-3 text-right">السعر</th>
                  <th className="p-3 text-right">متاح</th>
                  <th className="p-3 text-right">مميز</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((it) => (
                  <tr key={it.id} className="hover:bg-stone-50">
                    <td className="p-3">
                      <div className="w-12 h-12 rounded-lg bg-stone-100 overflow-hidden">
                        {it.image ? (
                          <img src={it.image} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xl">🍔</div>
                        )}
                      </div>
                    </td>
                    <td className="p-3 font-bold">{it.name}</td>
                    <td className="p-3 font-mono text-xs">{it.code}</td>
                    <td className="p-3">{it.category}</td>
                    <td className="p-3 font-bold text-red-700">
                      {formatEGP(it.price)}
                    </td>
                    <td className="p-3">
                      <button
                        onClick={async () => {
                          await fetch(`/api/admin/menu/${it.id}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ available: !it.available }),
                          });
                          fetchItems();
                        }}
                        className={`badge ${it.available ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                      >
                        {it.available ? "نعم" : "لا"}
                      </button>
                    </td>
                    <td className="p-3">
                      <button
                        onClick={async () => {
                          await fetch(`/api/admin/menu/${it.id}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ featured: !it.featured }),
                          });
                          fetchItems();
                        }}
                        className={`badge ${it.featured ? "bg-amber-100 text-amber-700" : "bg-stone-100 text-stone-600"}`}
                      >
                        {it.featured ? "⭐" : "—"}
                      </button>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            setEditing(it);
                            setShowForm(true);
                          }}
                          className="text-blue-600 font-bold text-xs hover:underline"
                        >
                          تعديل
                        </button>
                        <button
                          onClick={() => onDelete(it.id)}
                          className="text-red-600 font-bold text-xs hover:underline"
                        >
                          حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && (
        <ItemForm
          initial={editing}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
          onSave={onSave}
        />
      )}
    </div>
  );
}

function ItemForm({
  initial,
  onClose,
  onSave,
}: {
  initial: MenuItem | null;
  onClose: () => void;
  onSave: (data: Partial<MenuItem>) => void;
}) {
  const [form, setForm] = useState<Partial<MenuItem>>({
    code: initial?.code || "",
    name: initial?.name || "",
    category: initial?.category || CATEGORIES[0],
    description: initial?.description || "",
    price: initial?.price || "",
    available: initial?.available ?? true,
    featured: initial?.featured ?? false,
    image: initial?.image || "",
  });
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok) setForm({ ...form, image: data.url });
      else alert(data.error || "فشل الرفع");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2 md:p-4" onClick={onClose}>
      <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white">
          <h2 className="font-black text-lg">
            {initial ? "تعديل صنف" : "صنف جديد"}
          </h2>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-900 text-2xl leading-none">
            ×
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave(form);
          }}
          className="p-4 space-y-3"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">الكود</label>
              <input
                className="input"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">السعر (جنيه)</label>
              <input
                className="input"
                type="number"
                step="0.01"
                min="0"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                required
              />
            </div>
          </div>
          <div>
            <label className="label">الاسم</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label">التصنيف</label>
            <select
              className="input"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">الوصف</label>
            <textarea
              className="input"
              rows={2}
              value={form.description || ""}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div>
            <label className="label">رابط الصورة</label>
            <input
              className="input"
              value={form.image || ""}
              onChange={(e) => setForm({ ...form, image: e.target.value })}
              placeholder="/menu/xxx.jpg"
            />
          </div>
          <div>
            <label className="label">أو رفع صورة من الجهاز</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleUpload}
              disabled={uploading}
              className="block w-full text-sm file:mr-2 file:px-3 file:py-2 file:rounded-lg file:border-0 file:font-bold file:bg-red-600 file:text-white hover:file:bg-red-700"
            />
            {uploading && <div className="text-xs mt-1">جاري الرفع...</div>}
          </div>
          {form.image && (
            <div>
              <img src={form.image} className="w-32 h-32 object-cover rounded-lg" alt="preview" />
            </div>
          )}
          <div className="flex gap-4">
            <label className="inline-flex items-center gap-2 font-semibold text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={form.available}
                onChange={(e) => setForm({ ...form, available: e.target.checked })}
                className="w-4 h-4 accent-red-700"
              />
              متاح
            </label>
            <label className="inline-flex items-center gap-2 font-semibold text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                className="w-4 h-4 accent-red-700"
              />
              مميز
            </label>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="submit" className="btn-primary flex-1">
              {initial ? "حفظ التغييرات" : "إضافة"}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
