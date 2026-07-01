import React, { useState, useEffect, useRef } from "react";
import { useApp } from "../context/AppContext";
import { 
  Shield, Cpu, Zap, Lock, Sparkles, Star, ChevronDown, 
  Send, CheckCircle, ArrowRight, Layers, HelpCircle, Mail, MessageSquare 
} from "lucide-react";

interface LandingPageProps {
  onOpenAuth: (type: "login" | "register") => void;
}

function MatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      canvas.height = canvas.parentElement?.clientHeight || 600;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const chars = "ｦｧｨｩｪｫｬｭｮｯｰｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ010110101010101";
    const charArr = chars.split("");

    const fontSize = 14;
    const columns = Math.floor(canvas.width / fontSize) + 1;
    const drops: number[] = Array(columns).fill(1);

    const draw = () => {
      ctx.fillStyle = "rgba(2, 2, 3, 0.12)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = charArr[Math.floor(Math.random() * charArr.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        if (Math.random() > 0.97) {
          ctx.fillStyle = "#ffffff";
        } else if (Math.random() > 0.7) {
          ctx.fillStyle = "#10b981";
        } else {
          ctx.fillStyle = "#064e3b";
        }

        ctx.fillText(text, x, y);

        if (y > canvas.height && Math.random() > 0.98) {
          drops[i] = 0;
        }

        drops[i]++;
      }
    };

    const interval = setInterval(draw, 33);

    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 w-full h-full pointer-events-none opacity-40 dark:opacity-60 mix-blend-screen"
    />
  );
}

export default function LandingPage({ onOpenAuth }: LandingPageProps) {
  const { plans, tools, user, setActiveView, setSelectedPlanId } = useApp();
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Contact Form State
  const [contactEmail, setContactEmail] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [contactSuccess, setContactSuccess] = useState(false);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSuccess(true);
    setContactEmail("");
    setContactName("");
    setContactMessage("");
    setTimeout(() => setContactSuccess(false), 3000);
  };

  const handleSubscribeClick = (planId?: string) => {
    if (planId) {
      setSelectedPlanId(planId);
    }
    if (user) {
      setActiveView("user-dashboard");
    } else {
      onOpenAuth("register");
    }
  };

  const faqs = [
    { q: "O que é a BackHat AI?", a: "A BackHat AI é uma suíte completa de Inteligência Artificial avançada que reúne mais de 19 ferramentas de geração de texto, código, imagens, trilhas sonoras e roteiros em um único ecossistema seguro e de alta performance." },
    { q: "Quais são as limitações de cada plano?", a: "O Plano Básico dá acesso a recursos essenciais com limites mensais (50 imagens, 20 músicas, 10 vídeos, 100 textos). O Plano Médio aumenta significativamente esses limites (200 imagens, 100 músicas, 50 vídeos, 1000 textos). Já o Plano Premium é ilimitado e conta com prioridade máxima de processamento." },
    { q: "Os pagamentos são recorrentes?", a: "Sim, os planos são assinaturas mensais recorrentes sem fidelidade, podendo ser cancelados ou alterados a qualquer momento pelo painel do usuário de forma 100% autônoma." },
    { q: "Minhas informações e prompts estão protegidos?", a: "Absolutamente. Toda a nossa infraestrutura roda sobre servidores seguros do Firebase com criptografia de ponta a ponta (AES-256) garantindo total privacidade sobre as informações." }
  ];

  return (
    <div className="flex flex-col w-full text-zinc-900 dark:text-slate-100 bg-white dark:bg-[#020203] transition-colors duration-300">
      
      {/* 1. HERO SECTION */}
      <section id="landing" className="relative pt-24 pb-16 md:pt-36 md:pb-28 overflow-hidden bg-black dark:bg-[#020203] border-b border-emerald-500/20">
        {/* Matrix Digital Rain background overlay */}
        <MatrixRain />
        
        {/* Abstract glowing decorations styled for Matrix green */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_-10%,rgba(16,185,129,0.12),transparent)] pointer-events-none" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />
        
        {/* Decorative subtle grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 text-center flex flex-col items-center gap-6 relative z-10 animate-fade-in">
          
          {/* Sparkle micro badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-emerald-950/40 text-emerald-400 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider font-mono">
            <Sparkles className="w-3.5 h-3.5 animate-spin-slow text-emerald-400" />
            <span>SYSTEM ROOT INGRESS ACTIVE</span>
          </div>

          <h1 className="text-5xl md:text-8xl font-black tracking-widest uppercase font-mono relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-green-500 to-teal-400 drop-shadow-[0_0_30px_rgba(16,185,129,0.5)] animate-pulse">
            BACKHAT AI
          </h1>

          {/* Hacker Terminal Emulator */}
          <div className="w-full max-w-xl bg-black/85 border border-emerald-500/30 rounded-xl p-5 font-mono text-[11px] md:text-xs text-left text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.15)] flex flex-col gap-2 overflow-hidden h-40 relative z-10">
            <div className="absolute top-3 right-4 flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/60 animate-ping" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            </div>
            <div className="text-emerald-500/50 text-[9px] uppercase tracking-wider border-b border-emerald-500/20 pb-1.5 mb-1 flex justify-between">
              <span>[COGNITIVE ROOT SHELL]</span>
              <span className="animate-pulse">ONLINE</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-emerald-500 font-bold">&gt;</span>
              <span className="animate-pulse">SYS_LOAD: INITIALIZING QUANTUM AI MATRIX ENG...</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-emerald-500 font-bold">&gt;</span>
              <span>ESTABLISHING DEEP-LEARNING CHANNELS... SECURE</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-emerald-500 font-bold">&gt;</span>
              <span>19+ NEURAL AGENTS LOADED [TEXT, MUSIC, IMAGE, CODE]</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-300 font-bold">
              <span className="text-emerald-500 font-bold">&gt;</span>
              <span>ACCESS GRANTED. MATRIX DECRYPTION COMPLETED.</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 mt-4 relative z-10">
            <button
              onClick={() => handleSubscribeClick()}
              className="px-8 h-12 bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-bold text-sm shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_30px_rgba(16,185,129,0.6)] inline-flex items-center gap-2 group cursor-pointer transition-all border border-emerald-400 rounded-lg"
            >
              <span>INICIAR SISTEMA</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-black" />
            </button>
            <a
              href="#plans"
              className="px-8 h-12 rounded-lg border border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-400 hover:text-emerald-300 font-mono font-bold text-sm inline-flex items-center justify-center cursor-pointer transition-all"
            >
              VER PLANOS
            </a>
          </div>

          {/* Client logs security banner */}
          <div className="flex items-center gap-6 mt-8 text-[10px] font-mono text-emerald-500/60 uppercase tracking-widest relative z-10">
            <span className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-emerald-500" /> SECURE_SSL: ACTIVE</span>
            <span className="flex items-center gap-1.5"><Zap className="w-4 h-4 text-emerald-500" /> LATENCY: ~12MS</span>
          </div>

        </div>
      </section>

      {/* 2. SOBRE SECTION */}
      <section id="about" className="py-20 bg-zinc-50 dark:bg-black/40 border-t border-b border-zinc-100 dark:border-white/5 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          
          <div className="flex flex-col gap-5">
            <span className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest font-mono">Infraestrutura Blindada</span>
            <h2 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white uppercase tracking-wider font-sans">Alta Performance Sem Compromissos</h2>
            <p className="text-xs text-zinc-500 dark:text-slate-400 leading-relaxed">
              Diferente de outras plataformas instáveis, a BackHat AI utiliza conexões de canais diretos integrados de alta velocidade para garantir respostas fluidas. Nossa plataforma é totalmente integrada aos servidores do Firebase Firestore para garantir que todo o seu histórico e preferences de prompts estejam salvos em nuvem de forma redundante.
            </p>

            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="p-4 rounded-xl bg-white dark:bg-[#0a0a0b] border border-zinc-200 dark:border-white/5 flex flex-col gap-1 shadow-sm hover:border-cyan-500/20 transition-colors">
                <Cpu className="w-5 h-5 text-cyan-500" />
                <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase font-sans mt-1">Multi-Modelos</h4>
                <p className="text-[10px] text-zinc-500 dark:text-slate-500 leading-normal">Uso combinado de IA.</p>
              </div>
              <div className="p-4 rounded-xl bg-white dark:bg-[#0a0a0b] border border-zinc-200 dark:border-white/5 flex flex-col gap-1 shadow-sm hover:border-cyan-500/20 transition-colors">
                <Lock className="w-5 h-5 text-cyan-500" />
                <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase font-sans mt-1">Segurança Total</h4>
                <p className="text-[10px] text-zinc-500 dark:text-slate-500 leading-normal">Pronto contra exploits.</p>
              </div>
            </div>
          </div>

          <div className="relative aspect-video bg-[#0a0a0b] rounded-3xl overflow-hidden border border-zinc-200 dark:border-white/5 shadow-xl flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.08),transparent_70%)]" />
            <div className="relative z-10 text-center flex flex-col items-center gap-2 font-mono text-[10px] text-cyan-400">
              <Layers className="w-12 h-12 text-cyan-500 animate-pulse mb-2" />
              <span>[SECURE NODE INGRESS: GRANTED]</span>
              <span className="text-slate-500">BACKHAT AI COGNITIVE AGENT ACTIVATED</span>
            </div>
          </div>

        </div>
      </section>

      {/* 3. FERRAMENTAS LIST INFO */}
      <section id="tools-info" className="py-20">
        <div className="max-w-7xl mx-auto px-6 flex flex-col gap-12">
          
          <div className="text-center flex flex-col items-center gap-3">
            <span className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest font-mono">Produtividade Máxima</span>
            <h2 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white uppercase tracking-wider font-sans">Mais de 19 Modelos Especializados</h2>
            <p className="text-xs text-zinc-500 dark:text-slate-400 max-w-xl">
              Nossas ferramentas estão divididas em categorias estratégicas para facilitar seu fluxo de trabalho e criação de criativos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tools.slice(0, 6).map((t) => (
              <div 
                key={t.id}
                className="p-6 rounded-2xl bg-white dark:bg-[#0a0a0b] border border-zinc-150 dark:border-white/5 hover:border-cyan-500/30 hover:shadow-[0_0_20px_rgba(6,182,212,0.05)] transition-all"
              >
                <div className="p-2 bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-400 rounded-lg self-start inline-block mb-4">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-extrabold text-zinc-900 dark:text-white uppercase tracking-wider font-sans">{t.name}</h4>
                <p className="text-[11px] text-zinc-500 dark:text-slate-400 leading-relaxed mt-2">{t.description}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 4. PLANOS E PREÇOS */}
      <section id="plans" className="py-20 bg-zinc-50 dark:bg-black/40 border-t border-zinc-100 dark:border-white/5 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 flex flex-col gap-12">
          
          <div className="text-center flex flex-col items-center gap-3">
            <span className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest font-mono">Tabela de Planos</span>
            <h2 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white uppercase tracking-wider font-sans">Planos Sob Medida</h2>
            <p className="text-xs text-zinc-500 dark:text-slate-400 max-w-xl">
              Escolha o plano ideal para suas demandas. Faça upgrade ou cancele a qualquer momento no painel de assinaturas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {plans.map((p) => (
              <div 
                key={p.id}
                className={`p-8 rounded-3xl bg-white dark:bg-[#0a0a0b] border flex flex-col gap-6 relative transition-all ${
                  p.id === "medium" 
                    ? "border-cyan-500 dark:border-cyan-500/50 shadow-xl shadow-cyan-500/5 dark:bg-gradient-to-b dark:from-[#0e1719] dark:to-[#0a0a0b] md:scale-105 z-10" 
                    : "border-zinc-200 dark:border-white/5 hover:border-zinc-300 dark:hover:border-white/10"
                }`}
              >
                {p.id === "medium" && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-cyan-500 text-black text-[8px] font-bold px-3 py-1 rounded-full uppercase tracking-widest font-mono shadow">
                    Mais Vendido
                  </span>
                )}

                <div>
                  <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-wider font-mono">{p.name}</h3>
                  <span className="text-3xl font-black text-zinc-900 dark:text-white font-mono mt-2 block">R$ {p.price.toFixed(2)}<span className="text-xs text-zinc-500 dark:text-slate-500 font-normal">/mês</span></span>
                  <p className="text-xs text-zinc-500 dark:text-slate-400 mt-2 leading-relaxed">{p.description}</p>
                </div>

                <ul className="flex flex-col gap-3 text-xs text-zinc-600 dark:text-slate-400 font-mono mt-2 flex-1 border-t border-zinc-100 dark:border-white/5 pt-5">
                  {p.features.map((f, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-cyan-500 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSubscribeClick(p.id)}
                  className={`w-full h-11 text-xs font-bold rounded-xl cursor-pointer transition-colors ${
                    p.id === "medium" 
                      ? "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg" 
                      : "bg-zinc-950 hover:bg-zinc-900 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950"
                  }`}
                >
                  Assinar {p.name}
                </button>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 5. FAQ SECTION */}
      <section id="faq" className="py-20">
        <div className="max-w-4xl mx-auto px-6 flex flex-col gap-12">
          
          <div className="text-center flex flex-col items-center gap-3">
            <span className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest font-mono">Perguntas Frequentes</span>
            <h2 className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-wider font-sans">Dúvidas Resolvidas</h2>
          </div>

          <div className="flex flex-col gap-4">
            {faqs.map((f, index) => (
              <div 
                key={index}
                className="rounded-2xl border border-zinc-200 dark:border-white/5 overflow-hidden"
              >
                <button
                  onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                  className="w-full flex items-center justify-between p-5 text-left font-bold text-zinc-900 dark:text-white text-xs md:text-sm font-sans uppercase tracking-wider bg-zinc-50/50 hover:bg-zinc-100/50 dark:bg-[#0a0a0b] dark:hover:bg-[#111112] cursor-pointer"
                >
                  <span className="flex items-center gap-2.5">
                    <HelpCircle className="w-4 h-4 text-cyan-500 shrink-0" />
                    {f.q}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${activeFaq === index ? "rotate-180" : ""}`} />
                </button>
                {activeFaq === index && (
                  <div className="p-5 text-xs text-zinc-500 dark:text-slate-400 bg-white dark:bg-black leading-relaxed border-t border-zinc-200 dark:border-white/5">
                    {f.a}
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 6. CONTACT SECTION */}
      <section id="contact" className="py-20 bg-zinc-50 dark:bg-black/40 border-t border-b border-zinc-100 dark:border-white/5 transition-colors duration-300">
        <div className="max-w-xl mx-auto px-6 flex flex-col gap-8">
          
          <div className="text-center flex flex-col items-center gap-3">
            <span className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest font-mono">Fale Conosco</span>
            <h2 className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-wider font-sans">Canal de Atendimento</h2>
            <p className="text-xs text-zinc-500 dark:text-slate-400">Entre em contato para fechar parcerias corporativas ou tirar dúvidas de suporte pré-vendas.</p>
          </div>

          {contactSuccess && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-semibold flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span>Sua mensagem de contato foi enviada com sucesso!</span>
            </div>
          )}

          <form onSubmit={handleContactSubmit} className="flex flex-col gap-4 text-xs font-sans">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-zinc-700 dark:text-slate-300">Seu Nome</label>
                <input
                  type="text"
                  required
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-250 dark:border-white/10 bg-transparent text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-zinc-700 dark:text-slate-300">E-mail de Contato</label>
                <input
                  type="email"
                  required
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-250 dark:border-white/10 bg-transparent text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-zinc-700 dark:text-slate-300">Sua Mensagem</label>
              <textarea
                required
                rows={4}
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-zinc-250 dark:border-white/10 bg-transparent text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 resize-none transition-all"
              />
            </div>

            <button
              type="submit"
              className="w-full h-11 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl font-bold text-xs shadow-[0_0_15px_rgba(6,182,212,0.2)] cursor-pointer flex items-center justify-center gap-1.5 transition-all"
            >
              <Send className="w-4 h-4" /> Enviar Mensagem de Elite
            </button>
          </form>

        </div>
      </section>

    </div>
  );
}
