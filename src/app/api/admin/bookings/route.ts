import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { userId, classSessionId } = await req.json();

  const classSession = await prisma.classSession.findUnique({
    where: { id: classSessionId },
    include: { scheduleSlot: true },
  });

  if (!classSession) {
    return NextResponse.json({ error: "Sesión no encontrada" }, { status: 404 });
  }

  if (classSession.currentCapacity >= classSession.scheduleSlot.maxCapacity) {
    return NextResponse.json({ error: "Sesión completa" }, { status: 400 });
  }

  const existing = await prisma.booking.findFirst({
    where: { userId, classSessionId, status: "CONFIRMED" },
  });

  if (existing) {
    return NextResponse.json({ error: "El cliente ya tiene reserva en esta sesión" }, { status: 400 });
  }

  const now = new Date();
  const sessionDate = new Date(classSession.date);

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
          year: sessionDate.getFullYear(),
          month: sessionDate.getMonth() + 1,
        },
      },
      create: {
        userId,
        year: sessionDate.getFullYear(),
        month: sessionDate.getMonth() + 1,
        count: 1,
      },
      update: { count: { increment: 1 } },
    }),
  ]);

  return NextResponse.json({ message: "Reserva creada" });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

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
}
