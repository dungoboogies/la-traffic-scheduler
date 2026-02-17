import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, unauthorized } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { geocodeAddress } from "@/lib/google-maps";

export async function POST(req: NextRequest) {
  const userId = await getSessionUser();
  if (!userId) return unauthorized();

  const body = await req.json();

  let lat: number | null = null;
  let lng: number | null = null;
  let address = body.address || body.location || null;

  if (address) {
    const geo = await geocodeAddress(address);
    if (geo) {
      lat = geo.lat;
      lng = geo.lng;
      address = geo.formatted;
    }
  }

  const appointment = await prisma.appointment.create({
    data: {
      userId,
      title: body.title,
      startTime: new Date(body.startTime),
      endTime: new Date(body.endTime),
      location: body.location || null,
      address,
      lat,
      lng,
      clientName: body.clientName || null,
      sessionRate: body.sessionRate ? parseFloat(body.sessionRate) : null,
    },
  });

  return NextResponse.json(appointment);
}
