import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AdminBookingList } from "@/components/AdminBookingList";

export default async function AdminBookingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    redirect("/login");
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const bookings = await prisma.booking.findMany({
    where: {
      classSession: { date: { gte: today } },
    },
    include: {
      user: true,
      classSession: { include: { scheduleSlot: true } },
    },
    orderBy: { classSession: { date: "asc" } },
  });

  const users = await prisma.user.findMany({
    where: { role: "CLIENT" },
    select: { id: true, name: true, email: true },
  });

  const futureSessions = await prisma.classSession.findMany({
    where: { date: { gte: today } },
    include: { scheduleSlot: true },
    orderBy: { date: "asc" },
  });

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold text-white">Gestión de reservas</h2>
      <AdminBookingList
        bookings={JSON.parse(JSON.stringify(bookings))}
        users={JSON.parse(JSON.stringify(users))}
        sessions={JSON.parse(JSON.stringify(futureSessions))}
      />
    </div>
  );
}
