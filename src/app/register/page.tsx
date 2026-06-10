"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Error al crear la cuenta");
      return;
    }

    router.push("/login?registered=true");
  };

  return (
    <div className="min-h-screen flex flex-col bg-vitalis-black px-6">
      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <Image
              src="/logo.jpeg"
              alt="Vitalis"
              width={72}
              height={72}
              className="rounded-full object-cover mx-auto border-2 border-vitalis-green"
            />
          </Link>
          <h1 className="text-2xl font-bold text-white">Crear cuenta</h1>
          <p className="text-vitalis-white/50 text-sm mt-1">
            Únete a Vitalis y empieza a entrenar
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-vitalis-white/60 mb-1">
              Nombre completo
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl bg-vitalis-gray border border-vitalis-gray-light text-white placeholder:text-vitalis-white/30 focus:border-vitalis-green focus:outline-none transition-colors"
              placeholder="Tu nombre"
            />
          </div>
          <div>
            <label className="block text-sm text-vitalis-white/60 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl bg-vitalis-gray border border-vitalis-gray-light text-white placeholder:text-vitalis-white/30 focus:border-vitalis-green focus:outline-none transition-colors"
              placeholder="tu@email.com"
            />
          </div>
          <div>
            <label className="block text-sm text-vitalis-white/60 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 rounded-xl bg-vitalis-gray border border-vitalis-gray-light text-white placeholder:text-vitalis-white/30 focus:border-vitalis-green focus:outline-none transition-colors"
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-vitalis-green hover:bg-vitalis-green-light text-white font-bold transition-colors disabled:opacity-50"
          >
            {loading ? "Creando cuenta..." : "Crear cuenta"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-vitalis-white/40">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="text-vitalis-accent hover:underline">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
