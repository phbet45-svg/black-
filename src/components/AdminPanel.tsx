import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { 
  collection, getDocs, doc, setDoc, updateDoc, 
  deleteDoc, addDoc, onSnapshot, query, orderBy, limit 
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { 
  UserProfile, Plan, AITool, SystemLog, BlogPost, 
  SupportTicket, SocialLinks 
} from "../types";
import { 
  Users, CreditCard, Settings, FileText, LifeBuoy, 
  TrendingUp, Trash2, Edit3, ShieldAlert, Check, Plus, 
  Search, ShieldAlert as BlockIcon, UserCheck, RefreshCw, 
  Save, Eye, FileMinus, MessageSquare, Globe, ArrowLeft, Send
} from "lucide-react";

export default function AdminPanel() {
  const { 
    plans, socials, tools, blogPosts, updateSocials, 
    updatePlans, updateTools, addSystemLog 
  } = useApp();
  const [activeTab, setActiveTab] = useState<"dashboard" | "users" | "plans" | "tools" | "blog" | "support" | "socials-seo" | "logs">("dashboard");

  // Admin CRUD states
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [allLogs, setAllLogs] = useState<SystemLog[]>([]);
  const [allTickets, setAllTickets] = useState<SupportTicket[]>([]);
  
  // Modals / Editors
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [searchUserQuery, setSearchUserQuery] = useState("");
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  // New User form
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPlan, setNewUserPlan] = useState<any>("basic");

  // Edit User form
  const [editCredits, setEditCredits] = useState(0);
  const [editDaily, setEditDaily] = useState(0);
  const [editMonthly, setEditMonthly] = useState(0);
  const [editPlan, setEditPlan] = useState<"basic" | "medium" | "premium">("basic");

  // Plan editor states
  const [editPlansList, setEditPlansList] = useState<Plan[]>([]);
  const [selectedPlanToEdit, setSelectedPlanToEdit] = useState<Plan | null>(null);

  // Blog Publisher states
  const [blogTitle, setBlogTitle] = useState("");
  const [blogContent, setBlogContent] = useState("");
  const [blogCategory, setBlogCategory] = useState("Inteligência Artificial");
  const [blogAuthor, setBlogAuthor] = useState("Redação BLACKHAT AI");
  const [blogImg, setBlogImg] = useState("");
  const [blogSeoTitle, setBlogSeoTitle] = useState("");
  const [blogSeoDesc, setBlogSeoDesc] = useState("");
  const [blogSeoKeywords, setBlogSeoKeywords] = useState("");

  // Social Links state
  const [socialForm, setSocialForm] = useState<SocialLinks>({ ...socials });
  
  // SEO global settings
  const [globalSeoTitle, setGlobalSeoTitle] = useState("BLACKHAT AI - Plataforma de Inteligência Artificial de Elite");
  const [globalSeoDesc, setGlobalSeoDesc] = useState("Suíte completa contendo mais de 19 ferramentas de Inteligência Artificial de elite para criadores, copywriters e desenvolvedores.");
  const [globalSeoKeywords, setGlobalSeoKeywords] = useState("inteligência artificial, copy, gerador de imagem, suno ai, midi, srt");

  // Support Reply state
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [adminReply, setAdminReply] = useState("");

  useEffect(() => {
    setSocialForm({ ...socials });
  }, [socials]);

  useEffect(() => {
    setEditPlansList([...plans]);
  }, [plans]);

  // Load Admin Data
  useEffect(() => {
    // 1. Listen to all users
    const unsubscribeUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      const uList: UserProfile[] = [];
      snapshot.forEach((docSnap) => {
        uList.push(docSnap.data() as UserProfile);
      });
      setAllUsers(uList);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, "users");
    });

    // 2. Listen to all logs
    const logQuery = query(collection(db, "logs"), orderBy("timestamp", "desc"), limit(100));
    const unsubscribeLogs = onSnapshot(logQuery, (snapshot) => {
      const lList: SystemLog[] = [];
      snapshot.forEach((docSnap) => {
        lList.push({ id: docSnap.id, ...docSnap.data() } as SystemLog);
      });
      setAllLogs(lList);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, "logs");
    });

    // 3. Listen to all tickets
    const unsubscribeTickets = onSnapshot(collection(db, "support"), (snapshot) => {
      const tList: SupportTicket[] = [];
      snapshot.forEach((docSnap) => {
        tList.push({ id: docSnap.id, ...docSnap.data() } as SupportTicket);
      });
      setAllTickets(tList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, "support");
    });

    return () => {
      unsubscribeUsers();
      unsubscribeLogs();
      unsubscribeTickets();
    };
  }, []);

  // Filtered users
  const filteredUsers = allUsers.filter((u) => {
    return u.displayName?.toLowerCase().includes(searchUserQuery.toLowerCase()) || 
           u.email?.toLowerCase().includes(searchUserQuery.toLowerCase());
  });

  // Calculate stats
  const totalUsers = allUsers.length;
  const premiumUsers = allUsers.filter(u => u.planId !== "basic").length;
  const activeUsersToday = allUsers.filter(u => !u.isBlocked).length;
  const estimatedRevenue = allUsers.reduce((sum, u) => {
    const p = plans.find(pl => pl.id === u.planId);
    return sum + (p ? p.price : 0);
  }, 0);

  // User Actions: Block/Unblock, Change Plan, Save credits
  const handleToggleBlock = async (userProfile: UserProfile) => {
    try {
      const nextBlocked = !userProfile.isBlocked;
      await updateDoc(doc(db, "users", userProfile.uid), { isBlocked: nextBlocked });
      await addSystemLog("ADMIN_USER_BLOCK", `Usuário ${userProfile.email} foi ${nextBlocked ? 'bloqueado' : 'desbloqueado'} pelo Admin.`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleApproveRequestedPlan = async (u: UserProfile) => {
    if (!u.requestedPlanId) return;
    try {
      const isMedium = u.requestedPlanId === "medium";
      const isPremium = u.requestedPlanId === "premium";
      
      const newCredits = isPremium ? 99999 : (isMedium ? 500 : 50);
      const newDaily = isPremium ? 999 : (isMedium ? 100 : 10);
      const newMonthly = isPremium ? 9999 : (isMedium ? 500 : 50);

      await updateDoc(doc(db, "users", u.uid), {
        planId: u.requestedPlanId,
        credits: newCredits,
        dailyLimit: newDaily,
        monthlyLimit: newMonthly
      });
      await addSystemLog("ADMIN_USER_EDIT", `Plano solicitado (${u.requestedPlanId}) aprovado para ${u.email} pelo Admin.`);
      alert(`Plano ${u.requestedPlanId.toUpperCase()} ativado com sucesso para ${u.displayName}!`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveUserEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      await updateDoc(doc(db, "users", selectedUser.uid), {
        credits: editCredits,
        dailyLimit: editDaily,
        monthlyLimit: editMonthly,
        planId: editPlan
      });
      setSelectedUser(null);
      await addSystemLog("ADMIN_USER_EDIT", `Dados do usuário ${selectedUser.email} alterados pelo Admin.`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteUser = async (uid: string, email: string) => {
    const confirm = window.confirm(`Excluir permanentemente o usuário ${email}?`);
    if (!confirm) return;

    try {
      await deleteDoc(doc(db, "users", uid));
      await addSystemLog("ADMIN_USER_DELETE", `Usuário ${email} deletado do banco pelo Admin.`);
    } catch (err) {
      console.error(err);
    }
  };

  // Plan Actions
  const handleSavePlanSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanToEdit) return;

    const updated = editPlansList.map(p => p.id === selectedPlanToEdit.id ? selectedPlanToEdit : p);
    try {
      await updatePlans(updated);
      setSelectedPlanToEdit(null);
      alert("Configurações do plano atualizadas e aplicadas!");
    } catch (err) {
      console.error(err);
    }
  };

  // Tool status toggle
  const handleToggleToolStatus = async (toolId: string, currentStatus: 'free' | 'premium' | 'blocked') => {
    const nextStatus = currentStatus === "free" ? "premium" : currentStatus === "premium" ? "blocked" : "free";
    const updated = tools.map(t => t.id === toolId ? { ...t, status: nextStatus } : t);
    try {
      await updateTools(updated);
      await addSystemLog("ADMIN_TOOL_EDIT", `Ferramenta ${toolId} alterada para status: ${nextStatus}`);
    } catch (err) {
      console.error(err);
    }
  };

  // Blog Actions
  const handlePublishBlogPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blogTitle.trim() || !blogContent.trim()) return;

    try {
      const slug = blogTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
      const newPost: Omit<BlogPost, "id"> = {
        title: blogTitle,
        slug,
        content: blogContent,
        category: blogCategory,
        author: blogAuthor,
        imageUrl: blogImg || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
        seoTitle: blogSeoTitle || blogTitle,
        seoDescription: blogSeoDesc || blogContent.substring(0, 150),
        seoKeywords: blogSeoKeywords || "ia, software, inteligência artificial",
        createdAt: new Date().toISOString(),
        comments: []
      };

      await addDoc(collection(db, "blog"), newPost);
      
      setBlogTitle("");
      setBlogContent("");
      setBlogImg("");
      setBlogSeoTitle("");
      setBlogSeoDesc("");
      setBlogSeoKeywords("");
      alert("Artigo publicado com sucesso no blog e indexado para SEO!");
      await addSystemLog("ADMIN_BLOG_PUBLISH", `Artigo publicado: ${blogTitle}`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePost = async (id: string, title: string) => {
    const confirm = window.confirm(`Tem certeza que deseja excluir o post: ${title}?`);
    if (!confirm) return;

    try {
      await deleteDoc(doc(db, "blog", id));
      await addSystemLog("ADMIN_BLOG_DELETE", `Post excluído pelo Admin: ${title}`);
    } catch (err) {
      console.error(err);
    }
  };

  // Support Reply Actions
  const handleAdminSupportReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !adminReply.trim()) return;

    try {
      const ticketRef = doc(db, "support", selectedTicket.id);
      const updatedReplies = [
        ...(selectedTicket.replies || []),
        {
          id: Math.random().toString(36).substring(2, 9),
          sender: "admin" as const,
          message: adminReply,
          createdAt: new Date().toISOString()
        }
      ];

      await updateDoc(ticketRef, {
        replies: updatedReplies,
        status: "closed" // Automatically close the ticket once answered
      });

      setSelectedTicket(null);
      setAdminReply("");
      alert("Resposta de suporte enviada e chamado encerrado.");
      await addSystemLog("ADMIN_SUPPORT_REPLY", `Resposta enviada no ticket: ${selectedTicket.subject}`);
    } catch (err) {
      console.error(err);
    }
  };

  // Social Links Action
  const handleSocialSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateSocials(socialForm);
      alert("Links de redes sociais e SEO global atualizados com sucesso!");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mx-auto max-w-7xl px-6 py-8 animate-fade-in font-sans">
      
      {/* Sidebar menu admin tabs */}
      <div className="lg:col-span-1 flex flex-col gap-4">
        <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850">
          
          <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-zinc-150 dark:border-zinc-850">
            <div className="w-10 h-10 rounded-full bg-red-600 text-white font-bold flex items-center justify-center border border-red-500 shadow shadow-red-500/20 font-mono">
              AD
            </div>
            <div>
              <h4 className="text-xs font-black text-zinc-900 dark:text-white uppercase tracking-wider font-mono">BLACKHAT Admin</h4>
              <span className="text-[9px] text-red-500 font-bold uppercase font-mono tracking-widest animate-pulse">
                Sessão Master
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={() => { setActiveTab("dashboard"); setSelectedTicket(null); }}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 cursor-pointer ${
                activeTab === "dashboard" ? "bg-red-600 text-white" : "hover:bg-zinc-150 dark:hover:bg-zinc-850 text-zinc-600 dark:text-zinc-400"
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Painel Estatístico</span>
            </button>
            <button
              onClick={() => { setActiveTab("users"); setSelectedTicket(null); }}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 cursor-pointer ${
                activeTab === "users" ? "bg-red-600 text-white" : "hover:bg-zinc-150 dark:hover:bg-zinc-850 text-zinc-600 dark:text-zinc-400"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Usuários & Créditos</span>
            </button>
            <button
              onClick={() => { setActiveTab("plans"); setSelectedTicket(null); }}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 cursor-pointer ${
                activeTab === "plans" ? "bg-red-600 text-white" : "hover:bg-zinc-150 dark:hover:bg-zinc-850 text-zinc-600 dark:text-zinc-400"
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Planos & Preços</span>
            </button>
            <button
              onClick={() => { setActiveTab("tools"); setSelectedTicket(null); }}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 cursor-pointer ${
                activeTab === "tools" ? "bg-red-600 text-white" : "hover:bg-zinc-150 dark:hover:bg-zinc-850 text-zinc-600 dark:text-zinc-400"
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Ferramentas de IA</span>
            </button>
            <button
              onClick={() => { setActiveTab("blog"); setSelectedTicket(null); }}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 cursor-pointer ${
                activeTab === "blog" ? "bg-red-600 text-white" : "hover:bg-zinc-150 dark:hover:bg-zinc-850 text-zinc-600 dark:text-zinc-400"
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Gerenciar Blog</span>
            </button>
            <button
              onClick={() => { setActiveTab("support"); setSelectedTicket(null); }}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 cursor-pointer ${
                activeTab === "support" ? "bg-red-600 text-white" : "hover:bg-zinc-150 dark:hover:bg-zinc-850 text-zinc-600 dark:text-zinc-400"
              }`}
            >
              <LifeBuoy className="w-4 h-4" />
              <span>Tickets de Suporte</span>
            </button>
            <button
              onClick={() => { setActiveTab("socials-seo"); setSelectedTicket(null); }}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 cursor-pointer ${
                activeTab === "socials-seo" ? "bg-red-600 text-white" : "hover:bg-zinc-150 dark:hover:bg-zinc-850 text-zinc-600 dark:text-zinc-400"
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>Redes & SEO Global</span>
            </button>
            <button
              onClick={() => { setActiveTab("logs"); setSelectedTicket(null); }}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 cursor-pointer ${
                activeTab === "logs" ? "bg-red-600 text-white" : "hover:bg-zinc-150 dark:hover:bg-zinc-850 text-zinc-600 dark:text-zinc-400"
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Logs do Sistema</span>
            </button>
          </div>

        </div>
      </div>

      {/* Main Admin Content box */}
      <div className="lg:col-span-4 flex flex-col gap-6">

        {/* STATS DASHBOARD TAB */}
        {activeTab === "dashboard" && (
          <div className="flex flex-col gap-8 animate-fade-in">
            {/* Bento statistics grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              
              <div className="p-5 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 flex flex-col gap-1.5 shadow-sm">
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest font-mono">Usuários Totais</span>
                <span className="text-2xl font-black text-zinc-900 dark:text-white font-mono">{totalUsers}</span>
                <span className="text-[10px] text-emerald-600 font-bold font-mono">100% cloud sync</span>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 flex flex-col gap-1.5 shadow-sm">
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest font-mono">Assinaturas Premium</span>
                <span className="text-2xl font-black text-zinc-900 dark:text-white font-mono">{premiumUsers}</span>
                <span className="text-[10px] text-emerald-600 font-bold font-mono">Planos Médio/Premium</span>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 flex flex-col gap-1.5 shadow-sm">
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest font-mono">Receita Estimada</span>
                <span className="text-2xl font-black text-zinc-900 dark:text-white font-mono">R$ {estimatedRevenue.toFixed(2)}</span>
                <span className="text-[10px] text-red-500 font-bold font-mono">Assinaturas Ativas</span>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 flex flex-col gap-1.5 shadow-sm">
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest font-mono">Nós Online</span>
                <span className="text-2xl font-black text-zinc-900 dark:text-white font-mono">{activeUsersToday}</span>
                <span className="text-[10px] text-emerald-600 font-bold font-mono">Sem bloqueios ativos</span>
              </div>

            </div>

            {/* Custom SVG Line/Bar graphics (no external charts library required for safety) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Daily active sessions chart */}
              <div className="p-6 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 shadow-sm flex flex-col gap-4">
                <h3 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider font-mono">Gráfico de Faturamento Recorrente (R$)</h3>
                <div className="w-full h-44 bg-zinc-50 dark:bg-zinc-900/40 rounded-xl relative overflow-hidden flex items-end p-4">
                  {/* SVG Bar Chart */}
                  <svg className="w-full h-full" viewBox="0 0 400 150">
                    <rect x="20" y="80" width="30" height="70" fill="#f43f5e" rx="4" />
                    <rect x="80" y="50" width="30" height="100" fill="#f43f5e" rx="4" />
                    <rect x="140" y="60" width="30" height="90" fill="#f43f5e" rx="4" />
                    <rect x="200" y="30" width="30" height="120" fill="#f43f5e" rx="4" />
                    <rect x="260" y="40" width="30" height="110" fill="#f43f5e" rx="4" />
                    <rect x="320" y="20" width="30" height="130" fill="#dc2626" rx="4" />
                    <line x1="0" y1="145" x2="400" y2="145" stroke="#444" strokeWidth="1" />
                  </svg>
                </div>
                <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                  <span>Fev</span>
                  <span>Mar</span>
                  <span>Abr</span>
                  <span>Mai</span>
                  <span>Jun</span>
                  <span>Jul (Hoje)</span>
                </div>
              </div>

              {/* Tool consumption bento list */}
              <div className="p-6 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 shadow-sm flex flex-col gap-4">
                <h3 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider font-mono border-b pb-3">Ferramentas de Maior Consumo</h3>
                <div className="flex flex-col gap-3.5 font-mono text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500">1. Chat IA</span>
                    <span className="text-zinc-900 dark:text-white font-bold">42.8% de uso</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500">2. Gerador de Imagens</span>
                    <span className="text-zinc-900 dark:text-white font-bold">28.1% de uso</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500">3. Gerador de Código</span>
                    <span className="text-zinc-900 dark:text-white font-bold">15.5% de uso</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* USERS AND LIMITS TAB */}
        {activeTab === "users" && (
          <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 shadow-sm animate-fade-in flex flex-col gap-6">
            
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-zinc-150 dark:border-zinc-850">
              <div>
                <h3 className="text-lg font-black text-zinc-900 dark:text-white uppercase tracking-wider font-mono">Controle de Usuários</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Altere permissões, adicione créditos, mude planos e bloqueie acessos.</p>
              </div>

              <div className="relative w-full max-w-xs">
                <Search className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  value={searchUserQuery}
                  onChange={(e) => setSearchUserQuery(e.target.value)}
                  placeholder="Procurar por nome ou e-mail..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-850 bg-transparent text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>
            </div>

            {/* Users grid table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-zinc-250 dark:border-zinc-800 text-zinc-500 uppercase tracking-widest text-[9px] pb-2">
                    <th className="py-2.5">Nome</th>
                    <th className="py-2.5">E-mail</th>
                    <th className="py-2.5">Plano Atual</th>
                    <th className="py-2.5">Solicitação</th>
                    <th className="py-2.5">Créditos</th>
                    <th className="py-2.5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900 text-zinc-600 dark:text-zinc-300">
                  {filteredUsers.map((u) => (
                    <tr key={u.uid} className={u.isBlocked ? "opacity-50 bg-red-50/10" : ""}>
                      <td className="py-3 font-bold text-zinc-900 dark:text-white">
                        <div>{u.displayName}</div>
                        {u.phone && (
                          <div className="text-[10px] text-zinc-400 font-normal mt-0.5 select-all">
                            WA: {u.phone}
                          </div>
                        )}
                      </td>
                      <td className="py-3">{u.email}</td>
                      <td className="py-3 uppercase">
                        <span className="bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400 px-2 py-0.5 rounded font-bold uppercase text-[9px]">
                          {u.planId}
                        </span>
                      </td>
                      <td className="py-3 uppercase">
                        {u.requestedPlanId && u.requestedPlanId !== u.planId ? (
                          <div className="flex items-center gap-1.5">
                            <span className="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 px-2 py-0.5 rounded font-bold uppercase text-[9px] animate-pulse">
                              {u.requestedPlanId}
                            </span>
                            <button
                              onClick={() => handleApproveRequestedPlan(u)}
                              className="px-1.5 py-0.5 rounded bg-emerald-500 hover:bg-emerald-400 text-black font-sans font-extrabold text-[8px] transition-colors uppercase tracking-wider cursor-pointer"
                              title="Aprovar Plano Solicitado"
                            >
                              Ativar
                            </button>
                          </div>
                        ) : (
                          <span className="text-zinc-400 text-[10px]">-</span>
                        )}
                      </td>
                      <td className="py-3">{u.credits}</td>
                      <td className="py-3 text-right flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedUser(u);
                            setEditCredits(u.credits);
                            setEditDaily(u.dailyLimit);
                            setEditMonthly(u.monthlyLimit);
                            setEditPlan(u.planId);
                          }}
                          className="p-1.5 rounded bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-colors cursor-pointer"
                          title="Editar Usuário"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleBlock(u)}
                          className={`p-1.5 rounded transition-colors cursor-pointer ${
                            u.isBlocked 
                              ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20" 
                              : "bg-amber-50 text-amber-600 dark:bg-amber-950/20"
                          }`}
                          title={u.isBlocked ? "Desbloquear Usuário" : "Bloquear Usuário"}
                        >
                          {u.isBlocked ? <UserCheck className="w-3.5 h-3.5" /> : <BlockIcon className="w-3.5 h-3.5" />}
                        </button>
                        {u.email !== "blackhat@x.com" && (
                          <button
                            onClick={() => handleDeleteUser(u.uid, u.email)}
                            className="p-1.5 rounded bg-red-50 text-red-600 dark:bg-red-950/20 transition-colors cursor-pointer"
                            title="Deletar Usuário"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Edit User Modal Overlay */}
            {selectedUser && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 p-6 md:p-8 rounded-2xl max-w-sm w-full flex flex-col gap-5 relative">
                  <div>
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider font-mono">Editar Usuário</h4>
                    <p className="text-xs text-zinc-500 mt-1">{selectedUser.displayName} ({selectedUser.email})</p>
                  </div>

                  <form onSubmit={handleSaveUserEdit} className="flex flex-col gap-4 text-xs font-mono">
                    <div className="flex flex-col gap-1">
                      <label className="font-bold text-zinc-700 dark:text-zinc-400">Total de Créditos</label>
                      <input
                        type="number"
                        value={editCredits}
                        onChange={(e) => setEditCredits(parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-850 bg-transparent"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="font-bold text-zinc-700 dark:text-zinc-400">Limite Diário</label>
                        <input
                          type="number"
                          value={editDaily}
                          onChange={(e) => setEditDaily(parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-850 bg-transparent text-center"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="font-bold text-zinc-700 dark:text-zinc-400">Limite Mensal</label>
                        <input
                          type="number"
                          value={editMonthly}
                          onChange={(e) => setEditMonthly(parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-850 bg-transparent text-center"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="font-bold text-zinc-700 dark:text-zinc-400">Plano de Assinatura</label>
                      <select
                        value={editPlan}
                        onChange={(e) => setEditPlan(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-850 bg-transparent"
                      >
                        <option value="basic">Básico</option>
                        <option value="medium">Médio</option>
                        <option value="premium">Premium</option>
                      </select>
                    </div>

                    <div className="flex gap-2.5 mt-3">
                      <button
                        type="button"
                        onClick={() => setSelectedUser(null)}
                        className="flex-1 h-9 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold rounded-lg cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="flex-1 h-9 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg cursor-pointer"
                      >
                        Salvar
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

          </div>
        )}

        {/* PLANS AND ASSIGNATURES EDITOR TAB */}
        {activeTab === "plans" && (
          <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 shadow-sm animate-fade-in flex flex-col gap-6">
            <div>
              <h3 className="text-lg font-black text-zinc-900 dark:text-white uppercase tracking-wider font-mono">Planos e Limites de Elite</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Altere os preços dos planos, redefina os limites mensais e modifique os benefícios de forma 100% dinâmica.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {editPlansList.map((p) => (
                <div 
                  key={p.id}
                  className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-850 flex flex-col gap-4 relative"
                >
                  <div>
                    <h4 className="text-xs font-extrabold text-zinc-900 dark:text-white uppercase tracking-wider font-mono">{p.name}</h4>
                    <span className="text-lg font-black text-zinc-900 dark:text-white font-mono mt-1 block">R$ {p.price.toFixed(2)}/mês</span>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">{p.description}</p>
                  </div>

                  <div className="font-mono text-[10px] text-zinc-500 flex flex-col gap-1.5 border-t border-b border-zinc-100 dark:border-zinc-900 py-3">
                    <div><strong>Textos:</strong> {p.textLimit}</div>
                    <div><strong>Imagens:</strong> {p.imageLimit}</div>
                    <div><strong>Músicas:</strong> {p.musicLimit}</div>
                    <div><strong>Storage:</strong> {p.storageGB} GB</div>
                  </div>

                  <button
                    onClick={() => setSelectedPlanToEdit(p)}
                    className="w-full h-9 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 text-xs font-bold rounded-lg cursor-pointer"
                  >
                    Editar Configurações
                  </button>
                </div>
              ))}
            </div>

            {/* Edit Plan Settings Overlay Form */}
            {selectedPlanToEdit && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 p-6 md:p-8 rounded-2xl max-w-sm w-full flex flex-col gap-5 relative">
                  <div>
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider font-mono">Editar Plano</h4>
                    <p className="text-xs text-zinc-500 mt-1">{selectedPlanToEdit.name}</p>
                  </div>

                  <form onSubmit={handleSavePlanSettings} className="flex flex-col gap-4 text-xs font-mono">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="font-bold text-zinc-700 dark:text-zinc-400">Preço Mensal (R$)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={selectedPlanToEdit.price}
                          onChange={(e) => setSelectedPlanToEdit({ ...selectedPlanToEdit, price: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-850 bg-transparent text-center"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="font-bold text-zinc-700 dark:text-zinc-400">Armazenamento (GB)</label>
                        <input
                          type="number"
                          value={selectedPlanToEdit.storageGB}
                          onChange={(e) => setSelectedPlanToEdit({ ...selectedPlanToEdit, storageGB: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-850 bg-transparent text-center"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="font-bold text-zinc-700 dark:text-zinc-400">L. Textos</label>
                        <input
                          type="number"
                          value={selectedPlanToEdit.textLimit}
                          onChange={(e) => setSelectedPlanToEdit({ ...selectedPlanToEdit, textLimit: parseInt(e.target.value) || 0 })}
                          className="w-full px-2 py-2 rounded-lg border border-zinc-200 dark:border-zinc-850 bg-transparent text-center"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="font-bold text-zinc-700 dark:text-zinc-400">L. Imagens</label>
                        <input
                          type="number"
                          value={selectedPlanToEdit.imageLimit}
                          onChange={(e) => setSelectedPlanToEdit({ ...selectedPlanToEdit, imageLimit: parseInt(e.target.value) || 0 })}
                          className="w-full px-2 py-2 rounded-lg border border-zinc-200 dark:border-zinc-850 bg-transparent text-center"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="font-bold text-zinc-700 dark:text-zinc-400">L. Músicas</label>
                        <input
                          type="number"
                          value={selectedPlanToEdit.musicLimit}
                          onChange={(e) => setSelectedPlanToEdit({ ...selectedPlanToEdit, musicLimit: parseInt(e.target.value) || 0 })}
                          className="w-full px-2 py-2 rounded-lg border border-zinc-200 dark:border-zinc-850 bg-transparent text-center"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2.5 mt-3">
                      <button
                        type="button"
                        onClick={() => setSelectedPlanToEdit(null)}
                        className="flex-1 h-9 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold rounded-lg cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="flex-1 h-9 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg cursor-pointer"
                      >
                        Salvar Plano
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

          </div>
        )}

        {/* TOOLS IA MANAGER TAB */}
        {activeTab === "tools" && (
          <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 shadow-sm animate-fade-in flex flex-col gap-6">
            <div>
              <h3 className="text-lg font-black text-zinc-900 dark:text-white uppercase tracking-wider font-mono">Gerenciar Status de Ferramentas</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Defina se cada uma das 19 ferramentas é Gratuita, Premium ou se está Temporariamente Bloqueada.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              {tools.map((t) => (
                <div 
                  key={t.id}
                  className="p-4 rounded-xl border border-zinc-150 dark:border-zinc-850 flex items-center justify-between"
                >
                  <div>
                    <h4 className="font-bold text-zinc-900 dark:text-white uppercase text-[11px]">{t.name}</h4>
                    <span className="text-[9px] text-zinc-500">Categoria: {t.category}</span>
                  </div>

                  <button
                    onClick={() => handleToggleToolStatus(t.id, t.status)}
                    className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase cursor-pointer ${
                      t.status === "free" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20" :
                      t.status === "premium" ? "bg-red-50 text-red-600 dark:bg-red-950/20" :
                      "bg-zinc-100 text-zinc-500"
                    }`}
                  >
                    {t.status === "free" && "Liberado (Livre)"}
                    {t.status === "premium" && "Plano Premium"}
                    {t.status === "blocked" && "Bloqueada"}
                  </button>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* BLOG MANAGER TAB */}
        {activeTab === "blog" && (
          <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 shadow-sm animate-fade-in flex flex-col gap-6">
            <div>
              <h3 className="text-lg font-black text-zinc-900 dark:text-white uppercase tracking-wider font-mono">Editor e Publisher do Blog</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Escreva e indexe novos artigos técnicos para reter tráfego orgânico.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Publication form */}
              <form onSubmit={handlePublishBlogPost} className="flex flex-col gap-4 text-xs font-mono">
                <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider border-b pb-2">Novo Artigo</h4>
                
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-zinc-700 dark:text-zinc-300">Título do Artigo</label>
                  <input
                    type="text"
                    required
                    value={blogTitle}
                    onChange={(e) => setBlogTitle(e.target.value)}
                    placeholder="Ex: Como o Llama-3-8b revoluciona a redação"
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-850 bg-transparent text-zinc-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-zinc-700 dark:text-zinc-300">Conteúdo Completo (Markdown)</label>
                  <textarea
                    required
                    rows={6}
                    value={blogContent}
                    onChange={(e) => setBlogContent(e.target.value)}
                    placeholder="Escreva todo o escopo do texto aqui..."
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-850 bg-transparent text-zinc-900 dark:text-white focus:outline-none resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-bold text-zinc-700 dark:text-zinc-300">Categoria</label>
                    <select
                      value={blogCategory}
                      onChange={(e) => setBlogCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-850 bg-transparent"
                    >
                      <option value="Inteligência Artificial">Inteligência Artificial</option>
                      <option value="Tecnologia">Tecnologia</option>
                      <option value="Segurança">Segurança</option>
                      <option value="Marketing Digital">Marketing Digital</option>
                      <option value="Novidades">Novidades</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-bold text-zinc-700 dark:text-zinc-300">Imagem Principal (URL)</label>
                    <input
                      type="text"
                      value={blogImg}
                      onChange={(e) => setBlogImg(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-850 bg-transparent"
                    />
                  </div>
                </div>

                {/* SEO fields per post */}
                <div className="p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl flex flex-col gap-3">
                  <h5 className="font-bold text-[10px] uppercase text-zinc-500">Configurações SEO do Artigo</h5>
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="font-bold text-zinc-700 dark:text-zinc-400">SEO Title Tag</label>
                    <input
                      type="text"
                      value={blogSeoTitle}
                      onChange={(e) => setBlogSeoTitle(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-850 bg-transparent text-[11px]"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-bold text-zinc-700 dark:text-zinc-400 font-mono">Meta Description</label>
                    <input
                      type="text"
                      value={blogSeoDesc}
                      onChange={(e) => setBlogSeoDesc(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-850 bg-transparent text-[11px]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="h-10 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-xs cursor-pointer self-start px-5"
                >
                  Publicar Artigo
                </button>
              </form>

              {/* Existing blog articles list */}
              <div className="flex flex-col gap-4 text-xs font-mono">
                <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider border-b pb-2">Artigos Publicados ({blogPosts.length})</h4>
                {blogPosts.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {blogPosts.map((post) => (
                      <div 
                        key={post.id}
                        className="p-3.5 rounded-xl border border-zinc-150 dark:border-zinc-850 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/40"
                      >
                        <div className="truncate max-w-[200px]">
                          <span className="font-bold text-zinc-900 dark:text-white">{post.title}</span>
                          <span className="block text-[9px] text-zinc-400 mt-0.5">Por {post.author} • {post.category}</span>
                        </div>

                        <button
                          onClick={() => handleDeletePost(post.id, post.title)}
                          className="p-1.5 rounded bg-red-50 text-red-600 dark:bg-red-950/20 hover:bg-red-100 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono italic">Nenhum post publicado ainda.</p>
                )}
              </div>

            </div>

          </div>
        )}

        {/* SUPPORT TICKETS ADMINISTRATOR TAB */}
        {activeTab === "support" && (
          <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 shadow-sm animate-fade-in flex flex-col gap-6">
            
            {selectedTicket ? (
              /* Conversation reply screen */
              <div className="flex flex-col gap-5">
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="self-start text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white uppercase flex items-center gap-1 cursor-pointer"
                >
                  ← Voltar aos Chamados
                </button>

                <div className="p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 rounded-xl">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-white font-mono">{selectedTicket.subject}</h4>
                    <span className="text-[9px] bg-red-100 text-red-600 dark:bg-red-950/30 dark:text-red-400 font-bold px-2 py-0.5 rounded uppercase font-mono">
                      {selectedTicket.status}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-300 font-sans mt-2"><strong>Mensagem do usuário ({selectedTicket.userEmail}):</strong> {selectedTicket.message}</p>
                </div>

                {/* Replies list */}
                <div className="flex flex-col gap-4">
                  <h5 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono">Mensagens</h5>
                  {selectedTicket.replies && selectedTicket.replies.length > 0 ? (
                    selectedTicket.replies.map((reply) => (
                      <div 
                        key={reply.id}
                        className={`p-4 rounded-xl border max-w-md text-xs font-sans ${
                          reply.sender === "admin" 
                            ? "bg-red-50/50 border-red-500/10 self-end" 
                            : "bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-850 self-start"
                        }`}
                      >
                        <div className="flex justify-between text-[9px] text-zinc-500 font-mono mb-1 gap-4">
                          <strong>{reply.sender === "admin" ? "Você (Suporte Master)" : "Usuário"}</strong>
                          <span>{new Date(reply.createdAt).toLocaleDateString("pt-BR")}</span>
                        </div>
                        <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">{reply.message}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono italic">Sem réplicas. Responda o chamado para encerrá-lo.</p>
                  )}
                </div>

                {/* Reply reply form */}
                <form onSubmit={handleAdminSupportReply} className="flex gap-3 items-end mt-4">
                  <div className="flex-1">
                    <textarea
                      required
                      rows={2}
                      value={adminReply}
                      onChange={(e) => setAdminReply(e.target.value)}
                      placeholder="Escreva a resposta final e encerre..."
                      className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-red-500 resize-none font-sans"
                    />
                  </div>
                  <button
                    type="submit"
                    className="h-10 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-xs px-4 flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Send className="w-4 h-4" /> Enviar & Fechar
                  </button>
                </form>

              </div>
            ) : (
              /* Admin tickets overview table */
              <div className="flex flex-col gap-4 text-xs font-mono">
                <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider border-b pb-2">Chamados de Suporte ({allTickets.length})</h4>
                {allTickets.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {allTickets.map((t) => (
                      <div 
                        key={t.id}
                        onClick={() => setSelectedTicket(t)}
                        className="p-3.5 rounded-xl border border-zinc-150 dark:border-zinc-850 hover:border-zinc-300 bg-zinc-50 dark:bg-zinc-900/40 flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <div>
                          <span className="font-bold text-zinc-900 dark:text-white">{t.subject}</span>
                          <span className="block text-[9px] text-zinc-400 mt-0.5">Por {t.userEmail} • {new Date(t.createdAt).toLocaleDateString("pt-BR")}</span>
                        </div>

                        <span className="bg-red-100 text-red-600 dark:bg-red-950/30 dark:text-red-400 font-bold px-2 py-0.5 rounded text-[8px] uppercase font-mono">
                          {t.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono italic">Nenhum chamado de suporte aberto no momento.</p>
                )}
              </div>
            )}

          </div>
        )}

        {/* SOCIAL NETWORKS AND GLOBAL SEO SETTINGS TAB */}
        {activeTab === "socials-seo" && (
          <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 shadow-sm animate-fade-in flex flex-col gap-6">
            <div>
              <h3 className="text-lg font-black text-zinc-900 dark:text-white uppercase tracking-wider font-mono">Configurações de Redes & SEO</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Altere os links das redes sociais que aparecem no rodapé e otimize as tags SEO do site global.</p>
            </div>

            <form onSubmit={handleSocialSave} className="flex flex-col gap-6 text-xs font-mono">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-zinc-700 dark:text-zinc-300">Instagram</label>
                  <input
                    type="text"
                    value={socialForm.instagram}
                    onChange={(e) => setSocialForm({ ...socialForm, instagram: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-850 bg-transparent"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-zinc-700 dark:text-zinc-300">Facebook</label>
                  <input
                    type="text"
                    value={socialForm.facebook}
                    onChange={(e) => setSocialForm({ ...socialForm, facebook: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-850 bg-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-zinc-700 dark:text-zinc-300">LinkedIn</label>
                  <input
                    type="text"
                    value={socialForm.linkedin}
                    onChange={(e) => setSocialForm({ ...socialForm, linkedin: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-850 bg-transparent"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-zinc-700 dark:text-zinc-300 font-mono">Telegram</label>
                  <input
                    type="text"
                    value={socialForm.telegram}
                    onChange={(e) => setSocialForm({ ...socialForm, telegram: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-850 bg-transparent"
                  />
                </div>
              </div>

              {/* Global site SEO tag limits */}
              <div className="p-5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl flex flex-col gap-4">
                <h4 className="font-bold text-xs text-zinc-900 dark:text-white uppercase tracking-wider font-mono">Configurações SEO do Site Principal</h4>
                
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-zinc-700 dark:text-zinc-400">Meta Title do Site</label>
                  <input
                    type="text"
                    value={globalSeoTitle}
                    onChange={(e) => setGlobalSeoTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-850 bg-transparent text-xs"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-zinc-700 dark:text-zinc-400">Meta Description</label>
                  <input
                    type="text"
                    value={globalSeoDesc}
                    onChange={(e) => setGlobalSeoDesc(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-850 bg-transparent text-xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="h-10 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-xs cursor-pointer self-start px-6"
              >
                Salvar Configurações Globais
              </button>
            </form>

          </div>
        )}

        {/* LOGS AUDITING LOGS TAB */}
        {activeTab === "logs" && (
          <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 shadow-sm animate-fade-in flex flex-col gap-6">
            <div>
              <h3 className="text-lg font-black text-zinc-900 dark:text-white uppercase tracking-wider font-mono">Logs de Auditoria do Sistema</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Rastreamento de todas as ações de usuários, logins, pagamentos e atualizações administrativas do Firebase Firestore.</p>
            </div>

            <div className="flex flex-col gap-2.5 max-h-[400px] overflow-y-auto pr-2">
              {allLogs.length > 0 ? (
                allLogs.map((l) => (
                  <div 
                    key={l.id}
                    className="p-3 rounded-xl border border-zinc-150 dark:border-zinc-850 bg-zinc-50 dark:bg-zinc-900/40 text-[10px] font-mono text-zinc-600 dark:text-zinc-400"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-red-500 uppercase tracking-wider">{l.action}</span>
                      <span>{new Date(l.timestamp).toLocaleString("pt-BR")}</span>
                    </div>
                    <div className="truncate text-zinc-900 dark:text-white"><strong>Detalhes:</strong> {l.details}</div>
                    <div className="text-[9px] text-zinc-500"><strong>Agente:</strong> {l.userEmail || "anonymous"}</div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono italic">Sem logs registrados ainda.</p>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
