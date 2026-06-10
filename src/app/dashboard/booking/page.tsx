"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
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

export default function BookingPage() {
  const router = useRouter();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [slots, setSlots] = useState<ScheduleSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [monthlyCount, setMonthlyCount] = useState(0);

  useEffect(() => {
    fetchMonthlyCount();
  }, []);

  const fetchMonthlyCount = async () => {
    const res = await fetch("/api/bookings?action=count");
    if (res.ok) {
      const data = await res.json();
      setMonthlyCount(data.count);
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

  const getAvailableSlots = () => {
    const dayOfWeek = selectedDate ? selectedDate.getDay() : -1;
    return slots.filter((s) => s.dayOfWeek === dayOfWeek);
  };

  const handleBook = async (sessionId: string) => {
    if (monthlyCount >= 8) {
      setMessage("Has alcanzado el límite de 8 clases este mes");
      return;
    }

    setLoading(true);
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
      fetchMonthlyCount();
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } else {
      setMessage(data.error || "Error al reservar");
    }
    setLoading(false);
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold text-white">Reservar sesión</h2>

      {monthlyCount >= 8 && (
        <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm text-center">
          Has alcanzado el límite de 8 clases este mes
        </div>
      )}

      {message && (
        <div
          className={`p-3 rounded-xl text-sm text-center ${
            message.includes("confirmada")
              ? "bg-vitalis-green/20 text-vitalis-accent border border-vitalis-green/30"
              : "bg-red-500/10 text-red-400 border border-red-500/20"
          }`}
        >
          {message}
        </div>
      )}

      <div className="bg-vitalis-gray rounded-2xl p-4 border border-vitalis-gray-light">
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
        <div className="bg-vitalis-gray rounded-2xl p-4 border border-vitalis-gray-light">
          <h3 className="text-base font-bold text-white mb-3">
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
                return (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-vitalis-gray-light/50"
                  >
                    <div>
                      <p className="text-white font-medium">
                        {session.scheduleSlot.startTime} - {session.scheduleSlot.endTime}
                      </p>
                      <p className="text-xs text-vitalis-white/40">
                        {session.scheduleSlot.maxCapacity - session.currentCapacity} plazas disponibles
                      </p>
                    </div>
                    <button
                      disabled={isFull || monthlyCount >= 8 || loading}
                      onClick={() => handleBook(session.id)}
                      className="px-4 py-2 rounded-lg bg-vitalis-green hover:bg-vitalis-green-light text-white text-sm font-bold transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      {isFull ? "Completo" : "Reservar"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
