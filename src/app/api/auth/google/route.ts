import { NextResponse } from "next/server";
import { getSessionUser, unauthorized } from "@/lib/session";
import { getGoogleAuthUrl } from "@/lib/google-calendar";

export async function GET() {
  const userId = await getSessionUser();
  if (!userId) return unauthorized();

  const url = getGoogleAuthUrl();
  return NextResponse.json({ url });
}
