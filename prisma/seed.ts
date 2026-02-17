import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("demo123", 12);

  const user = await prisma.user.upsert({
    where: { email: "josh@example.com" },
    update: {},
    create: {
      email: "josh@example.com",
      password,
      name: "Josh",
      homeAddress: "1000 Westwood Blvd, Los Angeles, CA 90024",
      homeLat: 34.0585,
      homeLng: -118.444,
      defaultBuffer: 5,
    },
  });

  // Create clients
  const clientsData = [
    { name: "Spencer", defaultRate: 85, address: "1234 Wilshire Blvd, Santa Monica, CA 90403", lat: 34.0296, lng: -118.4953 },
    { name: "Jonas", defaultRate: 85, address: "456 Montana Ave, Santa Monica, CA 90402", lat: 34.0367, lng: -118.5067 },
    { name: "Maya", defaultRate: 90, address: "789 Venice Blvd, Los Angeles, CA 90034", lat: 34.0179, lng: -118.4105 },
    { name: "Ava", defaultRate: 95, address: "321 Pico Blvd, Santa Monica, CA 90405", lat: 34.0132, lng: -118.4698 },
    { name: "Liam", defaultRate: 90, address: "555 Barrington Ave, Los Angeles, CA 90049", lat: 34.0571, lng: -118.4599 },
    { name: "Ella", defaultRate: 100, address: "987 Olympic Blvd, Beverly Hills, CA 90212", lat: 34.0544, lng: -118.4051 },
    { name: "Noah", defaultRate: 85, address: "147 Main St, Santa Monica, CA 90405", lat: 34.0084, lng: -118.4912 },
    { name: "Zoe", defaultRate: 90, address: "258 Abbot Kinney Blvd, Venice, CA 90291", lat: 33.9925, lng: -118.4672 },
  ];

  for (const c of clientsData) {
    await prisma.client.upsert({
      where: { id: `seed-${c.name.toLowerCase()}` },
      update: {},
      create: {
        id: `seed-${c.name.toLowerCase()}`,
        userId: user.id,
        ...c,
      },
    });
  }

  // Create appointments for next 5 days
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let day = 0; day < 5; day++) {
    const date = new Date(today);
    date.setDate(date.getDate() + day);
    if (date.getDay() === 0 || date.getDay() === 6) continue; // skip weekends

    // Pick 5-6 random clients for each day
    const shuffled = [...clientsData].sort(() => Math.random() - 0.5);
    const dayClients = shuffled.slice(0, 5 + Math.floor(Math.random() * 2));

    let hour = 9;
    for (let i = 0; i < dayClients.length; i++) {
      const c = dayClients[i];
      const start = new Date(date);
      start.setHours(hour, 0, 0, 0);
      const end = new Date(start);
      end.setHours(hour + 1, 0, 0, 0);

      await prisma.appointment.create({
        data: {
          userId: user.id,
          title: `${c.name} - Tutoring`,
          startTime: start,
          endTime: end,
          location: c.address,
          address: c.address,
          lat: c.lat,
          lng: c.lng,
          clientName: c.name,
          sessionRate: c.defaultRate,
          sequenceOrder: i + 1,
        },
      });

      hour += 1 + Math.floor(Math.random() * 2); // 1-2 hour gap
    }
  }

  console.log("Seed complete: josh@example.com / demo123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
