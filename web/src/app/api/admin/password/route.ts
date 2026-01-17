import { NextResponse, type NextRequest } from "next/server";
import {
  ADMIN_CREDS_COOKIE,
  signAdminCreds,
  verifyAdminCreds,
  type AdminCreds,
} from "@/lib/adminAuthCookie";

export async function POST(req: NextRequest) {
  const defaultUsername = process.env.ADMIN_BASIC_USER ?? "admin@malafaareh.com";
  const defaultPassword = process.env.ADMIN_BASIC_PASS ?? "admin";
  const cookieSecret = process.env.ADMIN_COOKIE_SECRET ?? "dev-secret-change-me";

  let expectedUser = defaultUsername;
  let expectedPass = defaultPassword;

  const existingToken = req.cookies.get(ADMIN_CREDS_COOKIE)?.value;
  if (existingToken) {
    const creds = await verifyAdminCreds(existingToken, cookieSecret);
    if (creds) {
      expectedUser = creds.user;
      expectedPass = creds.pass;
    }
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const currentPassword = (body as { currentPassword?: unknown }).currentPassword;
  const newPassword = (body as { newPassword?: unknown }).newPassword;

  if (typeof currentPassword !== "string" || typeof newPassword !== "string") {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  if (currentPassword !== expectedPass) {
    return NextResponse.json({ ok: false, error: "wrong_password" }, { status: 403 });
  }

  const trimmed = newPassword.trim();
  if (trimmed.length < 4) {
    return NextResponse.json({ ok: false, error: "weak_password" }, { status: 400 });
  }

  const creds: AdminCreds = { v: 1, user: expectedUser, pass: trimmed };
  const token = await signAdminCreds(creds, cookieSecret);

  const res = NextResponse.json({ ok: true });
  res.cookies.set({
    name: ADMIN_CREDS_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  return res;
}
