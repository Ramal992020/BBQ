import { db } from "@/db";
import { menuItems } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import MenuItemCard from "@/components/menu-item-card";
import CategoryFilter from "@/components/category-filter";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ cat?: string; q?: string }>;
};

export default async function MenuPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const selectedCat = params.cat || "all";
  const search = params.q?.trim() || "";

  type Item = typeof menuItems.$inferSelect;
  let items: Item[] = [];
  try {
    items = await db
      .select()
      .from(menuItems)
      .where(eq(menuItems.available, true))
      .orderBy(asc(menuItems.category), asc(menuItems.price), asc(menuItems.name));
  } catch {
    items = [];
  }

  // Extract categories in fixed order
  const categoryOrder = [
    "برجر فحم",
    "تشكن برجر",
    "سماش برجر",
    "وجبات",
    "رول ساندوتش",
    "رول بطاطس",
    "بطاطس",
  ];
  const catSet = new Set(items.map((i) => i.category));
  const categories = categoryOrder.filter((c) => catSet.has(c));
  for (const c of catSet) if (!categories.includes(c)) categories.push(c);

  let filtered = items;
  if (selectedCat !== "all") {
    filtered = filtered.filter((i) => i.category === selectedCat);
  }
  if (search) {
    const s = search.toLowerCase();
    filtered = filtered.filter(
      (i) =>
        i.name.toLowerCase().includes(s) ||
        (i.description || "").toLowerCase().includes(s)
    );
  }

  // Group by category if viewing all, otherwise flat
  const grouped = new Map<string, typeof items>();
  for (const item of filtered) {
    const arr = grouped.get(item.category) || [];
    arr.push(item);
    grouped.set(item.category, arr);
  }

  return (
    <div className="bbq-container py-6">
      <div className="mb-6">
        <h1 className="text-3xl md:text-4xl font-black mb-2">
          <span className="text-red-700">المنيو</span>
        </h1>
        <p className="text-stone-600">
          اختار الأصناف اللي تحبها وأضفها للسلة لإكمال الطلب
        </p>
      </div>

      <CategoryFilter
        categories={categories}
        selected={selectedCat}
        search={search}
      />

      {filtered.length === 0 ? (
        <div className="card p-10 text-center text-stone-500">
          <div className="text-5xl mb-2">🔍</div>
          <div className="font-bold">لا توجد أصناف مطابقة</div>
        </div>
      ) : selectedCat === "all" && !search ? (
        <div className="space-y-8">
          {[...grouped.entries()].map(([cat, catItems]) => (
            <section key={cat}>
              <h2 className="text-2xl font-black mb-4 flex items-center gap-2 sticky top-28 md:top-20 bg-gradient-to-l from-[#fff7f0] via-[#fff7f0]/95 to-transparent py-2 z-10">
                <span className="inline-block w-2 h-8 bg-red-700 rounded-full"></span>
                {cat}
                <span className="text-sm font-bold text-stone-400">
                  ({catItems.length})
                </span>
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {catItems.map((item) => (
                  <MenuItemCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((item) => (
            <MenuItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
