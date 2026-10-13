import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";

export async function PATCH(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const fields: Record<string, unknown> = {};
    if (body.name !== undefined) fields.name = String(body.name).trim();
    if (body.phone !== undefined) fields.phone = String(body.phone).trim() || null;

    if (Object.keys(fields).length === 0) {
      return NextResponse.json({ error: "لا توجد بيانات للتحديث" }, { status: 400 });
    }

    const [updated] = await db
      .update(users)
      .set(fields)
      .where(eq(users.id, user.id))
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        active: users.active,
        phone: users.phone,
      });
    return NextResponse.json({ user: updated });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg === "UNAUTHORIZED") {
      return NextResponse.json({ error: "يجب تسجيل الدخول" }, { status: 401 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
