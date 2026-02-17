import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { exchangeCodeForTokens } from "@/lib/google-calendar";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const userId = await getSessionUser();
  if (!userId) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const code = req.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(new URL("/settings?error=no_code", req.url));
  }

  try {
    const tokens = await exchangeCodeForTokens(code);

    await prisma.googleAuth.upsert({
      where: { userId },
      create: {
        userId,
        refreshToken: tokens.refresh_token!,
        accessToken: tokens.access_token || null,
        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      },
      update: {
        refreshToken: tokens.refresh_token || undefined,
        accessToken: tokens.access_token || null,
        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      },
    });

    return NextResponse.redirect(new URL("/settings?google=connected", req.url));
  } catch (err) {
    console.error("Google OAuth error:", err);
    return NextResponse.redirect(new URL("/settings?error=oauth_failed", req.url));
  }
}
