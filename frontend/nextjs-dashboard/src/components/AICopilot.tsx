"use client";

import React, { useState, useRef, useEffect } from "react";
import { Bot, X, Send, User, Sparkles, Loader2 } from "lucide-react";

export interface Alert {
  cve_id: string;
  log?: string;
  severity?: number;
  threat_score?: number;
  soc_level?: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface AICopilotProps {
  alerts: Alert[];
}

export default function AICopilot({ alerts }: AICopilotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Bonjour ! Je suis votre Copilote SOC IA. Je surveille vos métriques en temps réel. Que voulez-vous analyser aujourd'hui ?",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const generateMockResponse = (
    input: string,
    currentAlerts: Alert[],
  ): string => {
    const text = input.toLowerCase();
    const total = currentAlerts.length;
    const criticals = currentAlerts.filter(
      (a) => a.cve_id !== "ML-ANOMALY",
    ).length;
    const anomalies = currentAlerts.filter(
      (a) => a.cve_id === "ML-ANOMALY",
    ).length;

    if (
      text.includes("résumé") ||
      text.includes("resume") ||
      text.includes("statut") ||
      text.includes("combien")
    ) {
      if (total === 0)
        return "Le système est complètement stable. Aucune alerte n'a été interceptée.";
      return `À cet instant, j'analyse **${total} alertes** en cours.\nParmi elles: **${criticals} vulnérabilités CVE** et **${anomalies} anomalies ML**.`;
    }
    if (
      text.includes("pays") ||
      text.includes("origine") ||
      text.includes("source")
    ) {
      if (total === 0) return "Il n'y a pas d'attaques en cours à retracer.";
      return "Les IP offensives proviennent majoritairement de **Russie, des États-Unis et de Chine**. Consultez la **Carte Mondiale** pour visualiser.";
    }
    if (
      text.includes("cve") ||
      text.includes("critique") ||
      text.includes("menace")
    ) {
      if (criticals === 0)
        return "Bonne nouvelle, aucun exploit CVE critique n'est visible.";
      return `Attention, ${criticals} requêtes utilisent des failles connues (CVE). Appliquez les patches de sécurité.`;
    }
    if (
      text.includes("bonjour") ||
      text.includes("salut") ||
      text.includes("hello")
    ) {
      return "Bonjour ! Comment puis-je vous aider avec la posture de sécurité de votre SOC ?";
    }
    return `J'analyse actuellement *${total} enregistrements*. Posez-moi des questions sur nos anomalies (ML), le suivi des IP, ou les CVE critiques !`;
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || isTyping) return;
    const userMsg = inputValue.trim();
    setInputValue("");
    const newUserMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: userMsg,
    };
    setMessages((prev) => [...prev, newUserMsg]);
    setIsTyping(true);
    const delay = Math.floor(Math.random() * 1000) + 800;
    setTimeout(() => {
      const responseContent = generateMockResponse(userMsg, alerts);
      const newBotMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: responseContent,
      };
      setMessages((prev) => [...prev, newBotMsg]);
      setIsTyping(false);
    }, delay);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="w-[350px] sm:w-[400px] max-h-[600px] h-[500px] mb-4 bg-white border border-gray-200 shadow-xl rounded-2xl flex flex-col overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-green-500 p-4 flex items-center justify-between text-white shadow-md">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-1.5 rounded-lg">
                <Sparkles className="w-5 h-5 text-yellow-200 animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold tracking-wide leading-none text-white">
                  SOC Copilot AI
                </h3>
                <span className="text-[10px] text-green-100 flex items-center gap-1 mt-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span>
                  Agent En Ligne
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg hover:bg-white/20 transition-colors focus:outline-none"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex w-full ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`flex gap-3 max-w-[85%] ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                >
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      msg.role === "user"
                        ? "bg-green-100 text-green-600"
                        : "bg-green-600 text-white"
                    }`}
                  >
                    {msg.role === "user" ? (
                      <User className="w-4 h-4" />
                    ) : (
                      <Bot className="w-4 h-4" />
                    )}
                  </div>
                  <div
                    className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                      msg.role === "user"
                        ? "bg-green-600 text-white rounded-tr-none"
                        : "bg-white text-gray-800 border border-gray-200 rounded-tl-none"
                    }`}
                  >
                    <div
                      dangerouslySetInnerHTML={{
                        __html: msg.content
                          .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                          .replace(/\n/g, "<br/>"),
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex w-full justify-start">
                <div className="flex gap-3 max-w-[80%]">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-green-600 text-white">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="px-5 py-3.5 rounded-2xl rounded-tl-none bg-white border border-gray-200 shadow-sm flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-bounce"></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 bg-white border-t border-gray-200">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Examinez le réseau..."
                className="flex-1 bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50 placeholder:text-gray-400 transition-shadow"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isTyping}
                className="p-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                {isTyping ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center justify-center w-14 h-14 bg-green-600 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 focus:outline-none"
          aria-label="Ouvrir le Copilote IA"
        >
          <Bot className="w-6 h-6" />
          <span className="absolute flex h-3 w-3 top-0 right-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
        </button>
      )}
    </div>
  );
}
