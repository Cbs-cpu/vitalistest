import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { slotId, month } = await req.json();

  if (!slotId || !month) {
    return NextResponse.json({ error: "slotId y month requeridos" }, { status: 400 });
  }

  const slot = await prisma.scheduleSlot.findUnique({ where: { id: slotId } });
  if (!slot) {
    return NextResponse.json({ error: "Horario no encontrado" }, { status: 404 });
  }

  const [year, monthNum] = month.split("-").map(Number);
  const startDate = new Date(year, monthNum - 1, 1);
  const endDate = new Date(year, monthNum, 0);

  const sessions = [];
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    if (d.getDay() === slot.dayOfWeek) {
      const date = new Date(d);
      const exists = await prisma.classSession.findFirst({
        where: {
          scheduleSlotId: slotId,
          date: {
            gte: new Date(date.setHours(0, 0, 0, 0)),
            lt: new Date(date.setHours(23, 59, 59, 999)),
          },
        },
      });

      if (!exists) {
        const classSession = await prisma.classSession.create({
          data: {
            scheduleSlotId: slotId,
            date: new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0),
            currentCapacity: 0,
          },
        });
        sessions.push(classSession);
      }
    }
  }

  return NextResponse.json({ count: sessions.length, sessions });
}
