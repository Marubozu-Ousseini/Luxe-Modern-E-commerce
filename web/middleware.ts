import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_CREDS_COOKIE, verifyAdminCreds } from "./src/lib/adminAuthCookie";

function unauthorized() {
  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Admin"',
    },
  });
}

export async function middleware(req: NextRequest) {
  const defaultUsername = process.env.ADMIN_BASIC_USER ?? "admin@malafaareh.com";
  const defaultPassword = process.env.ADMIN_BASIC_PASS ?? "admin";
  const cookieSecret = process.env.ADMIN_COOKIE_SECRET ?? "dev-secret-change-me";

  let username = defaultUsername;
  let password = defaultPassword;

  const token = req.cookies.get(ADMIN_CREDS_COOKIE)?.value;
  if (token) {
    const creds = await verifyAdminCreds(token, cookieSecret);
    if (creds) {
      username = creds.user;
      password = creds.pass;
    }
  }

  const header = req.headers.get("authorization");
  if (!header || !header.startsWith("Basic ")) return unauthorized();

  const encoded = header.slice("Basic ".length).trim();
  let decoded = "";
  try {
    decoded = atob(encoded);
  } catch {
    return unauthorized();
  }

  const sep = decoded.indexOf(":");
  if (sep < 0) return unauthorized();

  const u = decoded.slice(0, sep);
  const p = decoded.slice(sep + 1);

  if (u !== username || p !== password) return unauthorized();

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
