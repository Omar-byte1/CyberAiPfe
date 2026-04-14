'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Loader2 } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function ChatWidget() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user'|'bot', content: string}[]>([
    { role: 'bot', content: 'Bonjour ! Je suis l\'Assistant IA sur-mesure de votre SOC.\n\nDemandez-moi un résumé des **news** en direct de The Hacker News, ou posez-moi des questions sur nos **incidents** !' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
     if (endRef.current) endRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!input.trim() || isLoading) return;
     
     const userMsg = input.trim();
     setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
     setInput('');
     setIsLoading(true);
     
     try {
       const token = window.localStorage.getItem('token');
       const res = await fetch('http://127.0.0.1:8000/chat', {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
           ...(token ? { Authorization: `Bearer ${token}` } : {})
         },
         body: JSON.stringify({ message: userMsg })
       });
       
       if (!res.ok) throw new Error('API Error');
       const data = await res.json();
       
       setMessages(prev => [...prev, { role: 'bot', content: data.response }]);
     } catch (err) {
       setMessages(prev => [...prev, { role: 'bot', content: "❌ Erreur de connexion avec l'Assistant (Vérifiez le backend)." }]);
     } finally {
       setIsLoading(false);
     }
  };

  if (pathname === '/login') return null;

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-8 right-8 bg-indigo-600 hover:bg-indigo-700 text-white p-[18px] rounded-full shadow-[0_10px_30px_rgba(79,70,229,0.4)] transition-all duration-300 z-50 hover:scale-110 active:scale-95 ${isOpen ? 'scale-0 opacity-0 pointer-events-none' : 'scale-100 opacity-100'}`}
      >
         <MessageCircle className="w-8 h-8" />
      </button>

      <div className={`fixed bottom-8 right-8 w-full max-w-[420px] h-[650px] max-h-[85vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-[0_15px_50px_rgba(0,0,0,0.2)] dark:shadow-[0_15px_50px_rgba(0,0,0,0.6)] flex flex-col z-50 transition-all duration-300 origin-bottom-right ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}>
          
          <div className="flex items-center justify-between p-5 border-b border-indigo-700/50 bg-gradient-to-r from-indigo-700 to-indigo-500 rounded-t-3xl shadow-md z-10">
             <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2.5 rounded-2xl shadow-inner border border-white/10">
                   <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                   <h3 className="text-white font-black text-lg tracking-tight leading-tight">SOC Assistant</h3>
                   <div className="flex items-center gap-2 mt-0.5">
                      <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]"></span>
                      <span className="text-[10px] text-indigo-50 font-black uppercase tracking-widest">Qwen2.5-Coder + RAG</span>
                   </div>
                </div>
             </div>
             <button onClick={() => setIsOpen(false)} className="text-white/70 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-2.5 rounded-full backdrop-blur-sm">
                <X className="w-5 h-5" />
             </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 scroll-smooth space-y-6 bg-slate-50/50 dark:bg-slate-950/50">
             {messages.map((msg, idx) => (
                <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                   <div className={`flex gap-3 max-w-[90%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1 shadow-sm ${msg.role === 'user' ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400' : 'bg-white dark:bg-slate-800 text-indigo-500 border border-slate-200 dark:border-slate-700'}`}>
                         {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                      </div>
                      <div className={`p-4 rounded-3xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-sm shadow-md shadow-indigo-500/20' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 rounded-tl-sm shadow-sm'}`}>
                         {msg.content.split('\n').map((line, i) => (
                           <span key={i}>
                             {line}
                             <br />
                           </span>
                         ))}
                      </div>
                   </div>
                </div>
             ))}
             {isLoading && (
               <div className="flex flex-col items-start animate-in fade-in">
                   <div className="flex items-end gap-3 max-w-[85%]">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-indigo-500 flex items-center justify-center mb-1">
                         <Bot className="w-4 h-4" />
                      </div>
                      <div className="p-4 rounded-3xl rounded-tl-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 shadow-sm flex items-center gap-3">
                         <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                         <span className="text-xs font-black uppercase tracking-widest animate-pulse text-indigo-500/80">Recherche In-Progress...</span>
                      </div>
                   </div>
                </div>
             )}
             <div ref={endRef} />
          </div>

          <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 rounded-b-3xl">
             <form onSubmit={handleSend} className="relative flex items-center">
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about live news or local incidents..."
                  disabled={isLoading}
                  className="w-full bg-slate-100 dark:bg-slate-950 border-2 border-transparent dark:border-transparent focus:border-indigo-500/50 dark:focus:border-indigo-500/50 focus:bg-white dark:focus:bg-slate-900 rounded-[1.5rem] pl-5 pr-14 py-4 text-sm font-semibold text-slate-700 dark:text-slate-200 transition-all outline-none shadow-inner"
                />
                <button 
                  type="submit" 
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2.5 p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md active:scale-95"
                >
                   <Send className="w-4 h-4" />
                </button>
             </form>
          </div>
      </div>
    </>
  );
}
