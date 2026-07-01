import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { collection, addDoc, query, where, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { deleteUser } from "firebase/auth";
import { db, auth, handleFirestoreError, OperationType } from "../firebase";
import { Payment, SupportTicket } from "../types";
import { 
  User, Shield, CreditCard, Settings, LifeBuoy, AlertCircle, 
  CheckCircle, RefreshCw, Send, Plus, Calendar, Trash2, Key
} from "lucide-react";

export default function UserPanel() {
  const { profile, user, logout, plans, addSystemLog, toggleTheme, theme } = useApp();
  const [activeTab, setActiveTab] = useState<"dashboard" | "profile" | "billing" | "settings" | "support">("dashboard");

  // Profile Form States
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Billing & Subscriptions States
  const [payments, setPayments] = useState<Payment[]>([]);
  const [checkoutPlan, setCheckoutPlan] = useState<any>(null);
  const [billingSuccess, setBillingSuccess] = useState(false);

  // Settings states
  const [language, setLanguage] = useState("pt");
  const [emailNotify, setEmailNotify] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);

  // Support states
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [newSubject, setNewSubject] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [ticketSuccess, setTicketSuccess] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyMessage, setReplyMessage] = useState("");

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || "");
      setPhone(profile.phone || "");
      setCompany(profile.company || "");
    }
  }, [profile]);

  // Load user payments and support tickets in real-time
  useEffect(() => {
    if (!user) return;

    // 1. Load payments
    const paymentsQuery = query(collection(db, "payments"), where("userId", "==", user.uid));
    const unsubscribePayments = onSnapshot(paymentsQuery, (snapshot) => {
      const payList: Payment[] = [];
      snapshot.forEach((docSnap) => {
        payList.push({ id: docSnap.id, ...docSnap.data() } as Payment);
      });
      setPayments(payList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, "payments");
    });

    // 2. Load support tickets
    const supportQuery = query(collection(db, "support"), where("userId", "==", user.uid));
    const unsubscribeSupport = onSnapshot(supportQuery, (snapshot) => {
      const tickList: SupportTicket[] = [];
      snapshot.forEach((docSnap) => {
        tickList.push({ id: docSnap.id, ...docSnap.data() } as SupportTicket);
      });
      setTickets(tickList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, "support");
    });

    return () => {
      unsubscribePayments();
      unsubscribeSupport();
    };
  }, [user]);

  // Save profile changes
  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        displayName,
        phone,
        company
      });
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
      await addSystemLog("UPDATE_PROFILE", "Perfil alterado por usuário.");
    } catch (err) {
      console.error(err);
    }
  };

  // Process Mock Checkout (Stripe style)
  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !checkoutPlan || !profile) return;

    try {
      // 1. Create payment register
      const paymentData: Omit<Payment, "id"> = {
        userId: user.uid,
        userEmail: user.email || "",
        planId: checkoutPlan.id,
        amount: checkoutPlan.price,
        status: "completed",
        date: new Date().toISOString(),
        paymentMethod: "Stripe • Cartão"
      };

      await addDoc(collection(db, "payments"), paymentData);

      // 2. Upgrade user plan limits
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        planId: checkoutPlan.id,
        credits: checkoutPlan.id === "premium" ? 99999 : checkoutPlan.id === "medium" ? 1000 : 100,
        monthlyLimit: checkoutPlan.id === "premium" ? 99999 : checkoutPlan.id === "medium" ? 1000 : 100,
        storageLimitGB: checkoutPlan.id === "premium" ? 100 : checkoutPlan.id === "medium" ? 20 : 1
      });

      setCheckoutPlan(null);
      setBillingSuccess(true);
      setTimeout(() => setBillingSuccess(false), 4000);
      await addSystemLog("UPGRADE_PLAN", `Upgrade de assinatura para o plano: ${checkoutPlan.name}`);
    } catch (err) {
      console.error(err);
    }
  };

  // Submit support ticket
  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newSubject.trim() || !newMessage.trim()) return;

    try {
      const ticketData: Omit<SupportTicket, "id"> = {
        userId: user.uid,
        userEmail: user.email || "",
        subject: newSubject,
        message: newMessage,
        status: "open",
        createdAt: new Date().toISOString(),
        replies: []
      };

      await addDoc(collection(db, "support"), ticketData);
      setNewSubject("");
      setNewMessage("");
      setTicketSuccess(true);
      setTimeout(() => setTicketSuccess(false), 3000);
      await addSystemLog("SUPPORT_TICKET_CREATED", "Ticket de suporte criado.");
    } catch (err) {
      console.error(err);
    }
  };

  // Submit reply on ticket
  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyMessage.trim()) return;

    try {
      const ticketRef = doc(db, "support", selectedTicket.id);
      const updatedReplies = [
        ...(selectedTicket.replies || []),
        {
          id: Math.random().toString(36).substring(2, 9),
          sender: "user" as const,
          message: replyMessage,
          createdAt: new Date().toISOString()
        }
      ];

      await updateDoc(ticketRef, {
        replies: updatedReplies
      });

      // Update state
      setSelectedTicket({
        ...selectedTicket,
        replies: updatedReplies
      });
      setReplyMessage("");
    } catch (err) {
      console.error(err);
    }
  };

  // Delete account completely
  const handleDeleteAccount = async () => {
    const confirm = window.confirm("ATENÇÃO: Tem certeza absoluta que deseja excluir permanentemente sua conta BackHat AI? Todos os seus dados serão deletados e essa ação não poderá ser desfeita!");
    if (!confirm || !user) return;

    try {
      await addSystemLog("DELETE_ACCOUNT", `Usuário deletou conta: ${user.email}`);
      // Delete doc in firestore
      await deleteDoc(doc(db, "users", user.uid));
      // Delete user in Auth
      const currentUser = auth.currentUser;
      if (currentUser) {
        await deleteUser(currentUser);
      }
      logout();
    } catch (err: any) {
      alert(`Erro ao excluir conta: ${err.message || "Por favor, faça login novamente para excluir a conta por segurança."}`);
    }
  };

  const currentPlanDetails = plans.find(p => p.id === profile?.planId);

  return (
    <div className="mx-auto max-w-7xl px-6 py-8 grid grid-cols-1 lg:grid-cols-4 gap-8 animate-fade-in font-sans">
      
      {/* Tab Selector Nav */}
      <div className="lg:col-span-1 flex flex-col gap-4">
        <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-[#0a0a0b] border border-zinc-200 dark:border-white/5">
          
          <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-zinc-150 dark:border-white/5">
            <div className="w-10 h-10 rounded-full bg-cyan-500/10 text-cyan-400 font-bold flex items-center justify-center border border-cyan-500/20 font-mono">
              {profile?.displayName?.substring(0, 2).toUpperCase() || "US"}
            </div>
            <div>
              <h4 className="text-xs font-extrabold text-zinc-900 dark:text-white uppercase truncate font-mono max-w-[150px]">{profile?.displayName || "Membro Ativo"}</h4>
              <span className="text-[10px] text-zinc-500 font-bold uppercase font-mono tracking-wider bg-cyan-50 text-cyan-600 dark:bg-cyan-950/20 dark:text-cyan-400 px-2 py-0.5 rounded">
                Plano {profile?.planId || "Básico"}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={() => { setActiveTab("dashboard"); setSelectedTicket(null); }}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 cursor-pointer ${
                activeTab === "dashboard" ? "bg-cyan-500 text-black font-bold" : "hover:bg-zinc-150 dark:hover:bg-white/5 text-zinc-600 dark:text-slate-400"
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Painel Geral</span>
            </button>
            <button
              onClick={() => { setActiveTab("profile"); setSelectedTicket(null); }}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 cursor-pointer ${
                activeTab === "profile" ? "bg-cyan-500 text-black font-bold" : "hover:bg-zinc-150 dark:hover:bg-white/5 text-zinc-600 dark:text-slate-400"
              }`}
            >
              <User className="w-4 h-4" />
              <span>Meu Perfil</span>
            </button>
            <button
              onClick={() => { setActiveTab("billing"); setSelectedTicket(null); }}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 cursor-pointer ${
                activeTab === "billing" ? "bg-cyan-500 text-black font-bold" : "hover:bg-zinc-150 dark:hover:bg-white/5 text-zinc-600 dark:text-slate-400"
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Assinatura & Faturamento</span>
            </button>
            <button
              onClick={() => { setActiveTab("settings"); setSelectedTicket(null); }}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 cursor-pointer ${
                activeTab === "settings" ? "bg-cyan-500 text-black font-bold" : "hover:bg-zinc-150 dark:hover:bg-white/5 text-zinc-600 dark:text-slate-400"
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Configurações</span>
            </button>
            <button
              onClick={() => { setActiveTab("support"); setSelectedTicket(null); }}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 cursor-pointer ${
                activeTab === "support" ? "bg-cyan-500 text-black font-bold" : "hover:bg-zinc-150 dark:hover:bg-white/5 text-zinc-600 dark:text-slate-400"
              }`}
            >
              <LifeBuoy className="w-4 h-4" />
              <span>Central de Suporte</span>
            </button>
          </div>

        </div>
      </div>

      {/* Main Panel Content Box */}
      <div className="lg:col-span-3 flex flex-col gap-6">

        {/* PROFILE TAB */}
        {activeTab === "profile" && (
          <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-[#0a0a0b] border border-zinc-200 dark:border-white/5 shadow-xl shadow-cyan-500/5 animate-fade-in flex flex-col gap-6">
            <div>
              <h3 className="text-lg font-black text-zinc-900 dark:text-white uppercase tracking-wider font-mono">Gerenciamento de Perfil</h3>
              <p className="text-xs text-zinc-500 dark:text-slate-400 mt-0.5">Altere seus dados cadastrais e as informações da sua empresa.</p>
            </div>

            {profileSuccess && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-semibold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span>Dados de perfil atualizados com sucesso!</span>
              </div>
            )}

            <form onSubmit={handleProfileSave} className="flex flex-col gap-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-zinc-700 dark:text-slate-300">Seu Nome de Exibição</label>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-transparent text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-zinc-700 dark:text-slate-300">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ex: (11) 99999-9999"
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-transparent text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-zinc-700 dark:text-slate-300">Nome da Empresa</label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Ex: Minha Empresa LTDA"
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-transparent text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-zinc-400 dark:text-zinc-500">E-mail Cadastrado (Não Editável)</label>
                  <input
                    type="text"
                    disabled
                    value={profile?.email || ""}
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-black/60 text-sm text-zinc-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="self-start h-10 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold px-6 rounded-xl shadow-md cursor-pointer transition-colors"
              >
                Salvar Alterações
              </button>
            </form>

            {/* Danger Area */}
            <div className="border-t border-zinc-200 dark:border-white/5 pt-6 mt-4">
              <h4 className="text-sm font-bold text-cyan-400 uppercase tracking-wider mb-2 font-mono">Zona de Perigo</h4>
              <p className="text-xs text-zinc-500 dark:text-slate-400 mb-4">A exclusão da conta apaga todos os seus dados pessoais, créditos e relatórios no sistema Firebase de forma irreversível.</p>
              <button
                onClick={handleDeleteAccount}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-red-500 hover:bg-red-500/10 border border-red-500/20 hover:border-red-500 dark:hover:bg-red-500/10 px-4 py-2.5 rounded-xl cursor-pointer transition-colors"
              >
                <Trash2 className="w-4 h-4" /> Excluir Minha Conta Permanentemente
              </button>
            </div>
          </div>
        )}

        {/* DASHBOARD TAB */}
        {activeTab === "dashboard" && (
          <div className="flex flex-col gap-6 animate-fade-in">
            {/* Header dashboard info */}
            <div className="p-6 md:p-8 rounded-3xl bg-zinc-50 dark:bg-[#0a0a0b] border border-zinc-200 dark:border-white/5 shadow-xl shadow-cyan-500/5">
              <span className="text-[10px] font-bold text-cyan-400 font-mono uppercase tracking-widest bg-cyan-500/10 dark:bg-cyan-950/40 px-2.5 py-1 rounded">Métrica de Elite</span>
              <h2 className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-wider font-mono mt-3">Sua Assinatura Atual</h2>
              <p className="text-xs text-zinc-500 dark:text-slate-400 mt-1 max-w-xl">
                Você é membro do <strong>{currentPlanDetails?.name || "Plano Básico"}</strong>. Seu ciclo de cobrança e uso de limites renova automaticamente a cada 30 dias.
              </p>
            </div>

            {/* Limits visual panels */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Text, image, music, storage limits meters */}
              <div className="p-6 rounded-2xl bg-white dark:bg-[#0a0a0b] border border-zinc-200 dark:border-white/5 flex flex-col gap-5 shadow-xl shadow-cyan-500/5">
                <h3 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider font-mono border-b border-zinc-150 dark:border-white/5 pb-3">Recursos Consumidos</h3>
                
                {/* Text limits */}
                <div>
                  <div className="flex justify-between text-xs font-mono mb-1.5">
                    <span className="text-zinc-500">Textos Gerados:</span>
                    <span className="text-zinc-900 dark:text-white font-bold">{profile?.textCount || 0} / {currentPlanDetails?.textLimit === 99999 ? 'Ilimitado' : currentPlanDetails?.textLimit}</span>
                  </div>
                  <div className="w-full bg-zinc-100 dark:bg-zinc-900 h-2 rounded-full overflow-hidden">
                    <div className="bg-cyan-500 h-full" style={{ width: `${Math.min(((profile?.textCount || 0) / (currentPlanDetails?.textLimit || 1)) * 100, 100)}%` }} />
                  </div>
                </div>

                {/* Image limits */}
                <div>
                  <div className="flex justify-between text-xs font-mono mb-1.5">
                    <span className="text-zinc-500">Imagens Criadas:</span>
                    <span className="text-zinc-900 dark:text-white font-bold">{profile?.imageCount || 0} / {currentPlanDetails?.imageLimit === 99999 ? 'Ilimitado' : currentPlanDetails?.imageLimit}</span>
                  </div>
                  <div className="w-full bg-zinc-100 dark:bg-zinc-900 h-2 rounded-full overflow-hidden">
                    <div className="bg-cyan-500 h-full" style={{ width: `${Math.min(((profile?.imageCount || 0) / (currentPlanDetails?.imageLimit || 1)) * 100, 100)}%` }} />
                  </div>
                </div>

                {/* Music limits */}
                <div>
                  <div className="flex justify-between text-xs font-mono mb-1.5">
                    <span className="text-zinc-500">Sinfonias Sintetizadas:</span>
                    <span className="text-zinc-900 dark:text-white font-bold">{profile?.musicCount || 0} / {currentPlanDetails?.musicLimit === 99999 ? 'Ilimitado' : currentPlanDetails?.musicLimit}</span>
                  </div>
                  <div className="w-full bg-zinc-100 dark:bg-zinc-900 h-2 rounded-full overflow-hidden">
                    <div className="bg-cyan-500 h-full" style={{ width: `${Math.min(((profile?.musicCount || 0) / (currentPlanDetails?.musicLimit || 1)) * 100, 100)}%` }} />
                  </div>
                </div>

              </div>

              {/* Subscriptions quick actions */}
              <div className="p-6 rounded-2xl bg-white dark:bg-[#0a0a0b] border border-zinc-200 dark:border-white/5 flex flex-col gap-4 shadow-xl shadow-cyan-500/5">
                <h3 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider font-mono border-b border-zinc-150 dark:border-white/5 pb-3">Detalhes de Cobrança</h3>
                <div className="flex flex-col gap-3 font-mono text-xs text-zinc-600 dark:text-slate-400">
                  <div className="flex justify-between">
                    <span>Valor Assinatura:</span>
                    <strong className="text-zinc-900 dark:text-white">R$ {currentPlanDetails?.price.toFixed(2)}/mês</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Meio de Pagamento:</span>
                    <span className="text-zinc-900 dark:text-white">Cartão de Crédito final 4321</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Próxima Renovação:</span>
                    <span className="text-zinc-900 dark:text-white">01 de Agosto de 2026</span>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab("billing")}
                  className="w-full h-10 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold rounded-xl mt-2 cursor-pointer transition-colors"
                >
                  Alterar Plano de Cobrança
                </button>
              </div>

            </div>
          </div>
        )}

        {/* BILLING AND SUBSCRIPTIONS TAB */}
        {activeTab === "billing" && (
          <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-[#0a0a0b] border border-zinc-200 dark:border-white/5 shadow-xl shadow-cyan-500/5 animate-fade-in flex flex-col gap-6">
            <div>
              <h3 className="text-lg font-black text-zinc-900 dark:text-white uppercase tracking-wider font-mono">Assinaturas e Faturamento</h3>
              <p className="text-xs text-zinc-500 dark:text-slate-400 mt-0.5">Faça upgrade da sua assinatura, confira limites extras ou acesse o histórico de pagamentos.</p>
            </div>

            {billingSuccess && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-semibold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span>Assinatura contratada com sucesso! Seus limites foram redefinidos.</span>
              </div>
            )}

            {/* Subscriptions Plans grid editor */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((p) => (
                <div 
                  key={p.id}
                  className={`p-5 rounded-2xl border flex flex-col gap-4 relative transition-all ${
                    profile?.planId === p.id 
                      ? "border-cyan-500 bg-cyan-500/5 dark:bg-cyan-950/10 shadow-[0_0_20px_rgba(6,182,212,0.1)]" 
                      : "border-zinc-200 dark:border-white/5 hover:border-cyan-500/20"
                  }`}
                >
                  {profile?.planId === p.id && (
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-[8px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono">
                      Plano Ativo
                    </span>
                  )}

                  <div>
                    <h4 className="text-xs font-extrabold text-zinc-900 dark:text-white uppercase tracking-wider font-mono">{p.name}</h4>
                    <span className="text-lg font-black text-zinc-900 dark:text-white font-mono mt-1 block">R$ {p.price.toFixed(2)}<span className="text-[10px] text-zinc-500 font-normal">/mês</span></span>
                    <p className="text-[10px] text-zinc-500 dark:text-slate-400 leading-relaxed mt-1">{p.description}</p>
                  </div>

                  <ul className="flex flex-col gap-1.5 text-[10px] text-zinc-600 dark:text-slate-400 font-mono mt-2 flex-1">
                    {p.features.slice(0, 4).map((f, idx) => (
                      <li key={idx} className="flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span className="truncate">{f}</span>
                      </li>
                    ))}
                  </ul>

                  {profile?.planId !== p.id && (
                    <button
                      onClick={() => setCheckoutPlan(p)}
                      className="w-full h-9 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors"
                    >
                      Assinar Plano
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Mock Checkout Modal overlay */}
            {checkoutPlan && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                <div className="bg-white dark:bg-[#0a0a0b] border border-zinc-200 dark:border-white/10 p-6 md:p-8 rounded-2xl max-w-sm w-full flex flex-col gap-5 relative shadow-2xl">
                  <div>
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider font-mono">Efetuar Assinatura</h4>
                    <p className="text-xs text-zinc-500 mt-1">Plano selecionado: <strong>{checkoutPlan.name}</strong> • R$ {checkoutPlan.price.toFixed(2)}/mês</p>
                  </div>

                  <form onSubmit={handleCheckoutSubmit} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-zinc-700 dark:text-slate-300">Número do Cartão de Crédito</label>
                      <input
                        type="text"
                        required
                        placeholder="4321 • 4321 • 4321 • 4321"
                        className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-white/10 bg-transparent text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-zinc-700 dark:text-slate-300 font-mono">Validade</label>
                        <input
                          type="text"
                          required
                          placeholder="12 / 29"
                          className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-white/10 bg-transparent text-xs text-center text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-zinc-700 dark:text-slate-300 font-mono">CVV</label>
                        <input
                          type="text"
                          required
                          placeholder="123"
                          className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-white/10 bg-transparent text-xs text-center text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2.5 mt-3">
                      <button
                        type="button"
                        onClick={() => setCheckoutPlan(null)}
                        className="flex-1 h-9 bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-slate-300 text-xs font-bold rounded-lg cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="flex-1 h-9 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors"
                      >
                        Confirmar Pagamento
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Payment history collection logger table */}
            <div className="border-t border-zinc-200 dark:border-white/5 pt-6 mt-4">
              <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider mb-4 font-mono">Histórico de Cobranças</h4>
              {payments.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs font-mono">
                    <thead>
                      <tr className="border-b border-zinc-150 dark:border-zinc-850 pb-2 text-zinc-500 uppercase tracking-widest text-[9px]">
                        <th className="py-2.5">Data</th>
                        <th className="py-2.5">Plano</th>
                        <th className="py-2.5">Meio</th>
                        <th className="py-2.5">Valor</th>
                        <th className="py-2.5 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900 text-zinc-600 dark:text-zinc-300">
                      {payments.map((p) => (
                        <tr key={p.id}>
                          <td className="py-3">{new Date(p.date).toLocaleDateString("pt-BR")}</td>
                          <td className="py-3 uppercase">{p.planId}</td>
                          <td className="py-3">{p.paymentMethod}</td>
                          <td className="py-3">R$ {p.amount.toFixed(2)}</td>
                          <td className="py-3 text-right">
                            <span className="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 px-2 py-0.5 rounded font-bold uppercase text-[9px]">
                              {p.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono italic">Nenhum pagamento registrado ainda.</p>
              )}
            </div>

          </div>
        )}

        {/* CONFIGURATIONS TAB */}
        {activeTab === "settings" && (
          <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-[#0a0a0b] border border-zinc-200 dark:border-white/5 shadow-xl shadow-cyan-500/5 animate-fade-in flex flex-col gap-6">
            <div>
              <h3 className="text-lg font-black text-zinc-900 dark:text-white uppercase tracking-wider font-mono">Configurações Gerais</h3>
              <p className="text-xs text-zinc-500 dark:text-slate-400 mt-0.5">Defina suas preferências de idioma, notificações de segurança e chaves de API.</p>
            </div>

            <div className="flex flex-col gap-5 text-xs font-mono text-zinc-600 dark:text-slate-300">
              {/* Language selection */}
              <div className="flex justify-between items-center py-3 border-b border-zinc-100 dark:border-white/5">
                <div>
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-white">Idioma Preferencial</h4>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Traduz as ferramentas de IA.</p>
                </div>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-white/10 bg-transparent text-xs text-zinc-900 dark:text-white focus:outline-none"
                >
                  <option value="pt" className="dark:bg-[#0a0a0b]">Português (BR)</option>
                  <option value="en" className="dark:bg-[#0a0a0b]">English (US)</option>
                  <option value="es" className="dark:bg-[#0a0a0b]">Español</option>
                </select>
              </div>

              {/* Theme toggle sync */}
              <div className="flex justify-between items-center py-3 border-b border-zinc-100 dark:border-white/5">
                <div>
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-white">Tema Visual da Interface</h4>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Alterna entre modos claro e escuro.</p>
                </div>
                <button
                  onClick={toggleTheme}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-lg text-[10px] font-bold cursor-pointer transition-all shadow shadow-cyan-500/10"
                >
                  {theme === "dark" ? "Ativar Modo Claro" : "Ativar Modo Escuro"}
                </button>
              </div>

              {/* Email notification */}
              <div className="flex justify-between items-center py-3 border-b border-zinc-100 dark:border-white/5">
                <div>
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-white">Notificações por E-mail</h4>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Receba alertas de consumo de créditos e limites.</p>
                </div>
                <input
                  type="checkbox"
                  checked={emailNotify}
                  onChange={() => setEmailNotify(!emailNotify)}
                  className="w-4 h-4 cursor-pointer accent-cyan-500"
                />
              </div>

              {/* API keys sandbox sandbox */}
              <div className="pt-4">
                <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-cyan-400" /> Sandbox Chave de API
                </h4>
                <p className="text-[10px] text-zinc-500 leading-relaxed mb-3">Sua credencial exclusiva para integrações externas e webhooks.</p>
                <div className="p-3 bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/5 rounded-xl flex items-center justify-between">
                  <code className="text-[10px] text-cyan-400">backhat_key_live_2894c8b9d311...</code>
                  <button className="text-[10px] font-bold text-cyan-400 hover:underline cursor-pointer">Copiar</button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* SUPPORT TICKETS TAB */}
        {activeTab === "support" && (
          <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-[#0a0a0b] border border-zinc-200 dark:border-white/5 shadow-xl shadow-cyan-500/5 animate-fade-in flex flex-col gap-6">
            
            {selectedTicket ? (
              /* Ticket detail conversation screen */
              <div className="flex flex-col gap-5">
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="self-start text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white uppercase flex items-center gap-1 cursor-pointer"
                >
                  ← Voltar aos Chamados
                </button>

                <div className="p-4 bg-zinc-50 dark:bg-[#0a0a0b] border border-zinc-150 dark:border-white/5 rounded-xl">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-white font-mono">{selectedTicket.subject}</h4>
                    <span className="text-[9px] bg-cyan-100 text-cyan-600 dark:bg-cyan-950/30 dark:text-cyan-400 font-bold px-2 py-0.5 rounded uppercase font-mono">
                      {selectedTicket.status}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-slate-300 font-sans mt-2">{selectedTicket.message}</p>
                </div>

                {/* Replies List */}
                <div className="flex flex-col gap-4">
                  <h5 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono">Mensagens de Suporte</h5>
                  {selectedTicket.replies && selectedTicket.replies.length > 0 ? (
                    selectedTicket.replies.map((reply) => (
                      <div 
                        key={reply.id}
                        className={`p-4 rounded-xl border max-w-md text-xs font-sans ${
                          reply.sender === "admin" 
                            ? "bg-cyan-500/10 border-cyan-500/10 self-start text-cyan-800 dark:text-cyan-300" 
                            : "bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-white/5 self-end"
                        }`}
                      >
                        <div className="flex justify-between text-[9px] text-zinc-500 font-mono mb-1 gap-4">
                          <strong>{reply.sender === "admin" ? "Suporte Técnico BackHat" : "Você"}</strong>
                          <span>{new Date(reply.createdAt).toLocaleDateString("pt-BR")}</span>
                        </div>
                        <p className="leading-relaxed">{reply.message}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono italic">Nenhuma resposta do suporte técnico ainda. Nosso prazo de atendimento é de até 2 horas.</p>
                  )}
                </div>

                {/* Reply Form */}
                {selectedTicket.status === "open" && (
                  <form onSubmit={handleReplySubmit} className="flex gap-3 items-end mt-4">
                    <div className="flex-1">
                      <textarea
                        required
                        rows={2}
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        placeholder="Escreva sua tréplica..."
                        className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-transparent text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-cyan-500 resize-none font-sans"
                      />
                    </div>
                    <button
                      type="submit"
                      className="h-10 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl font-bold text-xs px-4 flex items-center justify-center gap-1.5 cursor-pointer shrink-0 transition-colors"
                    >
                      <Send className="w-4 h-4" /> Enviar
                    </button>
                  </form>
                )}

              </div>
            ) : (
              /* Chamados List and submission form */
              <div className="flex flex-col gap-6">
                <div>
                  <h3 className="text-lg font-black text-zinc-900 dark:text-white uppercase tracking-wider font-mono">Suporte e Chamados</h3>
                  <p className="text-xs text-zinc-500 dark:text-slate-400 mt-0.5">Escreva um chamado para nosso time de Engenharia de Suporte.</p>
                </div>

                {ticketSuccess && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-semibold flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <span>Ticket de chamado registrado com sucesso! Responderemos em breve.</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Create Ticket Form */}
                  <form onSubmit={handleSupportSubmit} className="flex flex-col gap-4">
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider font-mono border-b border-zinc-150 dark:border-white/5 pb-2">Novo Chamado</h4>
                    
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-zinc-700 dark:text-slate-300">Assunto / Tópico</label>
                      <input
                        type="text"
                        required
                        value={newSubject}
                        onChange={(e) => setNewSubject(e.target.value)}
                        placeholder="Ex: Erro ao gerar imagem"
                        className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-transparent text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-zinc-700 dark:text-slate-300">Mensagem Detalhada</label>
                      <textarea
                        required
                        rows={4}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Descreva detalhadamente o ocorrido..."
                        className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-white/10 bg-transparent text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 resize-none font-sans"
                      />
                    </div>

                    <button
                      type="submit"
                      className="h-10 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl text-xs font-bold shadow cursor-pointer self-start px-5 transition-colors"
                    >
                      Abrir Chamado
                    </button>
                  </form>

                  {/* Historic Chamados List */}
                  <div className="flex flex-col gap-4">
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider font-mono border-b border-zinc-150 dark:border-white/5 pb-2">Meus Chamados</h4>
                    {tickets.length > 0 ? (
                      <div className="flex flex-col gap-3">
                        {tickets.map((t) => (
                          <div 
                            key={t.id}
                            onClick={() => setSelectedTicket(t)}
                            className="p-3.5 rounded-xl border border-zinc-200 dark:border-white/5 hover:border-cyan-500/20 bg-zinc-50 dark:bg-zinc-900/40 flex items-center justify-between cursor-pointer transition-colors"
                          >
                            <div className="flex flex-col gap-0.5">
                              <span className="text-xs font-bold text-zinc-900 dark:text-white font-mono truncate max-w-[150px]">{t.subject}</span>
                              <span className="text-[9px] text-zinc-500 font-mono">{new Date(t.createdAt).toLocaleDateString("pt-BR")}</span>
                            </div>
                            <span className="bg-cyan-100 text-cyan-600 dark:bg-cyan-950/30 dark:text-cyan-400 font-bold px-2 py-0.5 rounded text-[8px] uppercase font-mono">
                              {t.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono italic">Você não possui nenhum chamado de suporte em andamento.</p>
                    )}
                  </div>
                </div>

              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
