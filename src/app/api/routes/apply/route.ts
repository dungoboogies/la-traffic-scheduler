import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, unauthorized } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const userId = await getSessionUser();
  if (!userId) return unauthorized();

  const { optimizedOrder } = await req.json(); // array of appointment IDs

  if (!Array.isArray(optimizedOrder)) {
    return NextResponse.json({ error: "optimizedOrder must be array" }, { status: 400 });
  }

  await Promise.all(
    optimizedOrder.map((id: string, index: number) =>
      prisma.appointment.updateMany({
        where: { id, userId },
        data: { sequenceOrder: index + 1 },
      })
    )
  );

  return NextResponse.json({ ok: true });
}
