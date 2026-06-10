"use client";

import { useState, useEffect, useCallback } from "react";
import { ClientPopup } from "@/components/ClientPopup";

interface ClientData {
  id: string;
  name: string;
  email: string;
  subscriptionStatus: string;
  bookings: any[];
  monthlyCount: number;
}

export default function AdminClientsPage() {
  const [clients, setClients] = useState<ClientData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<ClientData | null>(null);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/clients");
    if (res.ok) {
      const data = await res.json();
      setClients(data.clients);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleUpdated = () => {
    setSelectedClient(null);
    fetchClients();
  };

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-[300px]">
        <p className="text-vitalis-white/40">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 pb-24">
      <h2 className="text-xl font-bold text-white">Clientes</h2>

      {clients.length === 0 ? (
        <div className="bg-vitalis-gray rounded-2xl p-8 border border-vitalis-gray-light text-center">
          <p className="text-vitalis-white/40 text-sm">No hay clientes registrados</p>
        </div>
      ) : (
        <div className="space-y-3">
          {clients.map((client) => {
            const subscribed = client.subscriptionStatus === "ACTIVE";
            const initials = client.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();

            return (
              <button
                key={client.id}
                onClick={() => setSelectedClient(client)}
                className="w-full bg-vitalis-gray rounded-2xl p-4 border border-vitalis-gray-light hover:border-vitalis-green/50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-vitalis-green flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-white font-medium truncate">{client.name}</p>
                      <div
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          subscribed ? "bg-vitalis-accent" : "bg-red-500"
                        }`}
                      />
                    </div>
                    <p className="text-xs text-vitalis-white/40 truncate">{client.email}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-xs text-vitalis-accent font-bold">
                        {client.monthlyCount}/8 clases
                      </span>
                      <span className="text-xs text-vitalis-white/40">
                        {client.bookings.length} reservas activas
                      </span>
                    </div>
                  </div>
                  <svg className="w-4 h-4 text-vitalis-white/30 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {selectedClient && (
        <ClientPopup
          client={selectedClient}
          onClose={() => setSelectedClient(null)}
          onUpdated={handleUpdated}
        />
      )}
    </div>
  );
}
