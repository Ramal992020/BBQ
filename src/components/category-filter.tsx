"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function CategoryFilter({
  categories,
  selected,
  search,
}: {
  categories: string[];
  selected: string;
  search: string;
}) {
  const router = useRouter();
  const [q, setQ] = useState(search);

  useEffect(() => {
    setQ(search);
  }, [search]);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (selected !== "all") params.set("cat", selected);
    if (q.trim()) params.set("q", q.trim());
    router.push(`/menu?${params.toString()}`);
  };

  const buildHref = (cat: string) => {
    const params = new URLSearchParams();
    if (cat !== "all") params.set("cat", cat);
    if (q.trim()) params.set("q", q.trim());
    return `/menu?${params.toString()}`;
  };

  return (
    <div className="mb-6 space-y-3">
      <form onSubmit={onSearch} className="flex gap-2">
        <input
          type="search"
          placeholder="ابحث عن صنف..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="input"
        />
        <button type="submit" className="btn-primary px-5">
          بحث
        </button>
      </form>
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-thin">
        <FilterChip
          href={buildHref("all")}
          label="الكل"
          active={selected === "all"}
        />
        {categories.map((c) => (
          <FilterChip
            key={c}
            href={buildHref(c)}
            label={c}
            active={selected === c}
          />
        ))}
      </div>
    </div>
  );
}

function FilterChip({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold transition ${
        active
          ? "bg-red-700 text-white shadow-md"
          : "bg-white border border-stone-200 text-stone-700 hover:border-red-300"
      }`}
    >
      {label}
    </Link>
  );
}
