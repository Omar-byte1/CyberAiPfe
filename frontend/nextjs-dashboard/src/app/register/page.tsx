"use client";

import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import {
  ShieldPlus,
  Lock,
  User,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  Check,
  X,
} from "lucide-react";
import Link from "next/link";

// ─── Password rules ──────────────────────────────────────────────────────────
const RULES = [
  {
    id: "length",
    label: "Au moins 8 caractères",
    test: (p: string) => p.length >= 8,
  },
  {
    id: "upper",
    label: "Une lettre majuscule (A-Z)",
    test: (p: string) => /[A-Z]/.test(p),
  },
  {
    id: "lower",
    label: "Une lettre minuscule (a-z)",
    test: (p: string) => /[a-z]/.test(p),
  },
  {
    id: "number",
    label: "Un chiffre (0-9)",
    test: (p: string) => /[0-9]/.test(p),
  },
  { id: "at", label: "Le caractère @", test: (p: string) => p.includes("@") },
];

function strengthLabel(score: number): { text: string; color: string } {
  if (score === 0) return { text: "", color: "bg-gray-200" };
  if (score <= 2) return { text: "Faible", color: "bg-red-500" };
  if (score <= 3) return { text: "Moyen", color: "bg-amber-500" };
  if (score === 4) return { text: "Bon", color: "bg-blue-500" };
  return { text: "Fort", color: "bg-green-500" };
}

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [touched, setTouched] = useState(false); // show rules after first type

  // Live rule evaluation
  const ruleResults = useMemo(
    () => RULES.map((r) => ({ ...r, passed: r.test(password) })),
    [password],
  );
  const score = ruleResults.filter((r) => r.passed).length;
  const allValid = score === RULES.length;
  const { text: strengthText, color: strengthColor } = strengthLabel(score);

  const passwordsMatch =
    password === confirmPassword && confirmPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password.trim()) {
      setError("Veuillez remplir tous les champs.");
      return;
    }
    if (!allValid) {
      setError(
        "Le mot de passe ne respecte pas toutes les règles de sécurité.",
      );
      return;
    }
    if (!passwordsMatch) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { detail?: string };
        setError(data.detail ?? "Erreur lors de l'inscription.");
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch {
      setError("Impossible de se connecter au service d'authentification.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-[430px]">
        {/* BACK */}
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-gray-700 transition-colors mb-6 text-xs font-bold tracking-widest uppercase group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />{" "}
          Retour à la connexion
        </Link>

        {/* CARD */}
        <div className="bg-white border border-gray-200 shadow-lg rounded-3xl p-8 md:p-10">
          {/* HEADER */}
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-green-50 border border-green-200 flex items-center justify-center mb-6">
              <ShieldPlus className="w-7 h-7 text-green-600" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-gray-900 mb-2">
              Inscription
            </h1>
            <p className="text-sm font-medium text-gray-400">
              Créez votre compte CyberAI personnel.
            </p>
          </div>

          {success ? (
            <div className="bg-green-50 border border-green-200 p-8 rounded-2xl text-center space-y-4">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
              <h3 className="text-xl font-black text-green-700">
                Compte déployé !
              </h3>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
                Redirection sécurisée...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* USERNAME */}
              <div className="space-y-1.5">
                <label className="block text-gray-500 text-[10px] uppercase tracking-widest font-bold ml-1">
                  Nom d&apos;utilisateur
                </label>
                <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 transition-all focus-within:border-green-500 focus-within:bg-white">
                  <User className="w-4 h-4 text-green-600/60 shrink-0" />
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Votre pseudo"
                    className="w-full bg-transparent outline-none text-sm text-gray-900 placeholder:text-gray-300 font-medium"
                  />
                </div>
              </div>

              {/* PASSWORD */}
              <div className="space-y-1.5">
                <label className="block text-gray-500 text-[10px] uppercase tracking-widest font-bold ml-1">
                  Mot de passe
                </label>
                <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 transition-all focus-within:border-green-500 focus-within:bg-white">
                  <Lock className="w-4 h-4 text-green-600/60 shrink-0" />
                  <input
                    type={showPwd ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setTouched(true);
                    }}
                    placeholder="••••••••"
                    className="w-full bg-transparent outline-none text-sm text-gray-900 placeholder:text-gray-300 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    className="text-gray-400 hover:text-gray-600 transition-colors shrink-0"
                  >
                    {showPwd ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* STRENGTH BAR */}
                {touched && (
                  <div className="mt-2 space-y-2">
                    {/* bar */}
                    <div className="flex gap-1 h-1">
                      {RULES.map((_, i) => (
                        <div
                          key={i}
                          className={`flex-1 rounded-full transition-all duration-300 ${i < score ? strengthColor : "bg-gray-200"}`}
                        />
                      ))}
                    </div>
                    {strengthText && (
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        Force :{" "}
                        <span
                          className={`${score <= 2 ? "text-red-500" : score <= 3 ? "text-amber-500" : score === 4 ? "text-blue-500" : "text-green-500"}`}
                        >
                          {strengthText}
                        </span>
                      </p>
                    )}

                    {/* Rule checklist */}
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-1.5">
                      {ruleResults.map((r) => (
                        <div
                          key={r.id}
                          className={`flex items-center gap-2 text-[11px] font-semibold transition-colors ${r.passed ? "text-green-600" : "text-gray-400"}`}
                        >
                          {r.passed ? (
                            <Check className="w-3 h-3 shrink-0 text-green-600" />
                          ) : (
                            <X className="w-3 h-3 shrink-0 text-gray-300" />
                          )}
                          {r.label}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* CONFIRM PASSWORD */}
              <div className="space-y-1.5">
                <label className="block text-gray-500 text-[10px] uppercase tracking-widest font-bold ml-1">
                  Confirmer mot de passe
                </label>
                <div
                  className={`flex items-center gap-3 bg-gray-50 border rounded-xl px-4 py-3.5 transition-all ${
                    confirmPassword.length > 0
                      ? passwordsMatch
                        ? "border-green-500"
                        : "border-red-400"
                      : "border-gray-200 focus-within:border-green-500"
                  } focus-within:bg-white`}
                >
                  <Lock className="w-4 h-4 text-green-600/60 shrink-0" />
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-transparent outline-none text-sm text-gray-900 placeholder:text-gray-300 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="text-gray-400 hover:text-gray-600 transition-colors shrink-0"
                  >
                    {showConfirm ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                  {confirmPassword.length > 0 &&
                    (passwordsMatch ? (
                      <Check className="w-4 h-4 text-green-500 shrink-0" />
                    ) : (
                      <X className="w-4 h-4 text-red-400 shrink-0" />
                    ))}
                </div>
                {confirmPassword.length > 0 && !passwordsMatch && (
                  <p className="text-[10px] text-red-500 font-semibold ml-1">
                    Les mots de passe ne correspondent pas.
                  </p>
                )}
              </div>

              {/* ERROR */}
              {error && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-xl text-xs font-bold">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shrink-0" />
                  {error}
                </div>
              )}

              {/* SUBMIT */}
              <button
                type="submit"
                disabled={
                  isLoading || !allValid || !passwordsMatch || !username.trim()
                }
                className="w-full relative group/btn inline-flex h-12 items-center justify-center overflow-hidden rounded-xl bg-green-600 px-6 font-medium text-white transition-all hover:bg-green-700 shadow-md hover:shadow-lg mt-6 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none"
              >
                <span className="relative flex items-center justify-center gap-2 text-xs font-black tracking-widest uppercase">
                  {isLoading ? (
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
                      Création...
                    </>
                  ) : (
                    "Créer mon compte"
                  )}
                </span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
