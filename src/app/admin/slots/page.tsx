"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

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

const DAY_NAMES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export default function AdminSlotsPage() {
  const router = useRouter();
  const [slots, setSlots] = useState<ScheduleSlot[]>([]);
  const [showCreateSlot, setShowCreateSlot] = useState(false);
  const [showGenerate, setShowGenerate] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("09:00");
  const [maxCapacity, setMaxCapacity] = useState(10);
  const [generateMonth, setGenerateMonth] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    fetchSlots();
  }, []);

  const fetchSlots = async () => {
    const res = await fetch("/api/admin/slots");
    if (res.ok) {
      const data = await res.json();
      setSlots(data.slots);
    }
  };

  const handleCreateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const res = await fetch("/api/admin/slots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dayOfWeek, startTime, endTime, maxCapacity }),
    });

    const data = await res.json();

    if (res.ok) {
      setMessage("Horario creado correctamente");
      setShowCreateSlot(false);
      fetchSlots();
    } else {
      setMessage(data.error || "Error");
    }
    setLoading(false);
  };

  const handleGenerateSessions = async (slotId: string) => {
    setLoading(true);
    setMessage("");

    const res = await fetch("/api/admin/slots/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slotId, month: generateMonth }),
    });

    const data = await res.json();

    if (res.ok) {
      setMessage(`Generadas ${data.count} sesiones para el mes`);
    } else {
      setMessage(data.error || "Error");
    }
    setLoading(false);
  };

  const handleDeleteSlot = async (slotId: string) => {
    const res = await fetch(`/api/admin/slots?slotId=${slotId}`, { method: "DELETE" });
    if (res.ok) fetchSlots();
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold text-white">Gestión de horarios</h2>

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

      <button
        onClick={() => setShowCreateSlot(!showCreateSlot)}
        className="px-4 py-2 rounded-xl bg-vitalis-green hover:bg-vitalis-green-light text-white text-sm font-bold transition-colors"
      >
        {showCreateSlot ? "Cancelar" : "+ Nuevo horario"}
      </button>

      {showCreateSlot && (
        <form onSubmit={handleCreateSlot} className="bg-vitalis-gray rounded-2xl p-4 border border-vitalis-gray-light space-y-3">
          <div>
            <label className="block text-xs text-vitalis-white/50 mb-1">Día de la semana</label>
            <select
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-vitalis-gray-light border border-vitalis-gray-light text-white text-sm"
            >
              {DAY_NAMES.map((name, i) => (
                <option key={i} value={i}>{name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-vitalis-white/50 mb-1">Hora inicio</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-vitalis-gray-light border border-vitalis-gray-light text-white text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-vitalis-white/50 mb-1">Hora fin</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-vitalis-gray-light border border-vitalis-gray-light text-white text-sm"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-vitalis-white/50 mb-1">Capacidad máxima</label>
            <input
              type="number"
              value={maxCapacity}
              onChange={(e) => setMaxCapacity(Number(e.target.value))}
              min={1}
              className="w-full px-3 py-2 rounded-xl bg-vitalis-gray-light border border-vitalis-gray-light text-white text-sm"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded-xl bg-vitalis-green hover:bg-vitalis-green-light text-white text-sm font-bold transition-colors disabled:opacity-50"
          >
            {loading ? "Creando..." : "Crear horario"}
          </button>
        </form>
      )}

      <div className="space-y-3">
        {slots.length === 0 && (
          <div className="text-center py-8 text-vitalis-white/40">No hay horarios creados</div>
        )}

        {slots.map((slot) => (
          <div key={slot.id} className="bg-vitalis-gray rounded-xl p-4 border border-vitalis-gray-light">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-white font-medium">{DAY_NAMES[slot.dayOfWeek]}</p>
                <p className="text-sm text-vitalis-white/50">
                  {slot.startTime} - {slot.endTime} · {slot.maxCapacity} plazas
                </p>
              </div>
              <button
                onClick={() => handleDeleteSlot(slot.id)}
                className="text-xs text-red-400 hover:text-red-300"
              >
                Eliminar
              </button>
            </div>

            <div className="flex items-center gap-2 mt-3">
              <input
                type="month"
                value={generateMonth}
                onChange={(e) => setGenerateMonth(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-vitalis-gray-light border border-vitalis-gray-light text-white text-xs"
              />
              <button
                onClick={() => handleGenerateSessions(slot.id)}
                disabled={loading}
                className="px-3 py-1.5 rounded-lg bg-vitalis-green/20 text-vitalis-accent text-xs font-medium hover:bg-vitalis-green/40 transition-colors disabled:opacity-50"
              >
                Generar sesiones
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-vitalis-gray rounded-2xl p-4 border border-vitalis-gray-light">
        <h3 className="text-sm font-bold text-vitalis-white/70 mb-2">Instrucciones</h3>
        <ol className="text-xs text-vitalis-white/50 space-y-1 list-decimal list-inside">
          <li>Crea los horarios semanales (día + hora)</li>
          <li>Genera las sesiones para cada mes</li>
          <li>Los clientes podrán reservar en esas sesiones</li>
        </ol>
      </div>
    </div>
  );
}
