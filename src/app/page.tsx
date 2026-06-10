import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-vitalis-black">
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="mb-6">
          <div className="w-28 h-28 mx-auto rounded-full border-[3px] border-white p-1 flex items-center justify-center bg-vitalis-black">
            <Image
              src="/logo.jpeg"
              alt="Vitalis"
              width={100}
              height={100}
              className="rounded-full object-cover"
              priority
            />
          </div>
          <h1
            className="text-5xl font-black text-white tracking-wider mt-5"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            VITALIS
          </h1>
          <p className="mt-2 text-vitalis-white/60 text-base" style={{ fontFamily: "var(--font-body)" }}>
            Bienvenido a Vitalis
          </p>
          <p className="mt-1 text-vitalis-accent h-5" style={{ fontFamily: "var(--font-body)" }}>
            &nbsp;
          </p>
        </div>

        <div className="w-full max-w-xs space-y-3">
          <Link
            href="/register"
            className="block w-full py-3 rounded-xl bg-vitalis-green hover:bg-vitalis-green-light text-white font-bold text-center transition-colors"
          >
            Crear cuenta
          </Link>
          <Link
            href="/login"
            className="block w-full py-3 rounded-xl border border-vitalis-gray-light text-vitalis-white/80 hover:text-white hover:border-vitalis-green text-center transition-colors font-medium"
          >
            Iniciar sesión
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-vitalis-accent">8</div>
            <div className="text-xs text-vitalis-white/40">Clases / mes</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-vitalis-accent">2</div>
            <div className="text-xs text-vitalis-white/40">Por semana</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-vitalis-accent">1a1</div>
            <div className="text-xs text-vitalis-white/40">Personal</div>
          </div>
        </div>
      </div>

      <div className="py-6 text-center text-xs text-vitalis-white/20">
        Vitalis &copy; {new Date().getFullYear()}
      </div>
    </div>
  );
}
