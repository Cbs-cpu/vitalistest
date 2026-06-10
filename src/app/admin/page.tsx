import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user || (session.user as any).role !== "ADMIN") {
    redirect("/login");
  }

  const totalUsers = await prisma.user.count({ where: { role: "CLIENT" } });
  const activeSubscriptions = await prisma.user.count({
    where: { role: "CLIENT", subscriptionStatus: "ACTIVE" },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayBookings = await prisma.booking.count({
    where: {
      status: "CONFIRMED",
      classSession: { date: { gte: today, lt: tomorrow } },
    },
  });

  const recentBookings = await prisma.booking.findMany({
    include: {
      user: true,
      classSession: { include: { scheduleSlot: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-xl font-bold text-white">Panel de Administración</h2>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-vitalis-gray rounded-2xl p-4 border border-vitalis-gray-light">
          <p className="text-xs text-vitalis-white/50">Clientes totales</p>
          <p className="text-2xl font-black text-vitalis-accent">{totalUsers}</p>
        </div>
        <div className="bg-vitalis-gray rounded-2xl p-4 border border-vitalis-gray-light">
          <p className="text-xs text-vitalis-white/50">Subscripciones activas</p>
          <p className="text-2xl font-black text-vitalis-accent">{activeSubscriptions}</p>
        </div>
        <div className="bg-vitalis-gray rounded-2xl p-4 border border-vitalis-gray-light">
          <p className="text-xs text-vitalis-white/50">Reservas hoy</p>
          <p className="text-2xl font-black text-vitalis-accent">{todayBookings}</p>
        </div>
        <Link
          href="/admin/slots"
          className="bg-vitalis-gray rounded-2xl p-4 border border-vitalis-gray-light hover:border-vitalis-green transition-colors"
        >
          <p className="text-xs text-vitalis-white/50">Gestionar horarios</p>
          <p className="text-2xl font-black text-vitalis-accent">→</p>
        </Link>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-white">Últimas reservas</h3>
          <Link
            href="/admin/bookings"
            className="text-sm text-vitalis-accent hover:underline"
          >
            Ver todas →
          </Link>
        </div>

        <div className="space-y-2">
          {recentBookings.map((booking) => (
            <div
              key={booking.id}
              className="bg-vitalis-gray rounded-xl p-3 border border-vitalis-gray-light"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white text-sm font-medium">{booking.user.name}</p>
                  <p className="text-xs text-vitalis-white/50">
                    {new Date(booking.classSession.date).toLocaleDateString("es-ES")} ·{" "}
                    {booking.classSession.scheduleSlot.startTime}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    booking.status === "CONFIRMED"
                      ? "bg-vitalis-green/20 text-vitalis-accent"
                      : "bg-red-500/20 text-red-400"
                  }`}
                >
                  {booking.status === "CONFIRMED" ? "Confirmada" : "Cancelada"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
