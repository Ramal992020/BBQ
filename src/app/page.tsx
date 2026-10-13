import Link from "next/link";
import { db } from "@/db";
import { menuItems } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import MenuItemCard from "@/components/menu-item-card";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // Try to query featured items; if table doesn't exist (first load), return empty.
  let featured: typeof menuItems.$inferSelect[] = [];
  try {
    featured = await db
      .select()
      .from(menuItems)
      .where(eq(menuItems.featured, true))
      .limit(6);
  } catch {
    featured = [];
  }

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/menu/hero-bbq.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-l from-black/80 via-black/60 to-red-900/70" />
        <div className="relative bbq-container py-20 md:py-28 text-white">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-400/20 border border-amber-400/40 px-4 py-1.5 text-amber-200 text-sm font-bold mb-4">
              <span className="flame">🔥</span> THE ORIGINAL BBQ
            </div>
            <h1 className="text-4xl md:text-6xl font-black leading-tight mb-4">
              أكل يستاهل<br />
              <span className="text-amber-400">كل قضمة</span>
            </h1>
            <p className="text-lg md:text-xl text-stone-200 mb-8 leading-relaxed">
              برجر فحم، تشكن برجر، سندوتشات، وجبات مشوية، وأكتر. اطلب أونلاين
              وهنوصلك لحد باب بيتك.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/menu" className="btn-primary text-base px-6 py-3">
                🍔 تصفح المنيو
              </Link>
              <a
                href="tel:01220785729"
                className="inline-flex items-center gap-2 rounded-xl bg-white/10 border border-white/20 px-6 py-3 font-bold text-white hover:bg-white/20 transition"
              >
                📞 01220785729
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bbq-container py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FeatureCard
            icon="🔥"
            title="فحم طبيعي"
            desc="كل برجر مشوي على الفحم لطعم وريحة لا تقاوم"
          />
          <FeatureCard
            icon="🚚"
            title="توصيل سريع"
            desc="توصيل لباب بيتك في بورسعيد في أسرع وقت"
          />
          <FeatureCard
            icon="⭐"
            title="جودة مميزة"
            desc="مكونات طازجة ولحوم بلدي متميزة"
          />
        </div>
      </section>

      {/* Featured items */}
      {featured.length > 0 && (
        <section className="bbq-container py-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-2xl md:text-3xl font-black text-stone-900">
              الأصناف <span className="text-red-700">المميزة</span>
            </h2>
            <Link href="/menu" className="text-red-700 font-bold hover:underline">
              عرض الكل ←
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {featured.map((it) => (
              <MenuItemCard key={it.id} item={it} />
            ))}
          </div>
        </section>
      )}

      {/* Categories quick-nav */}
      <section className="bbq-container py-10">
        <h2 className="text-2xl md:text-3xl font-black mb-5">
          <span className="text-red-700">تصنيفات</span>نا
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <CategoryCard name="برجر فحم" emoji="🍔" href="/menu?cat=برجر فحم" />
          <CategoryCard name="تشكن برجر" emoji="🍗" href="/menu?cat=تشكن برجر" />
          <CategoryCard name="سماش برجر" emoji="🍞" href="/menu?cat=سماش برجر" />
          <CategoryCard name="وجبات" emoji="🍽️" href="/menu?cat=وجبات" />
          <CategoryCard name="رول ساندوتش" emoji="🌯" href="/menu?cat=رول ساندوتش" />
          <CategoryCard name="بطاطس" emoji="🍟" href="/menu?cat=بطاطس" />
          <CategoryCard name="رول بطاطس" emoji="🥔" href="/menu?cat=رول بطاطس" />
          <CategoryCard name="عروض مميزة" emoji="✨" href="/menu" />
        </div>
      </section>

      {/* About */}
      <section className="bg-stone-900 text-stone-200 py-12 mt-10">
        <div className="bbq-container">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="text-5xl mb-3">🔥</div>
              <h3 className="text-3xl font-black text-white mb-3">
                عن The Original BBQ
              </h3>
              <p className="leading-relaxed text-stone-300 mb-4">
                بدأنا سنة 2018 وحافظنا على نفس الجودة والطعم. نستخدم أجود أنواع اللحوم
                البلدية الطازجة، وكل حاجة عندنا بتتحضر بأيدينا وبنفسنا.
              </p>
              <div className="rounded-xl bg-amber-400/10 border border-amber-400/20 p-4">
                <div className="font-bold text-amber-300 mb-1">📍 العنوان</div>
                <div className="text-sm">
                  بورسعيد: خلف مسجد لطفي شبارة - سور نادي رمسيس امام مدرسة علي مبارك
                </div>
                <div className="font-bold text-amber-300 mt-3 mb-1">📞 خدمة التوصيل</div>
                <a href="tel:01220785729" className="text-2xl font-black text-white hover:text-amber-300 transition">
                  01220785729
                </a>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <img src="/menu/charcoal-burger.jpg" alt="Burger" className="rounded-2xl aspect-square object-cover w-full" />
              <img src="/menu/meals-platter.jpg" alt="Meals" className="rounded-2xl aspect-square object-cover w-full" />
              <img src="/menu/wrap-sandwich.jpg" alt="Wraps" className="rounded-2xl aspect-square object-cover w-full" />
              <img src="/menu/loaded-fries.jpg" alt="Fries" className="rounded-2xl aspect-square object-cover w-full" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="card p-5">
      <div className="text-3xl mb-2">{icon}</div>
      <div className="font-black text-lg mb-1">{title}</div>
      <div className="text-stone-600 text-sm">{desc}</div>
    </div>
  );
}

function CategoryCard({ name, emoji, href }: { name: string; emoji: string; href: string }) {
  return (
    <Link
      href={href}
      className="card p-4 text-center hover:border-red-300 hover:shadow-md transition group"
    >
      <div className="text-4xl mb-2 group-hover:scale-110 transition">{emoji}</div>
      <div className="font-bold text-stone-800">{name}</div>
    </Link>
  );
}
