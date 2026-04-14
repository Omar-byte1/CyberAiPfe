"use client";

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ShieldAlert, Lock, User, ArrowRight, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError("Veuillez saisir un nom d'utilisateur et un mot de passe.");
      return;
    }

    const login = async (): Promise<void> => {
      type TokenResponse = {
        access_token: string;
        token_type?: string;
      };

      const isTokenResponse = (value: unknown): value is TokenResponse => {
        if (typeof value !== 'object' || value === null) return false;
        const obj = value as Record<string, unknown>;
        return typeof obj.access_token === 'string' && obj.access_token.trim().length > 0;
      };

      try {
        const res = await fetch('http://127.0.0.1:8000/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: username.trim(), password }),
        });

        if (!res.ok) {
          setError('Identifiants incorrects.');
          return;
        }

        const data: unknown = await res.json();
        if (!isTokenResponse(data)) {
          setError('Erreur inattendue du serveur.');
          return;
        }

        localStorage.setItem('token', data.access_token);
        localStorage.removeItem('auth');
        router.replace('/dashboard');
      } catch {
        setError('Impossible de se connecter au service d\'authentification.');
      }
    };

    void login();
  };

  return (
    <div className="min-h-screen bg-[#030303] text-zinc-50 flex items-center justify-center p-4 relative overflow-hidden font-sans">

      {/* BACKGROUND EFFECTS */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
        <div className="absolute top-[20%] left-[20%] w-[40%] h-[40%] rounded-full bg-violet-600/20 blur-[150px] animate-pulse mix-blend-screen" style={{ animationDuration: '8s' }} />
      </div>

      <div className="w-full max-w-[400px] relative z-10">

        {/* BACK BUTTON */}
        <Link href="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-6 text-xs font-bold tracking-widest uppercase group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Retour à l'accueil
        </Link>

        {/* LOGIN CARD */}
        <div className="bg-[#0a0a0a]/80 backdrop-blur-2xl border border-white/[0.08] shadow-[0_8px_32px_0_rgba(0,0,0,0.36),inset_0_1px_0_0_rgba(255,255,255,0.05)] rounded-[32px] p-8 md:p-10 relative overflow-hidden group">

          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent rounded-t-[32px]" />

          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center mb-6 shadow-[0_0_30px_-5px_rgba(139,92,246,0.3)]">
              <ShieldAlert className="w-7 h-7 text-violet-400" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white mb-2">SOC Login</h1>
            <p className="text-sm font-medium text-zinc-500">Authentifiez-vous pour accéder au dashboard de cybersécurité.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-zinc-400 text-[10px] uppercase tracking-widest font-bold ml-1">Nom d'utilisateur</label>
              <div className="flex items-center gap-3 bg-[#030303] border border-white/[0.05] rounded-xl px-4 py-3.5 transition-all focus-within:border-violet-500/50 focus-within:bg-white/[0.02]">
                <User className="w-4 h-4 text-violet-500/70" />
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="soc / admin"
                  className="w-full bg-transparent outline-none text-sm text-zinc-100 placeholder:text-zinc-600 font-medium"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-zinc-400 text-[10px] uppercase tracking-widest font-bold ml-1">Mot de passe</label>
              <div className="flex items-center gap-3 bg-[#030303] border border-white/[0.05] rounded-xl px-4 py-3.5 transition-all focus-within:border-violet-500/50 focus-within:bg-white/[0.02]">
                <Lock className="w-4 h-4 text-violet-500/70" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-transparent outline-none text-sm text-zinc-100 placeholder:text-zinc-600 font-medium"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-rose-400 bg-rose-500/10 border border-rose-500/20 px-4 py-3 rounded-xl text-xs font-bold">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full relative group/btn inline-flex h-12 items-center justify-center overflow-hidden rounded-xl bg-violet-600 px-6 font-medium text-white transition-all hover:scale-[1.02] hover:shadow-[0_0_40px_-10px_rgba(139,92,246,0.8)] mt-4"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite]" />
              <span className="relative flex items-center justify-center gap-2 text-xs font-black tracking-widest uppercase">
                Se Connecter <ArrowRight className="w-4 h-4" />
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

          {/* Test Access Box */}
          <div className="mt-8 relative overflow-hidden rounded-xl bg-white/[0.02] border border-white/[0.05] p-4 text-center">
            <span className="absolute top-0 right-0 px-2 py-1 bg-white/[0.05] rounded-bl-lg text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Demo</span>
            <p className="text-xs font-bold text-zinc-300 mb-1"></p>
            <p className="text-xs text-zinc-500 font-mono"><span className="text-violet-400"></span>   <span className="text-violet-400"></span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
