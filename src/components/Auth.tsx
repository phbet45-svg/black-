import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { motion } from "motion/react";
import { Shield, Eye, EyeOff, X, AlertCircle, Mail, Lock, User, RefreshCw, Phone, Check, MessageSquare } from "lucide-react";

interface AuthProps {
  isOpen: boolean;
  onClose: () => void;
  initialType: "login" | "register";
}

export default function Auth({ isOpen, onClose, initialType }: AuthProps) {
  const { login, register, resetPassword, selectedPlanId, plans, socials } = useApp();
  const [type, setType] = useState<"login" | "register" | "forgot">(initialType);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [waLink, setWaLink] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      if (type === "login") {
        await login(email, password);
        onClose();
      } else if (type === "register") {
        if (!name.trim()) {
          setError("O nome é obrigatório.");
          setSubmitting(false);
          return;
        }
        if (!phone.trim()) {
          setError("O telefone / WhatsApp é obrigatório para ativação do seu plano.");
          setSubmitting(false);
          return;
        }
        
        // Pass phone and selectedPlanId
        await register(email, password, name, phone, selectedPlanId || undefined);
        
        // Find selected plan details
        const chosenPlan = plans.find(p => p.id === (selectedPlanId || "basic"));
        const planName = chosenPlan ? chosenPlan.name : "Plano Básico";
        const planPrice = chosenPlan ? `R$ ${chosenPlan.price.toFixed(2)}/mês` : "R$ 39,90/mês";
        
        // WhatsApp message composition
        const storeWaLink = socials?.whatsapp || "https://wa.me/5511999999999";
        const baseUrl = storeWaLink.includes("?") ? storeWaLink.split("?")[0] : storeWaLink;
        const message = `Olá! Acabei de me cadastrar na BLACKHAT AI e gostaria de ativar meu plano.

Aqui estão os detalhes do meu cadastro:
- Nome: ${name}
- E-mail: ${email}
- Telefone: ${phone}
- Plano Escolhido: ${planName} (${planPrice})

Por favor, ative meu acesso! Obrigado.`;

        const finalWaLink = `${baseUrl}?text=${encodeURIComponent(message)}`;
        setWaLink(finalWaLink);
        
        setSuccess("Conta criada com sucesso! Conclua a ativação no WhatsApp.");
        setIsRegistered(true);
        
        // Auto-redirect if permitted by browser
        setTimeout(() => {
          try {
            window.open(finalWaLink, "_blank");
          } catch (e) {
            console.log("Popup blocked:", e);
          }
        }, 1500);
      } else {
        await resetPassword(email);
        setSuccess("E-mail de recuperação de senha enviado com sucesso!");
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/invalid-credential") {
        setError("Credenciais inválidas. Verifique seu e-mail e senha.");
      } else if (err.code === "auth/email-already-in-use") {
        setError("Este e-mail já está em uso por outra conta.");
      } else if (err.code === "auth/weak-password") {
        setError("A senha deve conter pelo menos 6 caracteres.");
      } else {
        setError(err.message || "Ocorreu um erro ao processar a solicitação.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      
      <motion.div
        initial={{ scale: 0.95, y: 15, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.95, y: 15, opacity: 0 }}
        className="w-full max-w-md overflow-hidden rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 shadow-2xl relative"
      >
        {/* Header decoration */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-red-600 via-red-500 to-zinc-950" />
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8">
          {isRegistered ? (
            <div className="flex flex-col items-center text-center gap-5">
              <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center animate-pulse">
                <Check className="w-8 h-8 text-emerald-500" />
              </div>
              <div>
                <h3 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-wider font-mono">
                  Cadastro Concluído!
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed">
                  Sua conta foi criada com sucesso! Para começar a usar, fale conosco no WhatsApp para ativação rápida do seu plano sem precisar de pagamento pelo site.
                </p>
              </div>

              {/* Info summary box */}
              <div className="w-full bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-left flex flex-col gap-2.5 font-mono text-[11px] text-zinc-700 dark:text-zinc-300">
                <div className="flex justify-between border-b border-zinc-150 dark:border-zinc-800/40 pb-1.5">
                  <span className="text-zinc-400">NOME:</span>
                  <span className="text-zinc-900 dark:text-emerald-400 font-bold uppercase">{name}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-150 dark:border-zinc-800/40 pb-1.5">
                  <span className="text-zinc-400">E-MAIL:</span>
                  <span className="text-zinc-900 dark:text-emerald-400 font-bold">{email}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-150 dark:border-zinc-800/40 pb-1.5">
                  <span className="text-zinc-400">TELEFONE:</span>
                  <span className="text-zinc-900 dark:text-emerald-400 font-bold">{phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">PLANO:</span>
                  <span className="text-emerald-400 font-extrabold uppercase bg-emerald-500/10 px-2 py-0.5 rounded text-[9px] border border-emerald-500/20">
                    {plans.find(p => p.id === selectedPlanId)?.name || "Plano Básico"}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-3 w-full mt-2">
                <a
                  href={waLink}
                  target="_blank"
                  referrerPolicy="no-referrer"
                  rel="noopener noreferrer"
                  className="w-full h-12 bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-black rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all border border-emerald-400 text-xs tracking-wider"
                >
                  <MessageSquare className="w-4 h-4 shrink-0" />
                  <span>CONCLUIR NO WHATSAPP</span>
                </a>
                <button
                  onClick={onClose}
                  className="w-full h-11 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-mono font-bold text-xs rounded-xl cursor-pointer transition-colors border border-zinc-200 dark:border-zinc-800/50"
                >
                  Fechar & Navegar
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Logo Brand */}
              <div className="flex items-center gap-2 justify-center mb-6">
                <div className="p-1.5 rounded-lg bg-red-600 text-white">
                  <Shield className="w-5 h-5 fill-white" />
                </div>
                <span className="font-black tracking-widest text-lg text-zinc-900 dark:text-white uppercase">
                  BLACK<span className="text-red-500">HAT</span> AI
                </span>
              </div>

              <h3 className="text-xl font-extrabold text-center text-zinc-900 dark:text-white mb-2">
                {type === "login" && "Acesse sua conta"}
                {type === "register" && "Crie sua conta de elite"}
                {type === "forgot" && "Recupere sua senha"}
              </h3>
              <p className="text-xs text-center text-zinc-500 dark:text-zinc-400 mb-6">
                {type === "login" && "Insira suas credenciais para acessar as ferramentas de IA"}
                {type === "register" && (selectedPlanId 
                  ? `Registrando no ${plans.find(p => p.id === selectedPlanId)?.name || "Plano Escolhido"}` 
                  : "Registre-se hoje e tenha acesso às melhores ferramentas de IA")}
                {type === "forgot" && "Informe seu e-mail registrado para receber o link de reset"}
              </p>

              {/* Validation Alert */}
              {error && (
                <div className="mb-4 p-3.5 bg-red-50 border border-red-200 dark:bg-red-950/20 dark:border-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-xs font-semibold flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-semibold flex items-start gap-2.5">
                  <Check className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
                  <span>{success}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* Name Input for Registration */}
                {type === "register" && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Nome Completo</label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Seu nome completo"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-500"
                      />
                    </div>
                  </div>
                )}

                {/* Phone Input for Registration */}
                {type === "register" && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Telefone / WhatsApp</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="(DD) 99999-9999"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-500"
                      />
                    </div>
                  </div>
                )}

                {/* Email Input */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 font-mono">E-mail</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seuemail@exemplo.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>

                {/* Password Input */}
                {type !== "forgot" && (
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 font-mono">Senha</label>
                      {type === "login" && (
                        <button
                          type="button"
                          onClick={() => setType("forgot")}
                          className="text-xs text-red-500 hover:text-red-400 font-semibold cursor-pointer"
                        >
                          Esqueceu?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Sua senha secreta"
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-11 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-red-500/10 flex items-center justify-center gap-2 mt-2 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Aguarde...</span>
                    </>
                  ) : (
                    <>
                      <span>
                        {type === "login" && "Entrar na Plataforma"}
                        {type === "register" && (selectedPlanId ? `Assinar ${plans.find(p => p.id === selectedPlanId)?.name || "Plano"}` : "Criar Conta Premium")}
                        {type === "forgot" && "Enviar Link de Reset"}
                      </span>
                    </>
                  )}
                </button>
              </form>

              {/* Bottom Switch Links */}
              <div className="border-t border-zinc-150 dark:border-zinc-850 mt-6 pt-5 text-center text-xs text-zinc-500 dark:text-zinc-400">
                {type === "login" && (
                  <span>
                    Não tem uma conta?{" "}
                    <button onClick={() => setType("register")} className="text-red-500 font-bold hover:underline cursor-pointer">
                      Cadastre-se grátis
                    </button>
                  </span>
                )}
                {type === "register" && (
                  <span>
                    Já possui uma conta?{" "}
                    <button onClick={() => setType("login")} className="text-red-500 font-bold hover:underline cursor-pointer">
                      Acesse agora
                    </button>
                  </span>
                )}
                {type === "forgot" && (
                  <button onClick={() => setType("login")} className="text-red-500 font-bold hover:underline cursor-pointer">
                    Voltar para o Login
                  </button>
                )}
              </div>

            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
