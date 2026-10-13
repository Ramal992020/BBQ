import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { CartProvider } from "@/components/cart-context";
import AdminCheck from "@/components/admin-check";

export const metadata: Metadata = {
  title: "The Original BBQ - ذا أوريجينال باربيكيو",
  description: "تطبيق الطلبات أونلاين - The Original BBQ",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const user = await getSessionUser();
  const isStaff = user && (user.role === "admin" || user.role === "supervisor");

  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col">
        <CartProvider>
          {/* Header */}
          <header className="sticky top-0 z-40 bg-gradient-to-l from-red-800 via-red-700 to-red-800 text-white shadow-lg">
            <div className="bbq-container flex items-center justify-between h-16 gap-3">
              <Link href="/" className="flex items-center gap-2 shrink-0">
                <span className="text-2xl">🔥</span>
                <div className="leading-tight">
                  <div className="font-black text-lg tracking-tight">The Original BBQ</div>
                  <div className="text-[10px] opacity-80 -mt-0.5">PREMIUM QUALITY</div>
                </div>
              </Link>
              <nav className="hidden md:flex items-center gap-1">
                <NavLink href="/" label="الرئيسية" />
                <NavLink href="/menu" label="المنيو" />
                {user && <NavLink href="/orders" label="طلباتي" />}
                {isStaff && <NavLink href="/admin" label="لوحة الإدارة" admin />}
              </nav>
              <div className="flex items-center gap-2">
                <Link
                  href="/cart"
                  className="relative inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 transition"
                  aria-label="السلة"
                >
                  🛒
                  <CartBadge />
                </Link>
                {user ? (
                  <div className="relative group">
                    <Link
                      href="/account"
                      className="inline-flex items-center gap-1.5 rounded-full bg-white/10 hover:bg-white/20 transition px-3 h-10"
                    >
                      <span>👤</span>
                      <span className="hidden sm:inline text-sm font-semibold">{user.name.split(" ")[0]}</span>
                    </Link>
                  </div>
                ) : (
                  <Link
                    href="/account"
                    className="inline-flex items-center gap-1 rounded-full bg-white text-red-800 hover:bg-amber-100 transition px-3 h-10 font-bold text-sm"
                  >
                    <span>👤</span>
                    <span className="hidden sm:inline">دخول</span>
                  </Link>
                )}
              </div>
            </div>
            {/* Mobile nav */}
            <div className="md:hidden border-t border-white/10 overflow-x-auto">
              <div className="flex items-center gap-1 px-3 py-2 min-w-max">
                <MobileNavLink href="/" label="الرئيسية" />
                <MobileNavLink href="/menu" label="المنيو" />
                <MobileNavLink href="/cart" label="السلة" />
                {user && <MobileNavLink href="/orders" label="طلباتي" />}
                {user ? (
                  <MobileNavLink href="/account" label="حسابي" />
                ) : (
                  <MobileNavLink href="/account" label="دخول" />
                )}
                {isStaff && <MobileNavLink href="/admin" label="الإدارة" admin />}
              </div>
            </div>
          </header>

          <main className="flex-1 pb-20 md:pb-8">{children}</main>

          <footer className="bg-stone-900 text-stone-300 text-center text-sm py-6 px-4 mt-8">
            <div className="bbq-container space-y-2">
              <div className="flex items-center justify-center gap-2 font-black text-white text-lg">
                <span className="text-2xl">🔥</span> The Original BBQ
              </div>
              <div>بورسعيد - خلف مسجد لطفي شبارة - سور نادي رمسيس امام مدرسة علي مبارك</div>
              <div className="flex items-center justify-center gap-4 text-amber-400 font-bold">
                <a href="tel:01220785729" className="hover:underline">📞 01220785729</a>
              </div>
              <div className="text-stone-500 text-xs pt-2">© {new Date().getFullYear()} جميع الحقوق محفوظة</div>
            </div>
          </footer>
          <AdminCheck />
        </CartProvider>
      </body>
    </html>
  );
}

function NavLink({ href, label, admin = false }: { href: string; label: string; admin?: boolean }) {
  return (
    <Link
      href={href}
      className={`px-3 py-2 rounded-lg font-semibold text-sm transition ${
        admin
          ? "bg-amber-500/20 text-amber-200 hover:bg-amber-500/30"
          : "hover:bg-white/10 text-white/90"
      }`}
    >
      {label}
    </Link>
  );
}

function MobileNavLink({ href, label, admin = false }: { href: string; label: string; admin?: boolean }) {
  return (
    <Link
      href={href}
      className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap ${
        admin ? "bg-amber-500 text-stone-900" : "bg-white/10 text-white"
      }`}
    >
      {label}
    </Link>
  );
}

async function CartBadge() {
  // We read cart cookie server-side; client provider hydrates. Use suspense-style 0 count, updated client side.
  return <span className="cart-badge absolute -top-1 -left-1 bg-amber-400 text-red-900 text-[10px] font-black rounded-full w-5 h-5 flex items-center justify-center hidden">0</span>;
}
