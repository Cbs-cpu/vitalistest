import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const users = await prisma.user.findMany({
    where: { role: "CLIENT" },
    include: {
      bookings: {
        where: {
          status: "CONFIRMED",
          classSession: { date: { gte: now } },
        },
        include: {
          classSession: {
            include: { scheduleSlot: true },
          },
        },
        orderBy: { classSession: { date: "asc" } },
      },
      monthlyCounts: {
        where: { year: currentYear, month: currentMonth },
      },
    },
    orderBy: { name: "asc" },
  });

  const clients = users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    subscriptionStatus: user.subscriptionStatus,
    bookings: user.bookings,
    monthlyCount: user.monthlyCounts[0]?.count ?? 0,
  }));

  return NextResponse.json({ clients });
}
