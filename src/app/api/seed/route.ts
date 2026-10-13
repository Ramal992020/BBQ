import { NextResponse } from "next/server";
import { seedAll } from "@/db/seed";

// One-shot seed endpoint (idempotent: won't duplicate).
export async function POST() {
  try {
    await seedAll();
    return NextResponse.json({ success: true, message: "Seeded successfully." });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json(
      { error: "Seed failed", details: String(error) },
      { status: 500 }
    );
  }
}

// Also seed on first GET (convenient)
export async function GET() {
  return POST();
}
