"use client";

import { useState, useEffect } from "react";
import { CalendarPopup } from "@/components/CalendarPopup";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ClientBooking {
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

interface ClientData {
  id: string;
  name: string;
  email: string;
  subscriptionStatus: string;
  bookings: ClientBooking[];
  monthlyCount: number;
}

interface Props {
  client: ClientData;
  onClose: () => void;
  onUpdated: () => void;
}

export function ClientPopup({ client, onClose, onUpdated }: Props) {
  const [showCalendar, setShowCalendar] = useState(false);
  const [cancelLoading, setCancelLoading] = useState<string | null>(null);

  const handleCancel = async (bookingId: string) => {
    setCancelLoading(bookingId);
    const res = await fetch(`/api/admin/bookings?bookingId=${encodeURIComponent(bookingId)}`, {
      method: "DELETE",
    });
    if (res.ok) {
      onUpdated();
    }
    setCancelLoading(null);
  };

  const handleBooked = () => {
    setShowCalendar(false);
    onUpdated();
  };

  const formatBookingDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const dayName = format(date, "EEEE", { locale: es });
    const dayNum = format(date, "d");
    const month = format(date, "MMMM", { locale: es });
    return { dayName, dayNum, month };
  };

  const subscribed = client.subscriptionStatus === "ACTIVE";
  const remaining = 8 - client.monthlyCount;

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
        <div className="absolute inset-0 bg-black/70" onClick={onClose} />
        <div className="relative bg-vitalis-gray w-full sm:max-w-md max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-vitalis-gray-light p-4 space-y-4 animate-slide-up">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">{client.name}</h2>
            <button onClick={onClose} className="p-2 text-vitalis-white/50 hover:text-white">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="text-sm text-vitalis-white/50">{client.email}</div>

          <div className="flex items-center gap-2">
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                subscribed ? "bg-vitalis-accent" : "bg-red-500"
              }`}
            />
            <span className={`text-sm font-medium ${subscribed ? "text-vitalis-accent" : "text-red-400"}`}>
              {subscribed ? "Activa" : "Inactiva"}
            </span>
          </div>

          <div className="bg-vitalis-gray-light/50 rounded-xl p-4 border border-vitalis-gray-light">
            <p className="text-xs text-vitalis-white/50 mb-1">Clases este mes</p>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-black text-vitalis-accent">{client.monthlyCount}</span>
              <span className="text-vitalis-white/40 text-sm pb-0.5">/ 8</span>
            </div>
            <div className="mt-2 w-full bg-vitalis-gray rounded-full h-1.5">
              <div
                className="bg-vitalis-green h-1.5 rounded-full transition-all"
                style={{ width: `${Math.min((client.monthlyCount / 8) * 100, 100)}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-vitalis-white/40">
              {remaining > 0 ? `${remaining} clases restantes` : "Límite alcanzado"}
            </p>
          </div>

          <button
            onClick={() => setShowCalendar(true)}
            className="w-full py-3 rounded-xl bg-vitalis-green hover:bg-vitalis-green-light text-white font-bold text-sm transition-colors"
          >
            Agendar sesión
          </button>

          <div>
            <h3 className="text-sm font-bold text-white mb-2">Próximas reservas</h3>
            {client.bookings.length === 0 ? (
              <p className="text-vitalis-white/40 text-sm text-center py-4">Sin reservas</p>
            ) : (
              <div className="space-y-2">
                {client.bookings.map((booking) => {
                  const { dayName, dayNum, month } = formatBookingDate(booking.classSession.date);
                  const isCancelling = cancelLoading === booking.id;

                  return (
                    <div
                      key={booking.id}
                      className="bg-vitalis-gray-light/50 rounded-xl p-3 border border-vitalis-gray-light"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-vitalis-accent font-bold text-sm capitalize">
                            {dayName} {dayNum} de {month}
                          </p>
                          <p className="text-vitalis-accent text-xs mt-0.5">
                            {booking.classSession.scheduleSlot.startTime} -{" "}
                            {booking.classSession.scheduleSlot.endTime}
                          </p>
                        </div>
                        <button
                          onClick={() => handleCancel(booking.id)}
                          disabled={isCancelling}
                          className="p-1.5 text-vitalis-white/40 hover:text-red-400 transition-colors disabled:opacity-30"
                          title="Cancelar reserva"
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
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {showCalendar && (
        <CalendarPopup
          mode="admin"
          userId={client.id}
          onClose={() => setShowCalendar(false)}
          onBooked={handleBooked}
        />
      )}
    </>
  );
}
