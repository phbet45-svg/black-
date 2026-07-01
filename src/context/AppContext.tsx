import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  User as FirebaseUser
} from "firebase/auth";
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  getDocs, 
  addDoc, 
  onSnapshot,
  query,
  orderBy,
  limit
} from "firebase/firestore";
import { auth, db, handleFirestoreError, OperationType } from "../firebase";
import { 
  UserProfile, 
  Plan, 
  SocialLinks, 
  AITool, 
  SystemLog, 
  BlogPost 
} from "../types";

interface AppContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  plans: Plan[];
  socials: SocialLinks;
  tools: AITool[];
  blogPosts: BlogPost[];
  theme: "dark" | "light";
  loading: boolean;
  introFinished: boolean;
  activeView: string;
  selectedPlanId: string | null;
  setIntroFinished: (finished: boolean) => void;
  setActiveView: (view: string) => void;
  setSelectedPlanId: (planId: string | null) => void;
  toggleTheme: () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, phone?: string, requestedPlanId?: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  addSystemLog: (action: string, details: string) => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  updateSocials: (newSocials: SocialLinks) => Promise<void>;
  updatePlans: (newPlans: Plan[]) => Promise<void>;
  updateTools: (newTools: AITool[]) => Promise<void>;
  refreshBlogPosts: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Default plans
const DEFAULT_PLANS: Plan[] = [
  {
    id: "basic",
    name: "Plano Básico",
    price: 39.90,
    description: "Acesso essencial para criadores iniciantes",
    textLimit: 100,
    imageLimit: 50,
    musicLimit: 20,
    videoLimit: 10,
    storageGB: 1,
    features: ["Até 100 textos por mês", "Até 50 imagens por mês", "Até 20 músicas por mês", "Até 10 vídeos por mês", "1 GB de armazenamento", "Suporte padrão"]
  },
  {
    id: "medium",
    name: "Plano Médio",
    price: 79.90,
    description: "Melhor custo-benefício para profissionais",
    textLimit: 1000,
    imageLimit: 200,
    musicLimit: 100,
    videoLimit: 50,
    storageGB: 20,
    features: ["Até 1000 textos por mês", "Até 200 imagens por mês", "Até 100 músicas por mês", "Até 50 vídeos por mês", "20 GB de armazenamento", "Prioridade média de processamento", "Suporte prioritário"]
  },
  {
    id: "premium",
    name: "Plano Premium",
    price: 149.90,
    description: "Uso praticamente ilimitado com máxima velocidade",
    textLimit: 99999,
    imageLimit: 99999,
    musicLimit: 99999,
    videoLimit: 99999,
    storageGB: 100,
    features: ["Acesso ilimitado a textos", "Acesso ilimitado a imagens", "Acesso ilimitado a músicas", "Acesso ilimitado a vídeos", "100 GB de armazenamento", "Máxima prioridade", "Suporte VIP 24/7", "Acesso antecipado a novas ferramentas"]
  }
];

// Default tools
const DEFAULT_TOOLS: AITool[] = [
  { id: "chat", name: "Chat IA", description: "Chatbot inteligente de uso geral para responder perguntas e criar rascunhos.", category: "text", status: "free", icon: "MessageSquare" },
  { id: "text-gen", name: "Gerador de Texto", description: "Gere artigos completos, redações e conteúdos estruturados de alta qualidade.", category: "text", status: "free", icon: "FileText" },
  { id: "translator", name: "Tradutor Ultra", description: "Traduza textos preservando o contexto e a linguagem natural.", category: "text", status: "free", icon: "Languages" },
  { id: "spelling", name: "Correção de Texto", description: "Corrija gramática, estilo e pontuação de forma impecável.", category: "text", status: "free", icon: "CheckSquare" },
  { id: "ads-creator", name: "Criador de Anúncios", description: "Gere textos persuasivos de alta conversão para Facebook, Google e Instagram Ads.", category: "business", status: "premium", icon: "Megaphone" },
  { id: "post-creator", name: "Criador de Posts", description: "Ideias e textos prontos para publicações no Instagram, LinkedIn e Twitter.", category: "business", status: "free", icon: "Share2" },
  { id: "scripts", name: "Criador de Roteiros", description: "Desenvolva roteiros cativantes para YouTube, TikTok e Reels.", category: "media", status: "premium", icon: "Clapperboard" },
  { id: "code-gen", name: "Gerador de Código", description: "Escreva códigos funcionais e comente sintaxes em mais de 15 linguagens.", category: "dev", status: "premium", icon: "Code" },
  { id: "summarizer", name: "Resumos Express", description: "Resuma longos textos ou livros em pontos-chave essenciais.", category: "text", status: "free", icon: "FileDown" },
  { id: "seo", name: "SEO Optimizer", description: "Melhore o ranqueamento dos seus artigos com títulos, keywords e descrições otimizados.", category: "business", status: "premium", icon: "Search" },
  { id: "ideas", name: "Ideias de Conteúdo", description: "Nunca mais sofra de bloqueio criativo com sugestões infinitas de temas.", category: "text", status: "free", icon: "Lightbulb" },
  { id: "emails", name: "Criador de Emails", description: "Gere campanhas de e-mail marketing completas e newsletters atrativas.", category: "business", status: "premium", icon: "Mail" },
  { id: "copywriter", name: "Copywriting de Elite", description: "Fórmulas clássicas de copy (AIDA, PAS) prontas para vender seu produto.", category: "business", status: "premium", icon: "PenTool" },
  { id: "assistant", name: "Assistente Empresarial", description: "Seu consultor virtual para estratégias, negócios e finanças.", category: "business", status: "premium", icon: "Briefcase" },
  { id: "image-gen", name: "Gerador de Imagens", description: "Transforme descrições de texto em imagens digitais de tirar o fôlego.", category: "media", status: "premium", icon: "Image" },
  { id: "music-gen", name: "Gerador de Música", description: "Crie loops, ritmos e trilhas sonoras autorais a partir de texto.", category: "media", status: "premium", icon: "Music" },
  { id: "video-gen", name: "Gerador de Vídeo", description: "Transforme ideias em videoclipes curtos com IA generativa de movimento.", category: "media", status: "premium", icon: "Video" },
  { id: "subtitle", name: "Legenda Automática", description: "Transcreva falas e gere arquivos de legenda .SRT para vídeos.", category: "media", status: "premium", icon: "Type" },
  { id: "narrator", name: "Narrador IA", description: "Gere locuções profissionais com vozes ultra-realistas em português.", category: "media", status: "premium", icon: "Volume2" }
];

// Default social networks
const DEFAULT_SOCIALS: SocialLinks = {
  instagram: "https://instagram.com/blackhat_ai",
  facebook: "https://facebook.com/blackhat_ai",
  tiktok: "https://tiktok.com/@blackhat_ai",
  youtube: "https://youtube.com/blackhat_ai",
  linkedin: "https://linkedin.com/company/blackhat-ai",
  discord: "https://discord.gg/blackhat_ai",
  telegram: "https://t.me/blackhat_ai",
  whatsapp: "https://wa.me/5584997033152",
  x: "https://x.com/blackhat_ai",
  website: "https://blackhat.ai"
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [plans, setPlans] = useState<Plan[]>(DEFAULT_PLANS);
  const [socials, setSocials] = useState<SocialLinks>(DEFAULT_SOCIALS);
  const [tools, setTools] = useState<AITool[]>(DEFAULT_TOOLS);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [loading, setLoading] = useState<boolean>(true);
  const [introFinished, setIntroFinished] = useState<boolean>(false);
  const [activeView, setActiveView] = useState<string>("landing");
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  // Toggle Theme
  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("backhat_theme", nextTheme);
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem("backhat_theme") as "dark" | "light";
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      setTheme("dark");
    }
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  // Load configuration from firestore (plans, tools, socials, blog posts)
  useEffect(() => {
    // 1. Listen for Plans
    const plansRef = doc(db, "settings", "plans");
    const unsubscribePlans = onSnapshot(plansRef, (snapshot) => {
      if (snapshot.exists()) {
        setPlans(snapshot.data().plans || DEFAULT_PLANS);
      } else {
        // Seed default plans
        setDoc(plansRef, { plans: DEFAULT_PLANS }).catch((err) => {
          handleFirestoreError(err, OperationType.WRITE, "settings/plans");
        });
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, "settings/plans");
    });

    // 2. Listen for Socials
    const socialsRef = doc(db, "settings", "socials");
    const unsubscribeSocials = onSnapshot(socialsRef, (snapshot) => {
      if (snapshot.exists()) {
        setSocials(snapshot.data() as SocialLinks);
      } else {
        setDoc(socialsRef, DEFAULT_SOCIALS).catch((err) => {
          handleFirestoreError(err, OperationType.WRITE, "settings/socials");
        });
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, "settings/socials");
    });

    // 3. Listen for Tools
    const toolsRef = doc(db, "settings", "tools");
    const unsubscribeTools = onSnapshot(toolsRef, (snapshot) => {
      if (snapshot.exists()) {
        setTools(snapshot.data().tools || DEFAULT_TOOLS);
      } else {
        setDoc(toolsRef, { tools: DEFAULT_TOOLS }).catch((err) => {
          handleFirestoreError(err, OperationType.WRITE, "settings/tools");
        });
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, "settings/tools");
    });

    // 4. Load Blog Posts
    const blogQuery = query(collection(db, "blog"), orderBy("createdAt", "desc"));
    const unsubscribeBlog = onSnapshot(blogQuery, (snapshot) => {
      const posts: BlogPost[] = [];
      snapshot.forEach((docSnap) => {
        posts.push({ id: docSnap.id, ...docSnap.data() } as BlogPost);
      });
      setBlogPosts(posts);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, "blog");
    });

    return () => {
      unsubscribePlans();
      unsubscribeSocials();
      unsubscribeTools();
      unsubscribeBlog();
    };
  }, []);

  // Sync Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        setUser(firebaseUser);
        // Load User Profile from Firestore
        const userDocRef = doc(db, "users", firebaseUser.uid);
        
        // Listen to profile updates real-time
        const unsubscribeProfile = onSnapshot(userDocRef, async (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as UserProfile;
            
            // Administrative check bypass
            if (firebaseUser.email === "blackhat@x.com") {
              if (data.role !== "admin" || data.isBlocked) {
                try {
                  await updateDoc(userDocRef, { role: "admin", isBlocked: false });
                } catch (err) {
                  handleFirestoreError(err, OperationType.UPDATE, `users/${firebaseUser.uid}`);
                }
              }
            }
            
            setProfile(data);
          } else {
            // Profile does not exist yet (e.g. signup in progress or manual database discrepancy)
            const isDefaultAdmin = firebaseUser.email === "blackhat@x.com";
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || "",
              displayName: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User",
              role: isDefaultAdmin ? "admin" : "user",
              planId: isDefaultAdmin ? "premium" : "basic",
              isBlocked: false,
              credits: 100,
              dailyLimit: 20,
              monthlyLimit: 100,
              storageLimitGB: 1,
              textCount: 0,
              imageCount: 0,
              musicCount: 0,
              videoCount: 0,
              storageUsedMB: 0,
              createdAt: new Date().toISOString()
            };
            try {
              await setDoc(userDocRef, newProfile);
            } catch (err) {
              handleFirestoreError(err, OperationType.WRITE, `users/${firebaseUser.uid}`);
            }
            setProfile(newProfile);
          }
          setLoading(false);
        }, (err) => {
          handleFirestoreError(err, OperationType.GET, `users/${firebaseUser.uid}`);
        });

        return () => unsubscribeProfile();
      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // System Logs Recorder
  const addSystemLog = async (action: string, details: string) => {
    try {
      const logData: Omit<SystemLog, "id"> = {
        userId: user?.uid || "anonymous",
        userEmail: user?.email || "anonymous",
        action,
        timestamp: new Date().toISOString(),
        details
      };
      await addDoc(collection(db, "logs"), logData);
    } catch (err) {
      console.error("Failed to write system log:", err);
      try {
        handleFirestoreError(err, OperationType.CREATE, "logs");
      } catch (logErr) {
        // Avoid throwing from background logger to prevent infinite loops
      }
    }
  };

  // Helper login
  const login = async (email: string, password: string) => {
    // Check for administrative bypass first to set up admin dynamically
    if (email === "blackhat@x.com" && password === "blackhat4321") {
      try {
        await signInWithEmailAndPassword(auth, email, password);
        await addSystemLog("LOGIN", "Administrador logou no sistema.");
        return;
      } catch (err: any) {
        if (err.code === "auth/user-not-found" || err.code === "auth/invalid-credential") {
          // Pre-register admin automatically
          await createUserWithEmailAndPassword(auth, email, password);
          await addSystemLog("SETUP", "Conta administradora criada automaticamente no primeiro login.");
          return;
        }
        throw err;
      }
    }

    await signInWithEmailAndPassword(auth, email, password);
    await addSystemLog("LOGIN", `Usuário logou: ${email}`);
  };

  // Helper register
  const register = async (email: string, password: string, name: string, phone?: string, requestedPlanId?: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const newProfile: UserProfile = {
      uid: userCredential.user.uid,
      email,
      displayName: name,
      role: "user",
      planId: "basic",
      isBlocked: false,
      credits: 50, // Initial free trial credits
      dailyLimit: 10,
      monthlyLimit: 50,
      storageLimitGB: 1,
      textCount: 0,
      imageCount: 0,
      musicCount: 0,
      videoCount: 0,
      storageUsedMB: 0,
      phone,
      requestedPlanId,
      createdAt: new Date().toISOString()
    };
    await setDoc(doc(db, "users", userCredential.user.uid), newProfile);
    await addSystemLog("SIGNUP", `Novo usuário registrado: ${email} (Plano solicitado: ${requestedPlanId || "Nenhum"})`);
  };

  const logout = async () => {
    if (user?.email) {
      await addSystemLog("LOGOUT", `Usuário deslogou: ${user.email}`);
    }
    await signOut(auth);
    setActiveView("landing");
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
    await addSystemLog("RESET_PASSWORD_REQUEST", `Solicitação de senha para: ${email}`);
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!user) throw new Error("Sem usuário autenticado.");
    await updateDoc(doc(db, "users", user.uid), updates);
    await addSystemLog("UPDATE_PROFILE", `Perfil atualizado: ${JSON.stringify(updates)}`);
  };

  const updateSocials = async (newSocials: SocialLinks) => {
    await setDoc(doc(db, "settings", "socials"), newSocials);
    await addSystemLog("UPDATE_SOCIALS", "Redes sociais globais atualizadas pelo admin.");
  };

  const updatePlans = async (newPlans: Plan[]) => {
    await setDoc(doc(db, "settings", "plans"), { plans: newPlans });
    await addSystemLog("UPDATE_PLANS", "Planos de assinatura atualizados pelo admin.");
  };

  const updateTools = async (newTools: AITool[]) => {
    await setDoc(doc(db, "settings", "tools"), { tools: newTools });
    await addSystemLog("UPDATE_TOOLS", "Status das ferramentas de IA atualizados pelo admin.");
  };

  const refreshBlogPosts = () => {
    // Automatically updated through real-time Firestore listeners
  };

  return (
    <AppContext.Provider
      value={{
        user,
        profile,
        plans,
        socials,
        tools,
        blogPosts,
        theme,
        loading,
        introFinished,
        activeView,
        selectedPlanId,
        setIntroFinished,
        setActiveView,
        setSelectedPlanId,
        toggleTheme,
        login,
        register,
        logout,
        resetPassword,
        addSystemLog,
        updateUserProfile,
        updateSocials,
        updatePlans,
        updateTools,
        refreshBlogPosts
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp deve ser usado dentro de um AppProvider");
  }
  return context;
};
