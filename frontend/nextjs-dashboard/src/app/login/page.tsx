"use client";

import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef, useCallback } from 'react';
import { ShieldAlert, Lock, User, ArrowRight, ArrowLeft, Clock, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

// Lockout paliers (mirrors backend)
function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m > 0) return `${m}m ${s.toString().padStart(2, '0')}s`;
  return `${s}s`;
}

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
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
          setError('');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const isLocked = lockoutSeconds > 0;

  // Number of tries before next lockout
  const attemptsBeforeLock = isLocked ? 0 : 3 - (failCount % 3);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked || isLoading) return;
    setError('');

    if (!username.trim() || !password.trim()) {
      setError("Veuillez saisir un nom d'utilisateur et un mot de passe.");
      return;
    }

    const doLogin = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('http://127.0.0.1:8000/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: username.trim(), password }),
        });

        if (res.ok) {
          const data = await res.json() as { access_token: string };
          if (typeof data.access_token === 'string' && data.access_token.length > 0) {
            localStorage.setItem('token', data.access_token);
            localStorage.removeItem('auth');
            router.replace('/dashboard');
            return;
          }
          setError('Erreur inattendue du serveur.');
          return;
        }

        // Parse error detail from backend
        let detail: { message?: string; fail_count?: number; seconds_remaining?: number } = {};
        try {
          const body = await res.json() as { detail: typeof detail };
          detail = body.detail ?? {};
        } catch {/* ignore */ }

        const newFail = detail.fail_count ?? failCount + 1;
        const lockSecs = detail.seconds_remaining ?? 0;

        setFailCount(newFail);

        if (res.status === 429 || lockSecs > 0) {
          startCountdown(lockSecs);
          setError(detail.message ?? `Compte bloqué. Attendez ${formatCountdown(lockSecs)}.`);
        } else {
          setError(detail.message ?? 'Identifiants incorrects.');
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
    <div className="min-h-screen bg-[#030303] text-zinc-50 flex items-center justify-center p-4 relative overflow-hidden font-sans">

      {/* BACKGROUND EFFECTS */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
        <div
          className={`absolute top-[20%] left-[20%] w-[40%] h-[40%] rounded-full blur-[150px] mix-blend-screen transition-colors duration-1000 ${isLocked ? 'bg-rose-700/25' : 'bg-violet-600/20'} animate-pulse`}
          style={{ animationDuration: isLocked ? '2s' : '8s' }}
        />
      </div>

      <div className="w-full max-w-[420px] relative z-10">

        {/* BACK BUTTON */}
        <Link href="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-6 text-xs font-bold tracking-widest uppercase group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Retour à l'accueil
        </Link>

        {/* LOGIN CARD */}
        <div className={`bg-[#0a0a0a]/80 backdrop-blur-2xl border shadow-[0_8px_32px_0_rgba(0,0,0,0.36),inset_0_1px_0_0_rgba(255,255,255,0.05)] rounded-[32px] p-8 md:p-10 relative overflow-hidden transition-all duration-500 ${isLocked ? 'border-rose-500/25' : 'border-white/[0.08]'}`}>

          <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent ${isLocked ? 'via-rose-500/60' : 'via-violet-500/30'} to-transparent rounded-t-[32px] transition-colors duration-500`} />

          {/* ICON + TITLE */}
          <div className="text-center mb-8">
            <div className={`mx-auto w-16 h-16 rounded-2xl bg-white/[0.03] border flex items-center justify-center mb-6 transition-all duration-500 ${isLocked ? 'border-rose-500/30 shadow-[0_0_30px_-5px_rgba(239,68,68,0.4)]' : 'border-white/[0.08] shadow-[0_0_30px_-5px_rgba(139,92,246,0.3)]'}`}>
              {isLocked
                ? <Lock className="w-7 h-7 text-rose-400 animate-pulse" />
                : <ShieldAlert className="w-7 h-7 text-violet-400" />
              }
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white mb-2">SOC Login</h1>
            <p className="text-sm font-medium text-zinc-500">Authentifiez-vous pour accéder au dashboard de cybersécurité.</p>
          </div>

          {/* LOCKOUT COUNTDOWN BANNER */}
          {isLocked && (
            <div className="mb-6 rounded-2xl bg-rose-950/40 border border-rose-500/30 p-4 text-center">
              <div className="flex items-center justify-center gap-2 text-rose-400 mb-3">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-xs font-black uppercase tracking-widest">Accès verrouillé</span>
              </div>
              <div className="flex items-center justify-center gap-3">
                <Clock className="w-5 h-5 text-rose-300" />
                <span className="text-3xl font-black tabular-nums text-rose-200 tracking-tight">
                  {formatCountdown(lockoutSeconds)}
                </span>
              </div>
              <p className="text-[11px] text-rose-400/70 mt-2 font-medium">
                {failCount} tentative{failCount > 1 ? 's' : ''} échouée{failCount > 1 ? 's' : ''} — réessayez après le délai
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* USERNAME */}
            <div className="space-y-1.5">
              <label className="block text-zinc-400 text-[10px] uppercase tracking-widest font-bold ml-1">Nom d'utilisateur</label>
              <div className={`flex items-center gap-3 bg-[#030303] border rounded-xl px-4 py-3.5 transition-all ${isLocked ? 'border-white/[0.03] opacity-50 cursor-not-allowed' : 'border-white/[0.05] focus-within:border-violet-500/50 focus-within:bg-white/[0.02]'}`}>
                <User className="w-4 h-4 text-violet-500/70 shrink-0" />
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="soc / admin"
                  disabled={isLocked}
                  className="w-full bg-transparent outline-none text-sm text-zinc-100 placeholder:text-zinc-600 font-medium disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div className="space-y-1.5">
              <label className="block text-zinc-400 text-[10px] uppercase tracking-widest font-bold ml-1">Mot de passe</label>
              <div className={`flex items-center gap-3 bg-[#030303] border rounded-xl px-4 py-3.5 transition-all ${isLocked ? 'border-white/[0.03] opacity-50 cursor-not-allowed' : 'border-white/[0.05] focus-within:border-violet-500/50 focus-within:bg-white/[0.02]'}`}>
                <Lock className="w-4 h-4 text-violet-500/70 shrink-0" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={isLocked}
                  className="w-full bg-transparent outline-none text-sm text-zinc-100 placeholder:text-zinc-600 font-medium disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* FAIL COUNT INDICATOR (before lockout) */}
            {!isLocked && failCount > 0 && failCount % 3 !== 0 && (
              <div className="flex items-center gap-3 bg-amber-500/[0.07] border border-amber-500/20 px-4 py-3 rounded-xl">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <div className="flex-1">
                  <p className="text-[11px] font-bold text-amber-300">
                    {failCount} tentative{failCount > 1 ? 's' : ''} échouée{failCount > 1 ? 's' : ''}
                  </p>
                  <p className="text-[10px] text-amber-500/70 mt-0.5">
                    Encore <span className="font-black text-amber-400">{attemptsBeforeLock}</span> essai{attemptsBeforeLock > 1 ? 's' : ''} avant blocage temporaire
                  </p>
                </div>
                {/* Dots */}
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full transition-colors ${i < (failCount % 3) ? 'bg-rose-500' : 'bg-white/10'}`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* ERROR (non-lockout) */}
            {error && !isLocked && (
              <div className="flex items-center gap-2 text-rose-400 bg-rose-500/10 border border-rose-500/20 px-4 py-3 rounded-xl text-xs font-bold">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shrink-0" />
                {error}
              </div>
            )}

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={isLocked || isLoading}
              className={`w-full relative group/btn inline-flex h-12 items-center justify-center overflow-hidden rounded-xl px-6 font-medium text-white transition-all mt-4 ${isLocked
                  ? 'bg-rose-900/40 border border-rose-500/20 cursor-not-allowed text-rose-400'
                  : 'bg-violet-600 hover:scale-[1.02] hover:shadow-[0_0_40px_-10px_rgba(139,92,246,0.8)]'
                } ${isLoading ? 'opacity-70 cursor-wait' : ''}`}
            >
              {!isLocked && (
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite]" />
              )}
              <span className="relative flex items-center justify-center gap-2 text-xs font-black tracking-widest uppercase">
                {isLocked ? (
                  <><Lock className="w-4 h-4" /> Bloqué — {formatCountdown(lockoutSeconds)}</>
                ) : isLoading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Vérification...
                  </>
                ) : (
                  <>Se Connecter <ArrowRight className="w-4 h-4" /></>
                )}
              </span>
            </button>

            <div className="text-center mt-6 pt-6 border-t border-white/[0.05]">
              <p className="text-xs font-semibold text-zinc-500">
                Pas encore de compte ?{' '}
                <button
                  type="button"
                  onClick={() => router.push('/register')}
                  className="text-white hover:text-violet-400 font-bold transition-colors ml-1"
                >
                  Inscrivez-vous
                </button>
              </p>
            </div>
          </form>

          {/* Demo Box */}
          <div className="mt-8 relative overflow-hidden rounded-xl bg-white/[0.02] border border-white/[0.05] p-4 text-center">
            <span className="absolute top-0 right-0 px-2 py-1 bg-white/[0.05] rounded-bl-lg text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Demo</span>
            <p className="text-xs font-bold text-zinc-300 mb-1"></p>
            <p className="text-xs text-zinc-500 font-mono"><span className="text-violet-400"></span>   <span className="text-violet-400"></span></p>
          </div>
        </div>

        {/* Lockout level legend */}
        <div className="mt-4 flex items-center justify-center gap-4 text-[10px] text-zinc-600 font-mono">
          <span></span>
          <span className="text-zinc-700">·</span>
          <span></span>
          <span className="text-zinc-700">·</span>
          <span></span>
          <span className="text-zinc-700">·</span>
          <span></span>
          <span className="text-zinc-700">·</span>
          <span></span>
        </div>
      </div>
    </div>
  );
}
