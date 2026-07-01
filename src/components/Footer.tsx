import React from "react";
import { useApp } from "../context/AppContext";
import { Shield, Instagram, Facebook, Youtube, Linkedin, MessageSquare, Send, Phone, MessageCircle, Mail } from "lucide-react";

export default function Footer() {
  const { socials, setActiveView } = useApp();

  const handleNavClick = (view: string) => {
    setActiveView(view);
    setTimeout(() => {
      const element = document.getElementById(view);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };

  const getSocialIcon = (key: string) => {
    switch (key) {
      case "instagram": return <Instagram className="w-5 h-5" />;
      case "facebook": return <Facebook className="w-5 h-5" />;
      case "linkedin": return <Linkedin className="w-5 h-5" />;
      case "discord": return <MessageSquare className="w-5 h-5" />;
      case "telegram": return <Send className="w-5 h-5" />;
      case "whatsapp": return <MessageCircle className="w-5 h-5" />;
      default: return null;
    }
  };

  return (
    <footer className="bg-zinc-50 border-t border-zinc-200 dark:bg-black dark:border-white/5 py-12 md:py-16 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
        
        {/* Brand Information */}
        <div className="md:col-span-1 flex flex-col gap-4">
          <button 
            onClick={() => setActiveView("landing")}
            className="flex items-center gap-2 font-black tracking-widest text-lg text-zinc-900 dark:text-white uppercase text-left group"
          >
            <div className="relative w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.4)] group-hover:scale-105 transition-transform shrink-0">
              <div className="w-4 h-4 bg-black rounded-sm transform rotate-45 flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></div>
              </div>
            </div>
            <span className="font-sans font-bold tracking-tighter shrink-0">
              BackHat <span className="text-cyan-500 dark:text-cyan-400">AI</span>
            </span>
          </button>
          <p className="text-xs text-zinc-500 dark:text-slate-400 leading-relaxed">
            Plataforma de inteligência artificial de elite. Crie textos, imagens, vídeos, trilhas sonoras e códigos em segundos com a velocidade do amanhã.
          </p>
          
          {/* Dynamic Social Links */}
          <div className="flex items-center gap-3 mt-2">
            {Object.entries(socials).map(([key, url]) => {
              const icon = getSocialIcon(key);
              if (!icon || !url) return null;
              return (
                <a
                  key={key}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-zinc-100 hover:bg-cyan-50 hover:text-cyan-500 dark:bg-white/5 dark:hover:bg-cyan-500/10 dark:text-slate-400 dark:hover:text-cyan-400 transition-colors"
                  aria-label={`Siga-nos no ${key}`}
                >
                  {icon}
                </a>
              );
            })}
          </div>
        </div>

        {/* Navigation Links */}
        <div>
          <h4 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider mb-4">Plataforma</h4>
          <ul className="flex flex-col gap-2 text-xs text-zinc-500 dark:text-slate-400">
            <li>
              <button onClick={() => handleNavClick("landing")} className="hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors text-left cursor-pointer">
                Início
              </button>
            </li>
            <li>
              <button onClick={() => handleNavClick("tools-info")} className="hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors text-left cursor-pointer">
                Ferramentas de IA
              </button>
            </li>
            <li>
              <button onClick={() => handleNavClick("plans")} className="hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors text-left cursor-pointer">
                Planos de Assinatura
              </button>
            </li>
            <li>
              <button onClick={() => setActiveView("blog")} className="hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors text-left cursor-pointer">
                Blog Oficial
              </button>
            </li>
          </ul>
        </div>

        {/* Resources / Tech */}
        <div>
          <h4 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider mb-4">Tecnologia</h4>
          <ul className="flex flex-col gap-2 text-xs text-zinc-500 dark:text-slate-400">
            <li><span className="hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors">Google Gemini Suite</span></li>
            <li><span className="hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors">Stability SDXL 2.5</span></li>
            <li><span className="hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors">Suno AI Audio Engine</span></li>
            <li><span className="hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors">Runway Video Processing</span></li>
          </ul>
        </div>

        {/* Contact info / Security */}
        <div>
          <h4 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider mb-4">Segurança</h4>
          <p className="text-xs text-zinc-500 dark:text-slate-400 leading-relaxed mb-3">
            Infraestrutura blindada em nuvem, criptografia ponta a ponta AES-256 e conformidade LGPD/GDPR.
          </p>
          <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-slate-400">
            <Mail className="w-4 h-4 text-cyan-500 shrink-0" />
            <span>Ldsvctr@gmail.com</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-slate-400">
            <Shield className="w-4 h-4 text-cyan-500 shrink-0" />
            <span>Nível de Acesso: Ultra Seguro</span>
          </div>
        </div>
      </div>

      {/* Copyright area */}
      <div className="max-w-7xl mx-auto px-6 border-t border-zinc-200 dark:border-white/5 mt-12 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-[11px] text-zinc-400 dark:text-slate-500">
        <div>
          © 2026 BackHat AI. Todos os direitos reservados.
        </div>
        <div className="flex items-center gap-4">
          <span className="hover:text-cyan-500 dark:hover:text-cyan-400 cursor-pointer">Termos de Uso</span>
          <span className="hover:text-cyan-500 dark:hover:text-cyan-400 cursor-pointer">Políticas de Privacidade</span>
          <span className="hover:text-cyan-500 dark:hover:text-cyan-400 cursor-pointer">Contrato de Licenciamento de Software</span>
        </div>
      </div>
    </footer>
  );
}
