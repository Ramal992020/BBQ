"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type CartItem = {
  menuItemId: number;
  name: string;
  price: number;
  quantity: number;
  image?: string | null;
};

type CartContextType = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (menuItemId: number) => void;
  updateQuantity: (menuItemId: number, qty: number) => void;
  clear: () => void;
  total: number;
  count: number;
};

const CartContext = createContext<CartContextType | null>(null);
const COOKIE_NAME = "bbq_cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Load from cookie on mount
  useEffect(() => {
    const cookies = document.cookie.split(";").map((c) => c.trim());
    const cartCookie = cookies.find((c) => c.startsWith(COOKIE_NAME + "="));
    if (cartCookie) {
      try {
        const parsed = JSON.parse(
          decodeURIComponent(cartCookie.substring(COOKIE_NAME.length + 1))
        );
        if (Array.isArray(parsed)) setItems(parsed);
      } catch {}
    }
    setHydrated(true);
  }, []);

  // Persist to cookie whenever items change
  useEffect(() => {
    if (!hydrated) return;
    if (items.length === 0) {
      document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
    } else {
      document.cookie = `${COOKIE_NAME}=${encodeURIComponent(
        JSON.stringify(items)
      )}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
    }
    // Update cart badge
    const badge = document.querySelector(".cart-badge");
    if (badge) {
      const count = items.reduce((s, i) => s + i.quantity, 0);
      badge.textContent = String(count);
      badge.classList.toggle("hidden", count === 0);
    }
  }, [items, hydrated]);

  const addItem = (item: Omit<CartItem, "quantity">) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.menuItemId === item.menuItemId);
      if (existing) {
        return prev.map((i) =>
          i.menuItemId === item.menuItemId ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeItem = (menuItemId: number) => {
    setItems((prev) => prev.filter((i) => i.menuItemId !== menuItemId));
  };

  const updateQuantity = (menuItemId: number, qty: number) => {
    if (qty <= 0) {
      removeItem(menuItemId);
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.menuItemId === menuItemId ? { ...i, quantity: qty } : i))
    );
  };

  const clear = () => setItems([]);

  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const count = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clear, total, count }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
