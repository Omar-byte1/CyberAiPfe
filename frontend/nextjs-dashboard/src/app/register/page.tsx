"use client";

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ShieldPlus, Lock, User, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Veuillez remplir tous les champs.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    try {
      const res = await fetch('http://127.0.0.1:8000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.detail || 'Erreur lors de l\'inscription.');
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch {
      setError('Impossible de se connecter au service d\'authentification.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl backdrop-blur-xl p-8">
        
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 text-sm font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </button>

        <div className="text-center mb-6">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white mb-3 shadow-lg">
            <ShieldPlus className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Inscription</h1>
          <p className="mt-2 text-slate-300">Créez votre compte CyberAI personnel.</p>
        </div>

        {success ? (
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-2xl text-center space-y-4">
             <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
             <h3 className="text-xl font-bold text-emerald-400">Compte créé !</h3>
             <p className="text-sm text-slate-300">Redirection vers la page de connexion...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block text-slate-300 text-xs uppercase tracking-wide font-semibold">Nom utilisateur</label>
            <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm">
              <User className="w-4 h-4 text-slate-300" />
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Votre pseudo"
                className="w-full bg-transparent outline-none text-slate-100 placeholder:text-slate-400"
              />
            </div>

            <label className="block text-slate-300 text-xs uppercase tracking-wide font-semibold">Mot de passe</label>
            <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm">
              <Lock className="w-4 h-4 text-slate-300" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="******"
                className="w-full bg-transparent outline-none text-slate-100 placeholder:text-slate-400"
              />
            </div>

            <label className="block text-slate-300 text-xs uppercase tracking-wide font-semibold">Confirmer le mot de passe</label>
            <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm">
              <Lock className="w-4 h-4 text-slate-300" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="******"
                className="w-full bg-transparent outline-none text-slate-100 placeholder:text-slate-400"
              />
            </div>

            {error && <p className="text-rose-400 text-sm font-medium">{error}</p>}

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 hover:scale-[1.01] transition mt-2"
            >
              Créer mon compte
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
