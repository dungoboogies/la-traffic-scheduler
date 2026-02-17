import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, unauthorized } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { geocodeAddress } from "@/lib/google-maps";

export async function GET() {
  const userId = await getSessionUser();
  if (!userId) return unauthorized();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      homeAddress: true,
      homeLat: true,
      homeLng: true,
      defaultBuffer: true,
      workStart: true,
      workEnd: true,
    },
  });

  const googleAuth = await prisma.googleAuth.findUnique({ where: { userId } });

  return NextResponse.json({ ...user, googleConnected: !!googleAuth });
}

export async function PUT(req: NextRequest) {
  const userId = await getSessionUser();
  if (!userId) return unauthorized();

  const body = await req.json();
  const data: Record<string, unknown> = {};

  if (body.name !== undefined) data.name = body.name;
  if (body.defaultBuffer !== undefined) data.defaultBuffer = parseInt(body.defaultBuffer);
  if (body.workStart !== undefined) data.workStart = body.workStart;
  if (body.workEnd !== undefined) data.workEnd = body.workEnd;

  if (body.homeAddress !== undefined) {
    data.homeAddress = body.homeAddress;
    if (body.homeAddress) {
      const geo = await geocodeAddress(body.homeAddress);
      if (geo) {
        data.homeAddress = geo.formatted;
        data.homeLat = geo.lat;
        data.homeLng = geo.lng;
      }
    } else {
      data.homeLat = null;
      data.homeLng = null;
    }
  }

  const user = await prisma.user.update({ where: { id: userId }, data });
  return NextResponse.json(user);
}
