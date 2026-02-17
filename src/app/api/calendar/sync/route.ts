import { NextResponse } from "next/server";
import { getSessionUser, unauthorized } from "@/lib/session";
import { fetchCalendarEvents } from "@/lib/google-calendar";
import { geocodeAddress } from "@/lib/google-maps";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const userId = await getSessionUser();
  if (!userId) return unauthorized();

  const auth = await prisma.googleAuth.findUnique({ where: { userId } });
  if (!auth) {
    return NextResponse.json({ error: "Google not connected" }, { status: 400 });
  }

  const start = new Date();
  const end = new Date();
  end.setDate(end.getDate() + 7);

  const events = await fetchCalendarEvents(userId, start, end);
  let synced = 0;

  for (const event of events) {
    if (!event.id || !event.start?.dateTime || !event.end?.dateTime) continue;

    let lat: number | null = null;
    let lng: number | null = null;
    let address = event.location || null;

    if (address) {
      const geo = await geocodeAddress(address);
      if (geo) {
        lat = geo.lat;
        lng = geo.lng;
        address = geo.formatted;
      }
    }

    // Extract client name from event title (e.g., "Spencer - Tutoring" -> "Spencer")
    const clientName = event.summary?.split(/\s*[-–—]\s*/)[0]?.trim() || null;

    // Find matching client for rate
    let sessionRate: number | null = null;
    if (clientName) {
      const client = await prisma.client.findFirst({
        where: { userId, name: { equals: clientName, mode: "insensitive" } },
      });
      if (client) sessionRate = client.defaultRate;
    }

    await prisma.appointment.upsert({
      where: { userId_googleEventId: { userId, googleEventId: event.id } },
      create: {
        userId,
        googleEventId: event.id,
        title: event.summary || "Untitled",
        startTime: new Date(event.start.dateTime),
        endTime: new Date(event.end.dateTime),
        location: event.location || null,
        address,
        lat,
        lng,
        clientName,
        sessionRate,
        syncedAt: new Date(),
      },
      update: {
        title: event.summary || "Untitled",
        startTime: new Date(event.start.dateTime),
        endTime: new Date(event.end.dateTime),
        location: event.location || null,
        address,
        lat,
        lng,
        clientName,
        sessionRate: sessionRate || undefined,
        syncedAt: new Date(),
      },
    });
    synced++;
  }

  return NextResponse.json({ synced });
}
