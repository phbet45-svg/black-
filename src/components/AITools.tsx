import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { doc, updateDoc, increment } from "firebase/firestore";
import { db } from "../firebase";
import { AITool } from "../types";
import { 
  MessageSquare, FileText, Languages, CheckSquare, Megaphone, 
  Share2, Clapperboard, Code, FileDown, Search, Lightbulb, 
  Mail, PenTool, Briefcase, Image as ImageIcon, Music, Video, 
  Type, Volume2, Sparkles, AlertTriangle, ArrowRight, Play, 
  Pause, RefreshCw, Copy, Check, Download, Send, ChevronLeft, Upload
} from "lucide-react";

// Helper to render lucide icon dynamically
const getIcon = (name: string, className = "w-5 h-5") => {
  switch (name) {
    case "MessageSquare": return <MessageSquare className={className} />;
    case "FileText": return <FileText className={className} />;
    case "Languages": return <Languages className={className} />;
    case "CheckSquare": return <CheckSquare className={className} />;
    case "Megaphone": return <Megaphone className={className} />;
    case "Share2": return <Share2 className={className} />;
    case "Clapperboard": return <Clapperboard className={className} />;
    case "Code": return <Code className={className} />;
    case "FileDown": return <FileDown className={className} />;
    case "Search": return <Search className={className} />;
    case "Lightbulb": return <Lightbulb className={className} />;
    case "Mail": return <Mail className={className} />;
    case "PenTool": return <PenTool className={className} />;
    case "Briefcase": return <Briefcase className={className} />;
    case "Image": return <ImageIcon className={className} />;
    case "Music": return <Music className={className} />;
    case "Video": return <Video className={className} />;
    case "Type": return <Type className={className} />;
    case "Volume2": return <Volume2 className={className} />;
    default: return <Sparkles className={className} />;
  }
};

export default function AITools() {
  const { tools, profile, user, addSystemLog } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [activeTool, setActiveTool] = useState<AITool | null>(null);

  // Form states
  const [promptInput, setPromptInput] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Media Specific States
  const [generatedImg, setGeneratedImg] = useState<string | null>(null);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [mediaStyle, setMediaStyle] = useState("cinematic");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Video Generation Specific States
  const [videoDuration, setVideoDuration] = useState<number>(10);
  const [videoVoice, setVideoVoice] = useState<string>("pt-BR-FranciscaNeural");
  const [videoBackgroundMusic, setVideoBackgroundMusic] = useState<string>("none");
  const [videoProjectId, setVideoProjectId] = useState<string | null>(null);
  const [videoStatus, setVideoStatus] = useState<string>("idle"); // idle, rendering, completed, failed
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoPolling, setVideoPolling] = useState<boolean>(false);
  const [generatedJsonView, setGeneratedJsonView] = useState<any>(null);

  // Poll video status
  React.useEffect(() => {
    let intervalId: any;
    if (videoPolling && videoProjectId) {
      intervalId = setInterval(async () => {
        try {
          const res = await fetch(`/api/video-gen?projectId=${videoProjectId}`);
          if (res.ok) {
            const data = await res.json();
            console.log("[BLACKHAT Video Poll] API Response Data:", data);
            
            // Check status in various possible formats
            const status = data.movie?.status || data.project?.status || data.status;
            const url = data.movie?.url || data.project?.url || data.url;

            if (status === "completed" || status === "done" || status === "success" || url) {
              setVideoStatus("completed");
              setVideoUrl(url);
              setVideoPolling(false);
              await updateUsageCounts();
              await addSystemLog("AI_GENERATE", `Vídeo renderizado com sucesso via JSON2Video.`);
            } else if (status === "failed" || status === "error") {
              setVideoStatus("failed");
              setVideoPolling(false);
            } else {
              setVideoStatus("rendering");
            }
          }
        } catch (err) {
          console.error("Error polling video status:", err);
        }
      }, 5000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [videoPolling, videoProjectId]);

  // Simple HTML sanitizer/parser for prompt response
  const formatMarkdownResponse = (text: string) => {
    if (!text) return "";
    
    // Convert headers
    let formatted = text
      .replace(/^### (.*$)/gim, '<h4 class="text-sm font-bold mt-4 mb-2 text-zinc-900 dark:text-white">$1</h4>')
      .replace(/^## (.*$)/gim, '<h3 class="text-base font-extrabold mt-5 mb-2.5 text-zinc-900 dark:text-white">$1</h3>')
      .replace(/^# (.*$)/gim, '<h2 class="text-lg font-black mt-6 mb-3 text-zinc-900 dark:text-white">$1</h2>');
    
    // Convert bold
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-zinc-900 dark:text-white">$1</strong>');
    
    // Convert list items
    formatted = formatted.replace(/^\* (.*$)/gim, '<li class="ml-4 list-disc text-xs text-zinc-700 dark:text-zinc-300">$1</li>');
    formatted = formatted.replace(/^- (.*$)/gim, '<li class="ml-4 list-disc text-xs text-zinc-700 dark:text-zinc-300">$1</li>');
    
    // Convert code blocks
    formatted = formatted.replace(/```([\s\S]*?)```/g, '<pre class="bg-zinc-950 text-emerald-400 p-4 rounded-lg my-4 overflow-x-auto text-xs font-mono border border-zinc-850">$1</pre>');
    
    // Convert single code lines
    formatted = formatted.replace(/`(.*?)`/g, '<code class="bg-zinc-100 dark:bg-zinc-900 px-1.5 py-0.5 rounded text-xs font-mono text-red-500">$1</code>');
    
    // Wrap paragraph breaks
    formatted = formatted.split("\n\n").map(p => {
      if (p.startsWith("<li") || p.startsWith("<pre") || p.startsWith("<h")) return p;
      return `<p class="mb-3 leading-relaxed">${p}</p>`;
    }).join("");

    return formatted;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(aiResponse);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  // Check limits
  const hasLimitRemaining = (): boolean => {
    if (!profile) return false;
    if (profile.role === "admin") return true; // Admins have unlimited access

    // Check credits
    if (profile.credits <= 0) return false;

    // Check plan specific counts
    const isBasic = profile.planId === "basic";
    const isMedium = profile.planId === "medium";
    
    if (activeTool?.category === "text") {
      const limit = isBasic ? 100 : isMedium ? 1000 : 999999;
      return profile.textCount < limit;
    } else if (activeTool?.id === "image-gen") {
      const limit = isBasic ? 50 : isMedium ? 200 : 999999;
      return profile.imageCount < limit;
    } else if (activeTool?.id === "music-gen") {
      const limit = isBasic ? 20 : isMedium ? 100 : 999999;
      return profile.musicCount < limit;
    } else if (activeTool?.id === "video-gen") {
      const limit = isBasic ? 10 : isMedium ? 50 : 999999;
      return profile.videoCount < limit;
    }
    return true;
  };

  const updateUsageCounts = async () => {
    if (!user || !profile || profile.role === "admin") return;

    const userRef = doc(db, "users", user.uid);
    const updateData: any = {
      credits: increment(-1) // decrement credits
    };

    if (activeTool?.category === "text") {
      updateData.textCount = increment(1);
    } else if (activeTool?.id === "image-gen") {
      updateData.imageCount = increment(1);
    } else if (activeTool?.id === "music-gen") {
      updateData.musicCount = increment(1);
    } else if (activeTool?.id === "video-gen") {
      updateData.videoCount = increment(1);
    }

    await updateDoc(userRef, updateData);
  };

  // Generate handler
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTool || !promptInput.trim() || isGenerating) return;

    if (!hasLimitRemaining()) {
      alert("Você atingiu o limite mensal do seu plano ou não possui mais créditos. Faça o upgrade no painel para continuar utilizando!");
      return;
    }

    setIsGenerating(true);
    setAiResponse("");
    setGeneratedImg(null);

    // Stop audio if playing
    if (audioPlaying) {
      setAudioPlaying(false);
    }

    try {
      if (activeTool.id === "image-gen") {
        // Real-time AI Image generation logic using Pollinations AI (highly-detailed diffusion models)
        setTimeout(async () => {
          try {
            const themes: any = {
              cinematic: "cinematic ultra-detailed octane-render 8k dramatic-lighting sci-fi epic masterpiece",
              cyberpunk: "cyberpunk neon glow rainy night holographic city details cybernetic 4k",
              anime: "vibrant dynamic anime illustration Makoto Shinkai style gorgeous scenery",
              realistic: "award winning photography national geographic hyper-realistic detailed dslr photorealistic 8k"
            };
            
            const chosenTheme = themes[mediaStyle] || themes.cinematic;
            const enhancedPrompt = `${promptInput}, ${chosenTheme}`;
            
            // Build real-time pollinations url with random seed to guarantee a fresh unique image every generation
            const seed = Math.floor(Math.random() * 999999);
            const imageGenUrl = `https://image.pollinations.ai/p/${encodeURIComponent(enhancedPrompt)}?width=1024&height=1024&nologo=true&seed=${seed}`;
            
            setGeneratedImg(imageGenUrl);
            setAiResponse(`### Imagem Gerada com Sucesso!\n\n**Estilo:** ${mediaStyle.toUpperCase()}\n**Prompt Original:** ${promptInput}\n\n*A imagem foi gerada com sucesso utilizando inteligência artificial de difusão de elite. Sinta-se à vontade para baixar o resultado ou copiar as especificações acima!*`);
            setIsGenerating(false);
            await updateUsageCounts();
            await addSystemLog("AI_GENERATE", `Imagem real gerada por IA com ferramenta ${activeTool.name}`);
          } catch (err: any) {
            console.error("Image generation failure: ", err);
            setAiResponse(`Erro ao gerar imagem: ${err.message || "Erro de conexão com o servidor de renderização."}`);
            setIsGenerating(false);
          }
        }, 3000);

      } else if (activeTool.id === "music-gen") {
        // Music generator audio synthesiser (HTML5 Web Audio API)
        setTimeout(async () => {
          // Play a soothing procedural synth tone
          setAiResponse(`Trilha sonora sintetizada com IA!\nNome: BLACKHAT Synth Loops\nRitmo: ${promptInput}`);
          setIsGenerating(false);
          await updateUsageCounts();
          await addSystemLog("AI_GENERATE", `Música gerada com ferramenta ${activeTool.name}`);
        }, 2500);

      } else if (activeTool.id === "narrator") {
        // AI Narrator - Browser speech synthesis!
        setIsGenerating(false);
        setAiResponse(`Narrando o texto: "${promptInput}"`);
        
        const utterance = new SpeechSynthesisUtterance(promptInput);
        utterance.lang = "pt-BR";
        utterance.rate = 0.95;
        window.speechSynthesis.speak(utterance);
        
        await updateUsageCounts();
        await addSystemLog("AI_GENERATE", `Narraçâo de áudio executada.`);

      } else if (activeTool.id === "subtitle") {
        // Uploaded transcription mock
        setTimeout(async () => {
          const trans = `[00:01] Olá a todos, bem-vindos ao futuro tecnológico.\n[00:03] Esta é uma gravação automática transcrita pela inteligência de elite da BLACKHAT AI.\n[00:06] Criptografia de ponta a ponta e inteligência avançada integradas em um só lugar.`;
          setAiResponse(trans);
          setIsGenerating(false);
          await updateUsageCounts();
        }, 2000);

      } else if (activeTool.id === "video-gen") {
        const res = await fetch("/api/video-gen", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            prompt: promptInput,
            duration: videoDuration,
            style: mediaStyle,
            voice: videoVoice,
            backgroundMusic: videoBackgroundMusic
          })
        });

        if (!res.ok) {
          let errorMessage = "Erro ao solicitar geração de vídeo.";
          try {
            const errorText = await res.text();
            try {
              const errorData = JSON.parse(errorText);
              errorMessage = errorData.error || errorData.details || errorMessage;
            } catch {
              errorMessage = `Erro do servidor (${res.status}): ${errorText.substring(0, 150).replace(/<[^>]*>/g, '').trim()}`;
            }
          } catch {
            errorMessage = `Erro de conexão (${res.status})`;
          }
          throw new Error(errorMessage);
        }

        const data = await res.json();
        if (data.success && data.projectId) {
          setVideoProjectId(data.projectId);
          setVideoStatus("rendering");
          setGeneratedJsonView(data.generatedJson);
          setVideoPolling(true); // start polling status
          setAiResponse(`### Roteiro e Estrutura do Vídeo Iniciados!\n\nSeu vídeo profissional está sendo compilado e renderizado em tempo real nos servidores da JSON2Video.\n\n**ID do Projeto:** \`${data.projectId}\`\n\n*Acompanhe o progresso de renderização ao lado. O processo costuma demorar entre 15 e 60 segundos dependendo da duração e dos elementos gerados pela IA!*`);
        } else {
          throw new Error(data.error || "Não foi possível iniciar a renderização do vídeo.");
        }
        setIsGenerating(false);

      } else {
        // Text tool OpenRouter API Proxy call
        let systemPrompt = "Você é um assistente de inteligência artificial experiente e de alto desempenho chamado BLACKHAT AI. Responda em português de forma extremamente técnica, clara, polida e útil. Use formatação markdown.";
        
        if (activeTool.id === "code-gen") {
          systemPrompt = "Você é um Engenheiro de Software Sênior especialista em BLACKHAT AI. Forneça explicações extremamente eficientes, códigos limpos e funcionais com comentários explicativos.";
        } else if (activeTool.id === "copywriter") {
          systemPrompt = "Você é um Copywriter profissional altamente experiente. Use técnicas de escrita persuasiva como AIDA ou PAS para criar copies perfeitas de anúncios e conversão.";
        } else if (activeTool.id === "seo") {
          systemPrompt = "Você é um especialista em SEO de nível global. Gere títulos otimizados, meta descrições excelentes e tags de keywords para ranquear na primeira página do Google.";
        }

        const res = await fetch("/api/ai", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            prompt: promptInput,
            systemPrompt: systemPrompt,
            toolId: activeTool.id
          })
        });

        if (!res.ok) {
          let errorMessage = "Erro na requisição da API de IA.";
          try {
            const errorText = await res.text();
            try {
              const errorData = JSON.parse(errorText);
              errorMessage = errorData.error || errorData.details || errorMessage;
            } catch {
              // If it's HTML, extract a clean preview or show status
              errorMessage = `Erro do servidor (${res.status}): ${errorText.substring(0, 150).replace(/<[^>]*>/g, '').trim() || 'Resposta inválida'}`;
            }
          } catch {
            errorMessage = `Erro de conexão (${res.status})`;
          }
          throw new Error(errorMessage);
        }

        const data = await res.json();
        const content = data?.choices?.[0]?.message?.content || "Desculpe, ocorreu um erro ao gerar a resposta da IA.";
        
        setAiResponse(content);
        setIsGenerating(false);
        await updateUsageCounts();
        await addSystemLog("AI_GENERATE", `Texto gerado com ferramenta ${activeTool.name}`);
      }
    } catch (err: any) {
      console.error(err);
      setAiResponse(`Ocorreu um erro ao processar a inteligência artificial: ${err.message || "Verifique as configurações do servidor."}`);
      setIsGenerating(false);
    }
  };

  // Play synthetic music loops on user browser
  const playSaratogaMusic = () => {
    if (audioPlaying) {
      setAudioPlaying(false);
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(261.63, ctx.currentTime); // C4 note
      
      // Arpeggio sound loop
      oscillator.frequency.setValueAtTime(329.63, ctx.currentTime + 0.35); // E4
      oscillator.frequency.setValueAtTime(392.00, ctx.currentTime + 0.7); // G4
      oscillator.frequency.setValueAtTime(523.25, ctx.currentTime + 1.05); // C5
      
      gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.8);

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start();
      setAudioPlaying(true);
      setTimeout(() => setAudioPlaying(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  // Drag and drop subtitle triggers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setUploadedFile(e.dataTransfer.files[0]);
    }
  };

  // Filter tools list based on sidebar search category
  const filteredTools = tools.filter((t) => {
    if (selectedCategory === "all") return true;
    return t.category === selectedCategory;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mx-auto max-w-7xl px-6 py-8 animate-fade-in font-sans">
      
      {/* Tools Sidebar Navigation */}
      <div className="lg:col-span-1 flex flex-col gap-5">
        <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-white/5">
          <h3 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider mb-4 font-mono">Categorias</h3>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer ${
                selectedCategory === "all" 
                  ? "bg-cyan-500 text-black font-bold" 
                  : "hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-600 dark:text-slate-400"
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Todas as Ferramentas</span>
            </button>
            <button
              onClick={() => setSelectedCategory("text")}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer ${
                selectedCategory === "text" 
                  ? "bg-cyan-500 text-black font-bold" 
                  : "hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-600 dark:text-slate-400"
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Geração de Texto</span>
            </button>
            <button
              onClick={() => setSelectedCategory("media")}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer ${
                selectedCategory === "media" 
                  ? "bg-cyan-500 text-black font-bold" 
                  : "hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-600 dark:text-slate-400"
              }`}
            >
              <Music className="w-4 h-4" />
              <span>Áudio, Vídeo e Imagem</span>
            </button>
            <button
              onClick={() => setSelectedCategory("business")}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer ${
                selectedCategory === "business" 
                  ? "bg-cyan-500 text-black font-bold" 
                  : "hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-600 dark:text-slate-400"
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>Negócios e Marketing</span>
            </button>
            <button
              onClick={() => setSelectedCategory("dev")}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-colors cursor-pointer ${
                selectedCategory === "dev" 
                  ? "bg-cyan-500 text-black font-bold" 
                  : "hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-600 dark:text-slate-400"
              }`}
            >
              <Code className="w-4 h-4" />
              <span>Código e Dev</span>
            </button>
          </div>
        </div>

        {/* Dynamic usage metrics */}
        {profile && (
          <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-[#0a0a0b] border border-zinc-200 dark:border-white/5 text-xs font-mono text-zinc-500">
            <h4 className="text-[10px] font-bold text-zinc-900 dark:text-white uppercase tracking-wider mb-3">Seus Limites Mensais</h4>
            <div className="flex flex-col gap-3">
              <div>
                <div className="flex justify-between mb-1">
                  <span>Créditos:</span>
                  <span className="text-zinc-900 dark:text-white font-bold">{profile.credits} / {profile.monthlyLimit}</span>
                </div>
                <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-cyan-500 h-full" style={{ width: `${Math.min((profile.credits / profile.monthlyLimit) * 100, 100)}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span>Imagens IA:</span>
                  <span className="text-zinc-900 dark:text-white font-bold">{profile.imageCount} / {profile.planId === 'basic' ? 50 : profile.planId === 'medium' ? 200 : 'Ilimitado'}</span>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span>Trilhas Músicas:</span>
                  <span className="text-zinc-900 dark:text-white font-bold">{profile.musicCount} / {profile.planId === 'basic' ? 20 : profile.planId === 'medium' ? 100 : 'Ilimitado'}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tools Content Grid */}
      <div className="lg:col-span-3 flex flex-col gap-6">
        
        {activeTool ? (
          /* Active Tool Interface Workspace */
          <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-[#0a0a0b] border border-zinc-200 dark:border-white/5 shadow-xl shadow-cyan-500/5 flex flex-col gap-6 animate-fade-in relative">
            
            {/* Header Tool */}
            <div className="flex items-center justify-between border-b border-zinc-150 dark:border-white/5 pb-5">
              <button
                onClick={() => {
                  setActiveTool(null);
                  setAiResponse("");
                  setPromptInput("");
                  setGeneratedImg(null);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-cyan-400 uppercase cursor-pointer transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Voltar às ferramentas
              </button>

              <div className="flex items-center gap-2">
                {getIcon(activeTool.icon, "w-6 h-6 text-cyan-400")}
                <h2 className="text-lg font-black text-zinc-900 dark:text-white uppercase tracking-wider font-mono">{activeTool.name}</h2>
              </div>
            </div>

            {/* Tool Block status warning if user doesn't have privileges */}
            {activeTool.status === "premium" && profile?.planId === "basic" && profile?.role !== "admin" ? (
              <div className="p-6 bg-amber-50 dark:bg-amber-950/10 border border-amber-200 dark:border-amber-900/20 rounded-2xl flex flex-col items-center justify-center text-center gap-4 py-12">
                <AlertTriangle className="w-12 h-12 text-amber-500 animate-bounce" />
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase">Ferramenta Premium Bloqueada</h3>
                <p className="text-xs text-zinc-500 dark:text-slate-400 max-w-md">
                  Esta ferramenta está disponível apenas para membros dos planos <strong>Médio</strong> e <strong>Premium</strong>. Faça upgrade do seu plano para liberar acesso instantâneo a todos os recursos.
                </p>
              </div>
            ) : (
              /* Core Tool Form */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Form Controls Column */}
                <form onSubmit={handleGenerate} className="flex flex-col gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-zinc-700 dark:text-slate-300">Prompt ou Instruções da IA</label>
                    <textarea
                      required
                      rows={5}
                      value={promptInput}
                      onChange={(e) => setPromptInput(e.target.value)}
                      placeholder={
                        activeTool.id === "image-gen" ? "Ex: Um astronauta andando a cavalo na lua, estilo realista 3d..." :
                        activeTool.id === "video-gen" ? "Ex: Crie um vídeo de 15 segundos promovendo um novo hambúrguer artesanal, com foco em ingredientes frescos e queijo derretido..." :
                        activeTool.id === "code-gen" ? "Ex: Escreva um script em Express para conectar no MongoDB..." :
                        "Escreva suas instruções completas para a inteligência artificial..."
                      }
                      className="w-full px-4 py-3 rounded-2xl border border-zinc-200 dark:border-white/10 bg-transparent text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 resize-none font-sans"
                    />
                  </div>

                  {/* Media options */}
                  {activeTool.id === "image-gen" && (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-zinc-700 dark:text-slate-300">Estilo Artístico</label>
                      <select
                        value={mediaStyle}
                        onChange={(e) => setMediaStyle(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-white/10 bg-transparent text-xs text-zinc-850 dark:text-slate-300 focus:outline-none"
                      >
                        <option value="cinematic">Cinemático 8K</option>
                        <option value="cyberpunk">Cyberpunk Neon</option>
                        <option value="anime">Anime Fantasia</option>
                        <option value="realistic">Foto Realista</option>
                      </select>
                    </div>
                  )}

                  {activeTool.id === "video-gen" && (
                    <div className="flex flex-col gap-4 bg-zinc-50 dark:bg-zinc-900/30 p-4 border border-zinc-150 dark:border-white/5 rounded-2xl">
                      <h4 className="text-xs font-black uppercase text-zinc-900 dark:text-cyan-400 font-mono tracking-wider">Configuração do Vídeo</h4>
                      
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-zinc-700 dark:text-slate-300 uppercase font-mono">Duração Estimada</label>
                        <select
                          value={videoDuration}
                          onChange={(e) => setVideoDuration(Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-white/10 bg-transparent text-xs text-zinc-850 dark:text-slate-300 focus:outline-none bg-zinc-100 dark:bg-zinc-950"
                        >
                          <option value={5}>5 Segundos (Curto/Ad)</option>
                          <option value={10}>10 Segundos (Padrão)</option>
                          <option value={15}>15 Segundos (Reel/Story)</option>
                          <option value={30}>30 Segundos (Completo)</option>
                        </select>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-zinc-700 dark:text-slate-300 uppercase font-mono">Voz da Narração (TTS)</label>
                        <select
                          value={videoVoice}
                          onChange={(e) => setVideoVoice(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-white/10 bg-transparent text-xs text-zinc-850 dark:text-slate-300 focus:outline-none bg-zinc-100 dark:bg-zinc-950"
                        >
                          <option value="pt-BR-FranciscaNeural">Português BR - Francisca (Feminina)</option>
                          <option value="pt-BR-AntonioNeural">Português BR - Antonio (Masculina)</option>
                          <option value="en-US-JennyNeural">Inglês US - Jenny (Feminina)</option>
                          <option value="en-US-GuyNeural">Inglês US - Guy (Masculina)</option>
                        </select>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-zinc-700 dark:text-slate-300 uppercase font-mono">Estilo Visual</label>
                        <select
                          value={mediaStyle}
                          onChange={(e) => setMediaStyle(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-white/10 bg-transparent text-xs text-zinc-850 dark:text-slate-300 focus:outline-none bg-zinc-100 dark:bg-zinc-950"
                        >
                          <option value="cinematic">Cinemático 3D</option>
                          <option value="cyberpunk">Cyberpunk Néon</option>
                          <option value="anime">Anime Animado</option>
                          <option value="realistic">Realista Fotorrealismo</option>
                        </select>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-zinc-700 dark:text-slate-300 uppercase font-mono">Trilha de Fundo</label>
                        <select
                          value={videoBackgroundMusic}
                          onChange={(e) => setVideoBackgroundMusic(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-white/10 bg-transparent text-xs text-zinc-850 dark:text-slate-300 focus:outline-none bg-zinc-100 dark:bg-zinc-950"
                        >
                          <option value="none">Nenhuma (Apenas Narração)</option>
                          <option value="corporate">Corporativa / Negócios</option>
                          <option value="electronic">Eletrônica / Futurista</option>
                          <option value="cinematic">Cinematográfica / Épica</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Subtitle upload dropzone */}
                  {activeTool.id === "subtitle" && (
                    <div 
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                        dragActive 
                          ? "border-cyan-500 bg-cyan-500/10" 
                          : "border-zinc-200 dark:border-white/5 hover:border-cyan-500/20"
                      }`}
                    >
                      <Upload className="w-8 h-8 text-zinc-400 mx-auto mb-2 animate-bounce" />
                      <p className="text-xs font-bold text-zinc-900 dark:text-white">Arraste e solte o arquivo de áudio</p>
                      <p className="text-[10px] text-zinc-500 dark:text-slate-400 mt-1">Formatos suportados: .MP3, .WAV (Máx 25MB)</p>
                      {uploadedFile && (
                        <span className="inline-block mt-3 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 px-3 py-1 rounded text-[10px] font-bold">
                          ✓ {uploadedFile.name}
                        </span>
                      )}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isGenerating}
                    className="w-full h-11 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:bg-zinc-800 text-white rounded-xl font-bold text-sm shadow-[0_0_15px_rgba(6,182,212,0.2)] flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="w-4.5 h-4.5 animate-spin" />
                        <span>Sintetizando IA...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4.5 h-4.5" />
                        <span>{activeTool.id === "narrator" ? "Narrar Texto" : "Gerar com IA"}</span>
                      </>
                    )}
                  </button>
                </form>

                {/* AI Response Display Column */}
                <div className="flex flex-col gap-4 bg-zinc-50 dark:bg-black/40 border border-zinc-150 dark:border-white/5 rounded-2xl p-5 relative overflow-hidden">
                  <div className="flex items-center justify-between border-b border-zinc-200 dark:border-white/5 pb-3 mb-2">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono">Resultado Gerado</span>
                    {aiResponse && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleCopy}
                          className="p-1.5 rounded bg-white hover:bg-zinc-150 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-850 text-zinc-500 hover:text-zinc-800 dark:hover:text-white transition-colors cursor-pointer"
                          title="Copiar resultado"
                        >
                          {copySuccess ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Generated Image rendering */}
                  {generatedImg && (
                    <div className="flex flex-col gap-3">
                      <img
                        src={generatedImg}
                        alt="Resultado de IA"
                        className="w-full aspect-square object-cover rounded-xl shadow-md border border-zinc-200 dark:border-zinc-800"
                        referrerPolicy="no-referrer"
                      />
                      <a
                        href={generatedImg}
                        download="BLACKHAT_AI_Image.jpg"
                        target="_blank"
                        rel="noreferrer"
                        className="self-start inline-flex items-center gap-1.5 text-[10px] font-bold text-zinc-600 dark:text-zinc-400 bg-white hover:bg-zinc-150 dark:bg-zinc-900 dark:hover:bg-zinc-850 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow"
                      >
                        <Download className="w-3.5 h-3.5" /> Baixar Imagem HD
                      </a>
                    </div>
                  )}

                  {/* Synthetic Audio generator buttons */}
                  {activeTool.id === "music-gen" && aiResponse && (
                    <div className="p-4 bg-zinc-100 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center gap-4">
                      <button
                        onClick={playSaratogaMusic}
                        className="p-3.5 rounded-full bg-cyan-500 hover:bg-cyan-400 text-black shadow shadow-cyan-500/25 transition-all cursor-pointer"
                      >
                        {audioPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-black" />}
                      </button>
                      <div>
                        <h4 className="text-xs font-bold text-zinc-900 dark:text-white font-mono">Loop Sintético IA.mid</h4>
                        <p className="text-[9px] text-zinc-500">Sintetizador Web Audio executando frequências senoidais.</p>
                      </div>
                    </div>
                  )}

                  {/* Video Generator Visual Workspace */}
                  {activeTool.id === "video-gen" && (
                    <div className="flex flex-col gap-4">
                      {/* Video status is rendering */}
                      {videoStatus === "rendering" && (
                        <div className="p-5 bg-cyan-950/15 border border-cyan-500/20 rounded-2xl flex flex-col items-center justify-center text-center gap-3 py-8 animate-pulse">
                          <RefreshCw className="w-10 h-10 text-cyan-400 animate-spin" />
                          <h4 className="text-xs font-black text-cyan-400 uppercase font-mono tracking-wider">Renderizando Vídeo na Nuvem...</h4>
                          <p className="text-[10px] text-zinc-500 dark:text-slate-400 max-w-xs leading-relaxed">
                            Aguarde. Nossa inteligência artificial está gerando as cenas, as vozes neurais e aplicando as trilhas sonoras especificadas.
                          </p>
                          <div className="w-full bg-zinc-850 h-1.5 rounded-full overflow-hidden mt-2">
                            <div className="bg-cyan-500 h-full rounded-full animate-pulse" style={{ width: "70%" }}></div>
                          </div>
                        </div>
                      )}

                      {/* Video status is completed */}
                      {videoStatus === "completed" && videoUrl && (
                        <div className="flex flex-col gap-3">
                          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2.5 text-emerald-500 text-[10px] font-bold uppercase font-mono">
                            <Check className="w-4.5 h-4.5" />
                            <span>Vídeo renderizado com sucesso!</span>
                          </div>
                          
                          <video
                            src={videoUrl}
                            controls
                            className="w-full rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800"
                          />

                          <div className="flex gap-2">
                            <a
                              href={videoUrl}
                              download="BLACKHAT_AI_Video.mp4"
                              target="_blank"
                              rel="noreferrer"
                              className="flex-1 inline-flex items-center justify-center gap-1.5 text-[10px] font-bold text-black bg-cyan-400 hover:bg-cyan-300 px-4 py-2.5 rounded-xl shadow-lg shadow-cyan-400/10 transition-all uppercase tracking-wider font-mono cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5" /> Baixar Vídeo MP4
                            </a>
                          </div>
                        </div>
                      )}

                      {/* Video status is failed */}
                      {videoStatus === "failed" && (
                        <div className="p-5 bg-red-500/10 border border-red-500/20 rounded-2xl flex flex-col items-center justify-center text-center gap-2 py-8">
                          <AlertTriangle className="w-10 h-10 text-red-500 animate-bounce" />
                          <h4 className="text-xs font-black text-red-500 uppercase font-mono tracking-wider">Falha na Renderização</h4>
                          <p className="text-[10px] text-zinc-500 dark:text-slate-400 max-w-xs leading-relaxed">
                            Ocorreu um erro ao processar o vídeo na API JSON2Video. Verifique se o roteiro está correto e tente novamente.
                          </p>
                        </div>
                      )}

                      {/* Generated JSON blueprint view */}
                      {generatedJsonView && (
                        <div className="border border-zinc-150 dark:border-white/5 rounded-xl overflow-hidden mt-2 bg-zinc-950">
                          <div className="px-3.5 py-2 border-b border-zinc-150 dark:border-white/5 flex items-center justify-between">
                            <span className="text-[9px] font-black uppercase text-zinc-400 tracking-wider font-mono">Blueprint Automação JSON</span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(JSON.stringify(generatedJsonView, null, 2));
                                alert("Roteiro JSON copiado com sucesso!");
                              }}
                              className="text-[9px] font-bold text-cyan-400 hover:text-cyan-300 transition-colors uppercase font-mono"
                            >
                              Copiar JSON
                            </button>
                          </div>
                          <pre className="p-3 text-[9px] text-emerald-400 overflow-x-auto max-h-36 font-mono leading-relaxed">
                            {JSON.stringify(generatedJsonView, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Standard Text Response */}
                  {aiResponse ? (
                    <div 
                      className="text-xs text-zinc-800 dark:text-zinc-300 overflow-y-auto max-h-80 pr-2 font-sans prose dark:prose-invert"
                      dangerouslySetInnerHTML={{ __html: formatMarkdownResponse(aiResponse) }}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center flex-1 py-12 text-center text-zinc-400 font-mono text-[10px]">
                      <Sparkles className="w-8 h-8 text-zinc-300 dark:text-zinc-700 mb-2 animate-pulse" />
                      <span>Insira suas instruções e clique em "Gerar" para ver o resultado da IA aparecer aqui de forma instantânea.</span>
                    </div>
                  )}
                </div>

              </div>
            )}

          </div>
        ) : (
          /* General Tools Showcase Dashboard */
          <div className="flex flex-col gap-6 animate-fade-in">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-wider font-mono">Suíte de Ferramentas IA</h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Clique em uma das ferramentas avançadas abaixo para iniciar.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredTools.map((t) => (
                <div
                  key={t.id}
                  onClick={() => setActiveTool(t)}
                  className="group relative flex flex-col gap-4 p-5 rounded-2xl bg-white hover:bg-zinc-50/50 dark:bg-zinc-950 dark:hover:bg-[#111112] border border-zinc-200 dark:border-white/5 hover:border-cyan-500/20 hover:shadow-[0_0_20px_rgba(6,182,212,0.05)] transition-all cursor-pointer animate-fade-in"
                >
                  {/* Premium Tag decoration */}
                  {t.status === "premium" && (
                    <span className="absolute top-4 right-4 bg-cyan-50 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-400 text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">
                      Premium
                    </span>
                  )}

                  <div className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 self-start group-hover:bg-cyan-50 group-hover:text-cyan-500 dark:group-hover:bg-cyan-500/10 dark:group-hover:text-cyan-400 transition-all">
                    {getIcon(t.icon, "w-5.5 h-5.5")}
                  </div>

                  <div>
                    <h3 className="text-xs font-extrabold text-zinc-900 dark:text-white uppercase tracking-wider font-mono group-hover:text-cyan-400 transition-colors">
                      {t.name}
                    </h3>
                    <p className="text-[11px] text-zinc-500 dark:text-slate-400 leading-relaxed mt-1">
                      {t.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-cyan-400 group-hover:translate-x-1.5 transition-transform uppercase tracking-widest mt-auto pt-2">
                    <span>Acessar</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
