"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  name: string;
  email: string;
}

interface ScheduleSlot {
  id: string;
  startTime: string;
  endTime: string;
  dayOfWeek: number;
  maxCapacity: number;
}

interface ClassSession {
  id: string;
  date: string;
  currentCapacity: number;
  scheduleSlot: ScheduleSlot;
}

interface Booking {
  id: string;
  userId: string;
  user: User;
  classSessionId: string;
  classSession: ClassSession;
  status: string;
}

interface Props {
  bookings: Booking[];
  users: User[];
  sessions: ClassSession[];
}

const DAY_NAMES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export function AdminBookingList({ bookings, users, sessions }: Props) {
  const router = useRouter();
  const [filter, setFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedSession, setSelectedSession] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const filtered = bookings.filter((b) => {
    if (filter === "confirmed") return b.status === "CONFIRMED";
    if (filter === "cancelled") return b.status === "CANCELLED";
    return true;
  });

  const groupedByDate = filtered.reduce((acc, booking) => {
    const dateKey = new Date(booking.classSession.date).toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(booking);
    return acc;
  }, {} as Record<string, Booking[]>);

  const handleAddBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !selectedSession) {
      setMessage("Selecciona un cliente y una sesión");
      return;
    }

    setLoading(true);
    setMessage("");

    const res = await fetch("/api/admin/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: selectedUser, classSessionId: selectedSession }),
    });

    const data = await res.json();

    if (res.ok) {
      setMessage("Reserva creada correctamente");
      setShowAdd(false);
      setSelectedUser("");
      setSelectedSession("");
      router.refresh();
    } else {
      setMessage(data.error || "Error al crear reserva");
    }
    setLoading(false);
  };

  const handleCancelBooking = async (bookingId: string) => {
    const res = await fetch(`/api/admin/bookings?bookingId=${bookingId}`, {
      method: "DELETE",
    });

    if (res.ok) {
      router.refresh();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="px-4 py-2 rounded-xl bg-vitalis-green hover:bg-vitalis-green-light text-white text-sm font-bold transition-colors"
        >
          {showAdd ? "Cancelar" : "+ Añadir reserva"}
        </button>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-2 rounded-xl bg-vitalis-gray border border-vitalis-gray-light text-white text-sm"
        >
          <option value="all">Todas</option>
          <option value="confirmed">Confirmadas</option>
          <option value="cancelled">Canceladas</option>
        </select>
      </div>

      {message && (
        <div
          className={`p-3 rounded-xl text-sm text-center ${
            message.includes("correctamente")
              ? "bg-vitalis-green/20 text-vitalis-accent border border-vitalis-green/30"
              : "bg-red-500/10 text-red-400 border border-red-500/20"
          }`}
        >
          {message}
        </div>
      )}

      {showAdd && (
        <form onSubmit={handleAddBooking} className="bg-vitalis-gray rounded-2xl p-4 border border-vitalis-gray-light space-y-3">
          <div>
            <label className="block text-xs text-vitalis-white/50 mb-1">Cliente</label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-vitalis-gray-light border border-vitalis-gray-light text-white text-sm"
              required
            >
              <option value="">Seleccionar cliente...</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-vitalis-white/50 mb-1">Sesión</label>
            <select
              value={selectedSession}
              onChange={(e) => setSelectedSession(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-vitalis-gray-light border border-vitalis-gray-light text-white text-sm"
              required
            >
              <option value="">Seleccionar sesión...</option>
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {new Date(s.date).toLocaleDateString("es-ES")} - {s.scheduleSlot.startTime} ({s.currentCapacity}/{s.scheduleSlot.maxCapacity})
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded-xl bg-vitalis-green hover:bg-vitalis-green-light text-white text-sm font-bold transition-colors disabled:opacity-50"
          >
            {loading ? "Creando..." : "Añadir reserva"}
          </button>
        </form>
      )}

      {Object.entries(groupedByDate).length === 0 ? (
        <div className="text-center py-8 text-vitalis-white/40">No hay reservas</div>
      ) : (
        Object.entries(groupedByDate).map(([date, dateBookings]) => (
          <div key={date} className="space-y-2">
            <h3 className="text-sm font-bold text-vitalis-white/60 capitalize">{date}</h3>
            {dateBookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-vitalis-gray rounded-xl p-3 border border-vitalis-gray-light flex items-center justify-between"
              >
                <div>
                  <p className="text-white text-sm font-medium">{booking.user.name}</p>
                  <p className="text-xs text-vitalis-white/50">
                    {booking.classSession.scheduleSlot.startTime} -{" "}
                    {booking.classSession.scheduleSlot.endTime}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      booking.status === "CONFIRMED"
                        ? "bg-vitalis-green/20 text-vitalis-accent"
                        : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {booking.status === "CONFIRMED" ? "Confirmada" : "Cancelada"}
                  </span>
                  {booking.status === "CONFIRMED" && (
                    <button
                      onClick={() => handleCancelBooking(booking.id)}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  );
}
