import { getServerSession } from "next-auth";
import { authOptions } from "./auth-options";
import { NextResponse } from "next/server";

export async function getSessionUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return (session.user as any).id as string;
}

export async function getSessionRole() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return (session.user as any).role as string;
}

export async function requireAdmin() {
  const role = await getSessionRole();
  if (role !== "admin") return false;
  return true;
}

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function forbidden() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
