"use client";

import { useState, useEffect, useCallback } from "react";
import { CalendarPopup } from "@/components/CalendarPopup";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Booking {
  id: string;
  status: string;
  classSession: {
    id: string;
    date: string;
    scheduleSlot: {
      startTime: string;
      endTime: string;
    };
  };
}

export default function DashboardPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [monthlyCount, setMonthlyCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [cancelLoading, setCancelLoading] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const res = await fetch("/api/bookings?action=mybookings");
    if (res.ok) {
      const data = await res.json();
      setBookings(data.bookings);
      setMonthlyCount(data.monthlyCount);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const remaining = 8 - monthlyCount;
  const allBooked = remaining <= 0;

  const handleCancel = async (bookingId: string) => {
    setCancelLoading(bookingId);
    const res = await fetch(`/api/bookings?bookingId=${encodeURIComponent(bookingId)}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setBookings((prev) => prev.filter((b) => b.id !== bookingId));
      setMonthlyCount((prev) => prev - 1);
    }
    setCancelLoading(null);
  };

  const handleReschedule = (bookingId: string) => {
    setRescheduleId(bookingId);
    setCalendarOpen(true);
  };

  const handleBooked = () => {
    setCalendarOpen(false);
    setRescheduleId(null);
    fetchData();
  };

  const formatBookingDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const dayName = format(date, "EEEE", { locale: es });
    const dayNum = format(date, "d");
    const month = format(date, "MMMM", { locale: es });
    return { dayName, dayNum, month };
  };

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-[300px]">
        <p className="text-vitalis-white/40">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 pb-24">
      <div className="bg-vitalis-gray rounded-2xl p-5 border border-vitalis-gray-light">
        <h2 className="text-sm text-vitalis-white/50 mb-1">Clases este mes</h2>
        <div className="flex items-end gap-2">
          <span className="text-3xl font-black text-vitalis-accent">{monthlyCount}</span>
          <span className="text-vitalis-white/40 pb-1">/ 8 disponibles</span>
        </div>
        <div className="mt-2 w-full bg-vitalis-gray-light rounded-full h-2">
          <div
            className="bg-vitalis-green h-2 rounded-full transition-all"
            style={{ width: `${Math.min((monthlyCount / 8) * 100, 100)}%` }}
          />
        </div>
        <p className="mt-1 text-xs text-vitalis-white/40">
          {allBooked ? "¡Has agendado todas tus clases!" : `${remaining} clases restantes`}
        </p>
      </div>

      <div className="flex justify-center">
        {allBooked ? (
          <div className="flex items-center gap-2 px-6 py-3 rounded-xl bg-vitalis-green/10 border border-vitalis-green/30 text-vitalis-accent font-bold text-sm">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            ¡Todas las sesiones Agendadas!
          </div>
        ) : (
          <button
            onClick={() => {
              setRescheduleId(null);
              setCalendarOpen(true);
            }}
            className="px-6 py-3 rounded-xl bg-vitalis-green hover:bg-vitalis-green-light text-white font-bold text-sm transition-colors"
          >
            Agendar sesión
          </button>
        )}
      </div>

      <div>
        <h3 className="text-lg font-bold text-white mb-3">Mis reservas</h3>

        {bookings.length === 0 ? (
          <div className="bg-vitalis-gray rounded-2xl p-8 border border-vitalis-gray-light text-center">
            <p className="text-vitalis-white/40 text-sm">No tienes reservas aún</p>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((booking) => {
              const { dayName, dayNum, month } = formatBookingDate(booking.classSession.date);
              const isCancelling = cancelLoading === booking.id;

              return (
                <div
                  key={booking.id}
                  className="bg-vitalis-gray rounded-xl p-4 border border-vitalis-gray-light"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-vitalis-accent font-bold capitalize">
                        {dayName} {dayNum} de {month}
                      </p>
                      <p className="text-vitalis-accent text-sm mt-0.5">
                        {booking.classSession.scheduleSlot.startTime} -{" "}
                        {booking.classSession.scheduleSlot.endTime}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleReschedule(booking.id)}
                        disabled={isCancelling}
                        className="p-2 text-vitalis-white/40 hover:text-vitalis-accent transition-colors disabled:opacity-30"
                        title="Reagendar"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleCancel(booking.id)}
                        disabled={isCancelling}
                        className="p-2 text-vitalis-white/40 hover:text-red-400 transition-colors disabled:opacity-30"
                        title="Cancelar"
                      >
                        {isCancelling ? (
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {calendarOpen && (
        <CalendarPopup
          onClose={() => {
            setCalendarOpen(false);
            setRescheduleId(null);
          }}
          onBooked={handleBooked}
          rescheduleBookingId={rescheduleId}
        />
      )}
    </div>
  );
}
