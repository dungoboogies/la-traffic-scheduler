import { NextResponse } from "next/server";
import { getSessionUser, requireAdmin, unauthorized, forbidden } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const userId = await getSessionUser();
  if (!userId) return unauthorized();
  if (!(await requireAdmin())) return forbidden();

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
      createdAt: true,
      _count: { select: { appointments: true, clients: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(users);
}
