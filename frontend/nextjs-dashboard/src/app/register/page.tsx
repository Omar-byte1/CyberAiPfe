"use client";

import { useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';
import { ShieldPlus, Lock, User, ArrowLeft, CheckCircle2, Eye, EyeOff, Check, X } from 'lucide-react';
import Link from 'next/link';

// ─── Password rules ──────────────────────────────────────────────────────────
const RULES = [
  { id: 'length',    label: 'Au moins 8 caractères',       test: (p: string) => p.length >= 8 },
  { id: 'upper',     label: 'Une lettre majuscule (A-Z)',   test: (p: string) => /[A-Z]/.test(p) },
  { id: 'lower',     label: 'Une lettre minuscule (a-z)',   test: (p: string) => /[a-z]/.test(p) },
  { id: 'number',    label: 'Un chiffre (0-9)',             test: (p: string) => /[0-9]/.test(p) },
  { id: 'at',        label: 'Le caractère @',               test: (p: string) => p.includes('@') },
];

function strengthLabel(score: number): { text: string; color: string } {
  if (score === 0) return { text: '',         color: 'bg-zinc-800' };
  if (score <= 2)  return { text: 'Faible',   color: 'bg-rose-500' };
  if (score <= 3)  return { text: 'Moyen',    color: 'bg-amber-500' };
  if (score === 4) return { text: 'Bon',      color: 'bg-blue-500' };
  return             { text: 'Fort',          color: 'bg-emerald-500' };
}

export default function RegisterPage() {
  const router = useRouter();
  const [username,        setUsername]        = useState('');
  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPwd,         setShowPwd]         = useState(false);
  const [showConfirm,     setShowConfirm]     = useState(false);
  const [error,           setError]           = useState('');
  const [success,         setSuccess]         = useState(false);
  const [isLoading,       setIsLoading]       = useState(false);
  const [touched,         setTouched]         = useState(false); // show rules after first type

  // Live rule evaluation
  const ruleResults = useMemo(
    () => RULES.map((r) => ({ ...r, passed: r.test(password) })),
    [password]
  );
  const score    = ruleResults.filter((r) => r.passed).length;
  const allValid = score === RULES.length;
  const { text: strengthText, color: strengthColor } = strengthLabel(score);

  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Veuillez remplir tous les champs.');
      return;
    }
    if (!allValid) {
      setError('Le mot de passe ne respecte pas toutes les règles de sécurité.');
      return;
    }
    if (!passwordsMatch) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      if (!res.ok) {
        const data = await res.json() as { detail?: string };
        setError(data.detail ?? "Erreur lors de l'inscription.");
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push('/login'), 2000);
    } catch {
      setError("Impossible de se connecter au service d'authentification.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030303] text-zinc-50 flex items-center justify-center p-4 relative overflow-hidden font-sans">

      {/* BACKGROUND */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
        <div className="absolute top-[20%] right-[20%] w-[40%] h-[40%] rounded-full bg-emerald-600/15 blur-[150px] animate-pulse mix-blend-screen" style={{ animationDuration: '10s' }} />
      </div>

      <div className="w-full max-w-[430px] relative z-10">

        {/* BACK */}
        <Link href="/login" className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-6 text-xs font-bold tracking-widest uppercase group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Retour à la connexion
        </Link>

        {/* CARD */}
        <div className="bg-[#0a0a0a]/80 backdrop-blur-2xl border border-white/[0.08] shadow-[0_8px_32px_0_rgba(0,0,0,0.36),inset_0_1px_0_0_rgba(255,255,255,0.05)] rounded-[32px] p-8 md:p-10 relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent rounded-t-[32px]" />

          {/* HEADER */}
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center mb-6 shadow-[0_0_30px_-5px_rgba(16,185,129,0.3)]">
              <ShieldPlus className="w-7 h-7 text-emerald-400" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white mb-2">Inscription</h1>
            <p className="text-sm font-medium text-zinc-500">Créez votre compte CyberAI personnel.</p>
          </div>

          {success ? (
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-8 rounded-2xl text-center space-y-4">
              <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto" />
              <h3 className="text-xl font-black text-emerald-300">Compte déployé !</h3>
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Redirection sécurisée...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* USERNAME */}
              <div className="space-y-1.5">
                <label className="block text-zinc-400 text-[10px] uppercase tracking-widest font-bold ml-1">Nom d'utilisateur</label>
                <div className="flex items-center gap-3 bg-[#030303] border border-white/[0.05] rounded-xl px-4 py-3.5 transition-all focus-within:border-emerald-500/50 focus-within:bg-white/[0.02]">
                  <User className="w-4 h-4 text-emerald-500/70 shrink-0" />
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Votre pseudo"
                    className="w-full bg-transparent outline-none text-sm text-zinc-100 placeholder:text-zinc-600 font-medium"
                  />
                </div>
              </div>

              {/* PASSWORD */}
              <div className="space-y-1.5">
                <label className="block text-zinc-400 text-[10px] uppercase tracking-widest font-bold ml-1">Mot de passe</label>
                <div className="flex items-center gap-3 bg-[#030303] border border-white/[0.05] rounded-xl px-4 py-3.5 transition-all focus-within:border-emerald-500/50 focus-within:bg-white/[0.02]">
                  <Lock className="w-4 h-4 text-emerald-500/70 shrink-0" />
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setTouched(true); }}
                    placeholder="••••••••"
                    className="w-full bg-transparent outline-none text-sm text-zinc-100 placeholder:text-zinc-600 font-medium"
                  />
                  <button type="button" onClick={() => setShowPwd((v) => !v)} className="text-zinc-600 hover:text-zinc-300 transition-colors shrink-0">
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
                          className={`flex-1 rounded-full transition-all duration-300 ${i < score ? strengthColor : 'bg-zinc-800'}`}
                        />
                      ))}
                    </div>
                    {strengthText && (
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                        Force : <span className={`${score <= 2 ? 'text-rose-400' : score <= 3 ? 'text-amber-400' : score === 4 ? 'text-blue-400' : 'text-emerald-400'}`}>{strengthText}</span>
                      </p>
                    )}

                    {/* Rule checklist */}
                    <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-3 space-y-1.5">
                      {ruleResults.map((r) => (
                        <div key={r.id} className={`flex items-center gap-2 text-[11px] font-semibold transition-colors ${r.passed ? 'text-emerald-400' : 'text-zinc-500'}`}>
                          {r.passed
                            ? <Check className="w-3 h-3 shrink-0 text-emerald-400" />
                            : <X    className="w-3 h-3 shrink-0 text-zinc-600" />}
                          {r.label}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* CONFIRM PASSWORD */}
              <div className="space-y-1.5">
                <label className="block text-zinc-400 text-[10px] uppercase tracking-widest font-bold ml-1">Confirmer mot de passe</label>
                <div className={`flex items-center gap-3 bg-[#030303] border rounded-xl px-4 py-3.5 transition-all ${
                  confirmPassword.length > 0
                    ? passwordsMatch
                      ? 'border-emerald-500/50'
                      : 'border-rose-500/40'
                    : 'border-white/[0.05] focus-within:border-emerald-500/50'
                } focus-within:bg-white/[0.02]`}>
                  <Lock className="w-4 h-4 text-emerald-500/70 shrink-0" />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-transparent outline-none text-sm text-zinc-100 placeholder:text-zinc-600 font-medium"
                  />
                  <button type="button" onClick={() => setShowConfirm((v) => !v)} className="text-zinc-600 hover:text-zinc-300 transition-colors shrink-0">
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  {confirmPassword.length > 0 && (
                    passwordsMatch
                      ? <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      : <X    className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                </div>
                {confirmPassword.length > 0 && !passwordsMatch && (
                  <p className="text-[10px] text-rose-400 font-semibold ml-1">Les mots de passe ne correspondent pas.</p>
                )}
              </div>

              {/* ERROR */}
              {error && (
                <div className="flex items-center gap-2 text-rose-400 bg-rose-500/10 border border-rose-500/20 px-4 py-3 rounded-xl text-xs font-bold">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shrink-0" />
                  {error}
                </div>
              )}

              {/* SUBMIT */}
              <button
                type="submit"
                disabled={isLoading || !allValid || !passwordsMatch || !username.trim()}
                className="w-full relative group/btn inline-flex h-12 items-center justify-center overflow-hidden rounded-xl bg-emerald-600 px-6 font-medium text-white transition-all hover:scale-[1.02] hover:shadow-[0_0_40px_-10px_rgba(16,185,129,0.8)] mt-6 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite]" />
                <span className="relative flex items-center justify-center gap-2 text-xs font-black tracking-widest uppercase">
                  {isLoading ? (
                    <>
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Création...
                    </>
                  ) : 'Créer mon compte'}
                </span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
