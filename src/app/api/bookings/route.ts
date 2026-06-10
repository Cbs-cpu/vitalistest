import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const url = new URL(req.url);
    const action = url.searchParams.get("action");
    const monthStr = url.searchParams.get("month");

    if (action === "count") {
      const now = new Date();
      const count = await prisma.monthlyBookingCount.upsert({
        where: {
          userId_year_month: {
            userId: (session.user as any).id,
            year: now.getFullYear(),
            month: now.getMonth() + 1,
          },
        },
        create: {
          userId: (session.user as any).id,
          year: now.getFullYear(),
          month: now.getMonth() + 1,
          count: 0,
        },
        update: {},
      });

      return NextResponse.json({ count: count.count });
    }

    if (action === "mybookings") {
      const userId = (session.user as any).id;
      const now = new Date();
      const bookings = await prisma.booking.findMany({
        where: {
          userId,
          status: "CONFIRMED",
          classSession: {
            date: { gte: now },
          },
        },
        include: {
          classSession: {
            include: { scheduleSlot: true },
          },
        },
        orderBy: { classSession: { date: "asc" } },
      });

      const count = await prisma.monthlyBookingCount.findUnique({
        where: {
          userId_year_month: {
            userId,
            year: now.getFullYear(),
            month: now.getMonth() + 1,
          },
        },
      });

      return NextResponse.json({
        bookings,
        monthlyCount: count?.count ?? 0,
      });
    }

    if (action === "sessions") {
      const [year, month] = monthStr?.split("-").map(Number) ?? [];
      if (!year || !month) {
        return NextResponse.json({ error: "Mes requerido" }, { status: 400 });
      }

      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);

      const sessions = await prisma.classSession.findMany({
        where: {
          date: { gte: startDate, lte: endDate },
        },
        include: { scheduleSlot: true },
        orderBy: { date: "asc" },
      });

      const slots = await prisma.scheduleSlot.findMany();

      return NextResponse.json({ sessions, slots });
    }

    return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { classSessionId } = await req.json();

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.subscriptionStatus !== "ACTIVE") {
      return NextResponse.json({ error: "Necesitas una subscripción activa" }, { status: 403 });
    }

    const now = new Date();
    const monthKey = { year: now.getFullYear(), month: now.getMonth() + 1 };
    const monthlyCount = await prisma.monthlyBookingCount.findUnique({
      where: {
        userId_year_month: {
          userId,
          year: monthKey.year,
          month: monthKey.month,
        },
      },
    });

    if (monthlyCount && monthlyCount.count >= 8) {
      return NextResponse.json({ error: "Has alcanzado el límite de 8 clases este mes" }, { status: 400 });
    }

    const classSession = await prisma.classSession.findUnique({
      where: { id: classSessionId },
      include: { scheduleSlot: true },
    });

    if (!classSession) {
      return NextResponse.json({ error: "Sesión no encontrada" }, { status: 404 });
    }

    if (classSession.currentCapacity >= classSession.scheduleSlot.maxCapacity) {
      return NextResponse.json({ error: "Esta sesión está completa" }, { status: 400 });
    }

    const existingBooking = await prisma.booking.findFirst({
      where: {
        userId,
        classSessionId,
        status: "CONFIRMED",
      },
    });

    if (existingBooking) {
      return NextResponse.json({ error: "Ya tienes una reserva en esta sesión" }, { status: 400 });
    }

    const sessionDate = new Date(classSession.date);
    const weekStart = new Date(sessionDate);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const weeklyBookings = await prisma.booking.count({
      where: {
        userId,
        status: "CONFIRMED",
        classSession: {
          date: { gte: weekStart, lte: weekEnd },
        },
      },
    });

    if (weeklyBookings >= 2) {
      return NextResponse.json({ error: "Ya tienes 2 clases reservadas esta semana" }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.booking.create({
        data: { userId, classSessionId, status: "CONFIRMED" },
      }),
      prisma.classSession.update({
        where: { id: classSessionId },
        data: { currentCapacity: { increment: 1 } },
      }),
      prisma.monthlyBookingCount.upsert({
        where: {
          userId_year_month: {
            userId,
            year: monthKey.year,
            month: monthKey.month,
          },
        },
        create: {
          userId,
          year: monthKey.year,
          month: monthKey.month,
          count: 1,
        },
        update: { count: { increment: 1 } },
      }),
    ]);

    return NextResponse.json({ message: "Reserva confirmada" });
  } catch (error) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const url = new URL(req.url);
    const bookingId = url.searchParams.get("bookingId");

    if (!bookingId) {
      return NextResponse.json({ error: "bookingId requerido" }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { classSession: true },
    });

    if (!booking) {
      return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 });
    }

    if (booking.userId !== userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const sessionDate = new Date(booking.classSession.date);

    await prisma.$transaction([
      prisma.booking.update({
        where: { id: bookingId },
        data: { status: "CANCELLED" },
      }),
      prisma.classSession.update({
        where: { id: booking.classSessionId },
        data: { currentCapacity: { decrement: 1 } },
      }),
      prisma.monthlyBookingCount.update({
        where: {
          userId_year_month: {
            userId: booking.userId,
            year: sessionDate.getFullYear(),
            month: sessionDate.getMonth() + 1,
          },
        },
        data: { count: { decrement: 1 } },
      }),
    ]);

    return NextResponse.json({ message: "Reserva cancelada" });
  } catch (error) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
