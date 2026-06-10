import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const url = new URL(req.url);
  const slotId = url.searchParams.get("slotId");

  if (slotId) {
    const slot = await prisma.scheduleSlot.findUnique({ where: { id: slotId } });
    return NextResponse.json({ slot });
  }

  const slots = await prisma.scheduleSlot.findMany({
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });

  return NextResponse.json({ slots });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { dayOfWeek, startTime, endTime, maxCapacity } = await req.json();

  if (dayOfWeek === undefined || !startTime || !endTime) {
    return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
  }

  const slot = await prisma.scheduleSlot.create({
    data: {
      dayOfWeek,
      startTime,
      endTime,
      maxCapacity: maxCapacity || 10,
    },
  });

  return NextResponse.json({ slot }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const url = new URL(req.url);
  const slotId = url.searchParams.get("slotId");

  if (!slotId) {
    return NextResponse.json({ error: "slotId requerido" }, { status: 400 });
  }

  await prisma.scheduleSlot.delete({ where: { id: slotId } });

  return NextResponse.json({ message: "Horario eliminado" });
}
