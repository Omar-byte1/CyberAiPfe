"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Lock,
  User,
  ArrowRight,
  ArrowLeft,
  Clock,
  AlertTriangle,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

// Lockout paliers (mirrors backend)
function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m > 0) return `${m}m ${s.toString().padStart(2, "0")}s`;
  return `${s}s`;
}

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Rate-limit state
  const [failCount, setFailCount] = useState(0);
  const [lockoutSeconds, setLockoutSeconds] = useState(0); // live countdown
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /** Start (or restart) the visual countdown. */
  const startCountdown = useCallback((seconds: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setLockoutSeconds(seconds);
    timerRef.current = setInterval(() => {
      setLockoutSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          timerRef.current = null;
          setError("");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(
    () => () => {
      if (timerRef.current) clearInterval(timerRef.current);
    },
    [],
  );

  const isLocked = lockoutSeconds > 0;

  // Number of tries before next lockout
  const attemptsBeforeLock = isLocked ? 0 : 3 - (failCount % 3);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked || isLoading) return;
    setError("");

    if (!username.trim() || !password.trim()) {
      setError("Veuillez saisir un nom d'utilisateur et un mot de passe.");
      return;
    }

    const doLogin = async () => {
      setIsLoading(true);
      try {
        const res = await fetch("http://127.0.0.1:8000/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: username.trim(), password }),
        });

        if (res.ok) {
          const data = (await res.json()) as { access_token: string };
          if (
            typeof data.access_token === "string" &&
            data.access_token.length > 0
          ) {
            localStorage.setItem("token", data.access_token);
            localStorage.removeItem("auth");
            router.replace("/dashboard");
            return;
          }
          setError("Erreur inattendue du serveur.");
          return;
        }

        // Parse error detail from backend
        let detail: {
          message?: string;
          fail_count?: number;
          seconds_remaining?: number;
        } = {};
        try {
          const body = (await res.json()) as { detail: typeof detail };
          detail = body.detail ?? {};
        } catch {
          /* ignore */
        }

        const newFail = detail.fail_count ?? failCount + 1;
        const lockSecs = detail.seconds_remaining ?? 0;

        setFailCount(newFail);

        if (res.status === 429 || lockSecs > 0) {
          startCountdown(lockSecs);
          setError(
            detail.message ??
              `Compte bloqué. Attendez ${formatCountdown(lockSecs)}.`,
          );
        } else {
          setError(detail.message ?? "Identifiants incorrects.");
        }
      } catch {
        setError("Impossible de se connecter au service d'authentification.");
      } finally {
        setIsLoading(false);
      }
    };

    void doLogin();
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-[420px]">
        {/* BACK BUTTON */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-gray-700 transition-colors mb-6 text-xs font-bold tracking-widest uppercase group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />{" "}
          Retour à l'accueil
        </Link>

        {/* LOGIN CARD */}
        <div
          className={`bg-white border shadow-lg rounded-3xl p-8 md:p-10 transition-all duration-500 ${isLocked ? "border-red-300" : "border-gray-200"}`}
        >
          {/* LOGO + TITLE */}
          <div className="text-center mb-8">
            <div className="mx-auto w-20 h-20 rounded-2xl flex items-center justify-center mb-6">
              <Image
                src="/logo.png"
                alt="CyberAI Logo"
                width={80}
                height={80}
                className="rounded-2xl"
              />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-gray-900 mb-2">
              SOC Login
            </h1>
            <p className="text-sm font-medium text-gray-400">
              Authentifiez-vous pour accéder au dashboard de cybersécurité.
            </p>
          </div>

          {/* LOCKOUT COUNTDOWN BANNER */}
          {isLocked && (
            <div className="mb-6 rounded-2xl bg-red-50 border border-red-200 p-4 text-center">
              <div className="flex items-center justify-center gap-2 text-red-600 mb-3">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-xs font-black uppercase tracking-widest">
                  Accès verrouillé
                </span>
              </div>
              <div className="flex items-center justify-center gap-3">
                <Clock className="w-5 h-5 text-red-500" />
                <span className="text-3xl font-black tabular-nums text-red-700 tracking-tight">
                  {formatCountdown(lockoutSeconds)}
                </span>
              </div>
              <p className="text-[11px] text-red-400 mt-2 font-medium">
                {failCount} tentative{failCount > 1 ? "s" : ""} échouée
                {failCount > 1 ? "s" : ""} — réessayez après le délai
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* USERNAME */}
            <div className="space-y-1.5">
              <label className="block text-gray-500 text-[10px] uppercase tracking-widest font-bold ml-1">
                Nom d&apos;utilisateur
              </label>
              <div
                className={`flex items-center gap-3 bg-gray-50 border rounded-xl px-4 py-3.5 transition-all ${isLocked ? "border-gray-200 opacity-50 cursor-not-allowed" : "border-gray-200 focus-within:border-green-500 focus-within:bg-white"}`}
              >
                <User className="w-4 h-4 text-green-600/60 shrink-0" />
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="soc / admin"
                  disabled={isLocked}
                  className="w-full bg-transparent outline-none text-sm text-gray-900 placeholder:text-gray-300 font-medium disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div className="space-y-1.5">
              <label className="block text-gray-500 text-[10px] uppercase tracking-widest font-bold ml-1">
                Mot de passe
              </label>
              <div
                className={`flex items-center gap-3 bg-gray-50 border rounded-xl px-4 py-3.5 transition-all ${isLocked ? "border-gray-200 opacity-50 cursor-not-allowed" : "border-gray-200 focus-within:border-green-500 focus-within:bg-white"}`}
              >
                <Lock className="w-4 h-4 text-green-600/60 shrink-0" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={isLocked}
                  className="w-full bg-transparent outline-none text-sm text-gray-900 placeholder:text-gray-300 font-medium disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* FAIL COUNT INDICATOR (before lockout) */}
            {!isLocked && failCount > 0 && failCount % 3 !== 0 && (
              <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 px-4 py-3 rounded-xl">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <div className="flex-1">
                  <p className="text-[11px] font-bold text-amber-700">
                    {failCount} tentative{failCount > 1 ? "s" : ""} échouée
                    {failCount > 1 ? "s" : ""}
                  </p>
                  <p className="text-[10px] text-amber-500 mt-0.5">
                    Encore{" "}
                    <span className="font-black text-amber-600">
                      {attemptsBeforeLock}
                    </span>{" "}
                    essai{attemptsBeforeLock > 1 ? "s" : ""} avant blocage
                    temporaire
                  </p>
                </div>
                {/* Dots */}
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full transition-colors ${i < failCount % 3 ? "bg-red-500" : "bg-gray-200"}`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* ERROR (non-lockout) */}
            {error && !isLocked && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-xl text-xs font-bold">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shrink-0" />
                {error}
              </div>
            )}

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={isLocked || isLoading}
              className={`w-full relative group/btn inline-flex h-12 items-center justify-center overflow-hidden rounded-xl px-6 font-medium text-white transition-all mt-4 ${
                isLocked
                  ? "bg-red-100 border border-red-200 cursor-not-allowed text-red-400"
                  : "bg-green-600 hover:bg-green-700 shadow-md hover:shadow-lg"
              } ${isLoading ? "opacity-70 cursor-wait" : ""}`}
            >
              <span className="relative flex items-center justify-center gap-2 text-xs font-black tracking-widest uppercase">
                {isLocked ? (
                  <>
                    <Lock className="w-4 h-4" /> Bloqué —{" "}
                    {formatCountdown(lockoutSeconds)}
                  </>
                ) : isLoading ? (
                  <>
                    <svg
                      className="animate-spin w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8H4z"
                      />
                    </svg>
                    Vérification...
                  </>
                ) : (
                  <>
                    Se Connecter <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </span>
            </button>

            <div className="text-center mt-6 pt-6 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-400">
                Pas encore de compte ?{" "}
                <button
                  type="button"
                  onClick={() => router.push("/register")}
                  className="text-green-600 hover:text-green-700 font-bold transition-colors ml-1"
                >
                  Inscrivez-vous
                </button>
              </p>
            </div>
          </form>

          {/* Demo Box */}
          <div className="mt-8 relative overflow-hidden rounded-xl bg-gray-50 border border-gray-200 p-4 text-center">
            <span className="absolute top-0 right-0 px-2 py-1 bg-gray-100 rounded-bl-lg text-[9px] font-bold text-gray-400 uppercase tracking-widest">
              Demo
            </span>
            <p className="text-xs font-bold text-gray-500 mb-1"></p>
            <p className="text-xs text-gray-400 font-mono">
              <span className="text-green-600"></span>{" "}
              <span className="text-green-600"></span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
