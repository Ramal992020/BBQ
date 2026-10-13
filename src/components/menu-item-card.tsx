"use client";

import { useCart } from "./cart-context";
import { formatEGP } from "@/lib/utils";
import type { menuItems } from "@/db/schema";

type MenuItem = typeof menuItems.$inferSelect;

export default function MenuItemCard({ item }: { item: MenuItem }) {
  const { addItem } = useCart();

  const price = parseFloat(item.price as string);
  const imgSrc = item.image || "";

  return (
    <div className="card overflow-hidden flex flex-col group hover:shadow-lg transition">
      <div className="aspect-[4/3] bg-gradient-to-br from-amber-100 to-red-100 relative overflow-hidden">
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl">
            🍔
          </div>
        )}
        {item.featured && (
          <div className="absolute top-2 right-2 badge bg-amber-400 text-red-900">
            ⭐ مميز
          </div>
        )}
        {!item.available && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="bg-red-600 text-white px-3 py-1 rounded-full font-bold text-sm">
              غير متاح
            </div>
          </div>
        )}
      </div>
      <div className="p-3 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-black text-stone-900 leading-tight">{item.name}</h3>
        </div>
        {item.description && (
          <p className="text-xs text-stone-500 line-clamp-2 mb-2">
            {item.description}
          </p>
        )}
        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <div className="text-red-700 font-black text-lg">
            {formatEGP(price)}
          </div>
          <button
            onClick={() =>
              addItem({
                menuItemId: item.id,
                name: item.name,
                price,
                image: item.image,
              })
            }
            disabled={!item.available}
            className="btn-primary text-sm px-3 py-1.5 rounded-lg disabled:opacity-50"
          >
            + أضف
          </button>
        </div>
      </div>
    </div>
  );
}
