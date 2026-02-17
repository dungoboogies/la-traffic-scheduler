import { NextResponse } from "next/server";
import { getSessionUser, requireAdmin, unauthorized, forbidden } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const userId = await getSessionUser();
  if (!userId) return unauthorized();
  if (!(await requireAdmin())) return forbidden();

  const [totalUsers, pendingUsers, totalAppointments, totalClients, googleConnected] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: "pending" } }),
      prisma.appointment.count(),
      prisma.client.count(),
      prisma.googleAuth.count(),
    ]);

  return NextResponse.json({
    totalUsers,
    pendingUsers,
    totalAppointments,
    totalClients,
    googleConnected,
  });
}
