import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { name, email, password, phone } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "الاسم والبريد وكلمة المرور مطلوبة" },
        { status: 400 }
      );
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" },
        { status: 400 }
      );
    }

    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase().trim()))
      .limit(1);
    if (existing.length > 0) {
      return NextResponse.json(
        { error: "هذا البريد مسجل بالفعل" },
        { status: 400 }
      );
    }

    const hashed = await bcrypt.hash(password, 10);
    const [newUser] = await db
      .insert(users)
      .values({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashed,
        role: "customer",
        active: true,
        phone: phone?.trim() || null,
      })
      .returning({ id: users.id });

    await createSession(newUser.id);

    return NextResponse.json({ success: true, userId: newUser.id });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "حدث خطأ، برجاء المحاولة لاحقًا" },
      { status: 500 }
    );
  }
}
