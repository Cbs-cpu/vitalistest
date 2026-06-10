"use client";

import { useState, useEffect, useCallback } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  isBefore,
  startOfDay,
} from "date-fns";
import { es } from "date-fns/locale";

interface ScheduleSlot {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  maxCapacity: number;
}

interface ClassSession {
  id: string;
  scheduleSlotId: string;
  date: string;
  currentCapacity: number;
  scheduleSlot: ScheduleSlot;
}

interface CalendarPopupProps {
  onClose: () => void;
  onBooked: () => void;
  rescheduleBookingId?: string | null;
  mode?: "client" | "admin";
  userId?: string;
}

export function CalendarPopup({ onClose, onBooked, rescheduleBookingId, mode = "client", userId }: CalendarPopupProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [slots, setSlots] = useState<ScheduleSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [monthlyCount, setMonthlyCount] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);
  const isAdmin = mode === "admin";

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    if (isAdmin) return;
    const res = await fetch("/api/bookings?action=mybookings");
    if (res.ok) {
      const data = await res.json();
      setMonthlyCount(data.monthlyCount);
    }
  };

  const fetchSessions = useCallback(async (month: Date) => {
    setLoading(true);
    const monthStr = format(month, "yyyy-MM");
    const res = await fetch(`/api/bookings?action=sessions&month=${monthStr}`);
    if (res.ok) {
      const data = await res.json();
      setSessions(data.sessions || []);
      setSlots(data.slots || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSessions(currentMonth);
  }, [currentMonth, fetchSessions]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const today = startOfDay(new Date());

  const sessionsOnDate = selectedDate
    ? sessions.filter((s) => isSameDay(new Date(s.date), selectedDate))
    : [];

  const handleBook = async (sessionId: string) => {
    if (actionLoading) return;

    if (isAdmin && userId) {
      setActionLoading(true);
      setMessage("");
      const res = await fetch("/api/admin/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, classSessionId: sessionId }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("¡Reserva creada!");
        fetchSessions(currentMonth);
        setTimeout(() => onBooked(), 1000);
      } else {
        setMessage(data.error || "Error al crear reserva");
      }
      setActionLoading(false);
      return;
    }

    if (rescheduleBookingId) {
      setActionLoading(true);
      setMessage("");

      const cancelRes = await fetch(`/api/bookings?bookingId=${encodeURIComponent(rescheduleBookingId)}`, {
        method: "DELETE",
      });

      if (!cancelRes.ok) {
        const data = await cancelRes.json();
        setMessage(data.error || "Error al cancelar");
        setActionLoading(false);
        return;
      }

      const bookRes = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classSessionId: sessionId }),
      });

      const bookData = await bookRes.json();

      if (bookRes.ok) {
        setMessage("¡Reagendada con éxito!");
        setTimeout(() => onBooked(), 1000);
      } else {
        setMessage(bookData.error || "Error al reagendar");
      }
      setActionLoading(false);
      return;
    }

    if (!isAdmin && monthlyCount >= 8) {
      setMessage("Has alcanzado el límite de 8 clases este mes");
      return;
    }

    setActionLoading(true);
    setMessage("");
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ classSessionId: sessionId }),
    });

    const data = await res.json();

    if (res.ok) {
      setMessage("¡Reserva confirmada!");
      fetchSessions(currentMonth);
      fetchDashboardData();
      setTimeout(() => onBooked(), 1000);
    } else {
      setMessage(data.error || "Error al reservar");
    }
    setActionLoading(false);
  };

  const title = isAdmin
    ? "Agendar sesión"
    : rescheduleBookingId
    ? "Reagendar sesión"
    : "Agendar sesión";

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={() => !actionLoading && onClose()} />
      <div className="relative bg-vitalis-gray w-full sm:max-w-md max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-vitalis-gray-light p-4 space-y-4 animate-slide-up">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <button
            onClick={onClose}
            disabled={actionLoading}
            className="p-2 text-vitalis-white/50 hover:text-white disabled:opacity-30"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {message && (
          <div
            className={`p-3 rounded-xl text-sm text-center ${
              message.includes("confirmada") || message.includes("éxito") || message.includes("creada")
                ? "bg-vitalis-green/20 text-vitalis-accent border border-vitalis-green/30"
                : "bg-red-500/10 text-red-400 border border-red-500/20"
            }`}
          >
            {message}
          </div>
        )}

        <div className="bg-vitalis-gray-light/50 rounded-2xl p-4 border border-vitalis-gray-light">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-2 text-vitalis-white/60 hover:text-white"
            >
              ←
            </button>
            <h3 className="text-base font-bold text-white capitalize">
              {format(currentMonth, "MMMM yyyy", { locale: es })}
            </h3>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-2 text-vitalis-white/60 hover:text-white"
            >
              →
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {["L", "M", "X", "J", "V", "S", "D"].map((d) => (
              <div key={d} className="text-center text-xs text-vitalis-white/40 py-1">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
              const hasSession = sessions.some((s) => isSameDay(new Date(s.date), day));
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isPast = isBefore(day, today) && !isToday(day);
              const inMonth = isSameMonth(day, currentMonth);

              return (
                <button
                  key={day.toISOString()}
                  disabled={isPast || !hasSession}
                  onClick={() => setSelectedDate(day)}
                  className={`aspect-square rounded-xl flex items-center justify-center text-sm transition-all ${
                    isSelected
                      ? "bg-vitalis-green text-white font-bold"
                      : hasSession && !isPast
                      ? "bg-vitalis-green/20 text-vitalis-accent hover:bg-vitalis-green/40"
                      : isPast
                      ? "text-vitalis-white/10 cursor-not-allowed"
                      : "text-vitalis-white/30"
                  } ${!inMonth && "opacity-30"}`}
                >
                  {format(day, "d")}
                </button>
              );
            })}
          </div>
        </div>

        {selectedDate && (
          <div className="bg-vitalis-gray-light/50 rounded-2xl p-4 border border-vitalis-gray-light">
            <h3 className="text-base font-bold text-white mb-3 capitalize">
              {format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
            </h3>

            {loading ? (
              <p className="text-vitalis-white/40 text-sm">Cargando horarios...</p>
            ) : sessionsOnDate.length === 0 ? (
              <p className="text-vitalis-white/40 text-sm">No hay sesiones disponibles este día</p>
            ) : (
              <div className="space-y-2">
                {sessionsOnDate.map((session) => {
                  const available = session.currentCapacity < session.scheduleSlot.maxCapacity;
                  const isFull = !available;
                  const buttonDisabled = isFull || (!isAdmin && monthlyCount >= 8) || actionLoading;

                  return (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-vitalis-gray"
                    >
                      <div>
                        <p className="text-white font-medium">
                          {session.scheduleSlot.startTime} - {session.scheduleSlot.endTime}
                        </p>
                        <p className="text-xs text-vitalis-white/40">
                          {isFull
                            ? "Completo"
                            : `${session.scheduleSlot.maxCapacity - session.currentCapacity} plazas disponibles`}
                        </p>
                      </div>
                      <button
                        disabled={buttonDisabled}
                        onClick={() => handleBook(session.id)}
                        className="px-4 py-2 rounded-lg bg-vitalis-green hover:bg-vitalis-green-light text-white text-sm font-bold transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        {isFull ? "Completo" : isAdmin ? "Reservar" : rescheduleBookingId ? "Reagendar" : "Reservar"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
