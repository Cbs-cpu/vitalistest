"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";

export default function SubscriptionPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubscribe = async () => {
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "Error al iniciar el pago");
        setLoading(false);
        return;
      }

      if (!data.url) {
        setMessage("No se recibió la URL de pago de Stripe");
        setLoading(false);
        return;
      }

      window.location.href = data.url;
    } catch (err: any) {
      setMessage(err?.message || "Error de conexión al servidor");
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    setLoading(true);
    setMessage("");

    const res = await fetch("/api/stripe/cancel", {
      method: "POST",
    });

    const data = await res.json();

    if (res.ok) {
      setMessage("Subscripción cancelada. Seguirás teniendo acceso hasta el final del periodo.");
      setTimeout(() => window.location.reload(), 2000);
    } else {
      setMessage(data.error || "Error al cancelar");
    }

    setLoading(false);
  };

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-xl font-bold text-white">Subscripción</h2>

      {message && (
        <div className="p-3 rounded-xl bg-vitalis-green/20 border border-vitalis-green/30 text-vitalis-accent text-sm text-center">
          {message}
        </div>
      )}

      <div className="bg-vitalis-gray rounded-2xl p-6 border border-vitalis-gray-light text-center">
        <div className="w-full mb-4 rounded-xl overflow-hidden">
          <Image
            src="/banner.jpeg"
            alt="Vitalis"
            width={320}
            height={160}
            className="w-full h-36 object-cover"
          />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">Plan Mensual Vitalis</h3>
        <div className="text-4xl font-black text-vitalis-accent mb-1">160€</div>
        <p className="text-vitalis-white/40 text-sm mb-6">al mes</p>

        <ul className="space-y-3 text-left mb-8">
          <li className="flex items-start gap-2 text-sm text-vitalis-white/70">
            <span className="text-vitalis-accent mt-0.5">✓</span>
            8 clases de entrenamiento personal al mes
          </li>
          <li className="flex items-start gap-2 text-sm text-vitalis-white/70">
            <span className="text-vitalis-accent mt-0.5">✓</span>
            2 sesiones por semana con tu entrenador
          </li>
          <li className="flex items-start gap-2 text-sm text-vitalis-white/70">
            <span className="text-vitalis-accent mt-0.5">✓</span>
            Reserva flexible desde la app
          </li>
          <li className="flex items-start gap-2 text-sm text-vitalis-white/70">
            <span className="text-vitalis-accent mt-0.5">✓</span>
            Plan de entrenamiento personalizado
          </li>
          <li className="flex items-start gap-2 text-sm text-vitalis-white/70">
            <span className="text-vitalis-accent mt-0.5">✓</span>
            Cancela cuando quieras
          </li>
        </ul>

        <button
          onClick={handleSubscribe}
          disabled={loading}
          className="w-full py-3 rounded-xl bg-vitalis-green hover:bg-vitalis-green-light text-white font-bold transition-colors disabled:opacity-50"
        >
          {loading ? "Procesando..." : "Suscribirse por 160€/mes"}
        </button>

        <p className="mt-4 text-xs text-vitalis-white/30">
          Pago seguro con Stripe. Cancela en cualquier momento.
        </p>
      </div>
    </div>
  );
}
