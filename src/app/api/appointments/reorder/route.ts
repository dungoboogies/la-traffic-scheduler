import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, unauthorized } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest) {
  const userId = await getSessionUser();
  if (!userId) return unauthorized();

  const { order } = await req.json(); // array of { id, sequenceOrder }

  if (!Array.isArray(order)) {
    return NextResponse.json({ error: "order must be array" }, { status: 400 });
  }

  await Promise.all(
    order.map((item: { id: string; sequenceOrder: number }) =>
      prisma.appointment.updateMany({
        where: { id: item.id, userId },
        data: { sequenceOrder: item.sequenceOrder },
      })
    )
  );

  return NextResponse.json({ ok: true });
}
