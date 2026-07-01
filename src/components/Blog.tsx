import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { collection, doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "../firebase";
import { BlogPost, BlogComment } from "../types";
import { 
  Calendar, 
  User, 
  Tag, 
  Search, 
  ChevronRight, 
  MessageSquare, 
  ArrowLeft, 
  Globe, 
  CheckCircle,
  Clock
} from "lucide-react";

export default function Blog() {
  const { blogPosts, user, profile, addSystemLog } = useApp();
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Todas");
  const [commentName, setCommentName] = useState("");
  const [commentText, setCommentText] = useState("");
  const [commentSuccess, setCommentSuccess] = useState(false);

  useEffect(() => {
    if (user && profile) {
      setCommentName(profile.displayName || "");
    }
  }, [user, profile]);

  // Categories list
  const categories = ["Todas", "Inteligência Artificial", "Tecnologia", "Segurança", "Marketing Digital", "Novidades"];

  // Filter posts based on search and category
  const filteredPosts = blogPosts.filter((post) => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          post.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "Todas" || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Handle submit comment
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPost || !commentText.trim() || !commentName.trim()) return;

    const newComment: BlogComment = {
      id: Math.random().toString(36).substring(2, 9),
      authorName: commentName,
      content: commentText,
      createdAt: new Date().toISOString()
    };

    try {
      const postRef = doc(db, "blog", selectedPost.id);
      await updateDoc(postRef, {
        comments: arrayUnion(newComment)
      });

      // Update local state
      const updatedPost = {
        ...selectedPost,
        comments: [...(selectedPost.comments || []), newComment]
      };
      setSelectedPost(updatedPost);
      setCommentText("");
      setCommentSuccess(true);
      setTimeout(() => setCommentSuccess(false), 3000);

      await addSystemLog("BLOG_COMMENT", `Comentário adicionado no post: ${selectedPost.title}`);
    } catch (err) {
      console.error("Erro ao adicionar comentário:", err);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 transition-colors duration-300">
      
      {/* Blog Detail View */}
      {selectedPost ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 animate-fade-in">
          {/* Main content */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <button
              onClick={() => setSelectedPost(null)}
              className="inline-flex items-center gap-2 text-xs font-bold text-red-500 hover:text-red-400 mb-2 cursor-pointer uppercase tracking-wider"
            >
              <ArrowLeft className="w-4 h-4" /> Voltar aos posts
            </button>

            <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400 font-mono">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(selectedPost.createdAt).toLocaleDateString("pt-BR")}
              </span>
              <span className="flex items-center gap-1">
                <User className="w-4 h-4" />
                Por {selectedPost.author}
              </span>
              <span className="flex items-center gap-1 bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400 px-2.5 py-0.5 rounded-full font-bold">
                <Tag className="w-3 h-3" />
                {selectedPost.category}
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold text-zinc-900 dark:text-white leading-tight">
              {selectedPost.title}
            </h1>

            {selectedPost.imageUrl && (
              <img
                src={selectedPost.imageUrl}
                alt={selectedPost.title}
                className="w-full aspect-video object-cover rounded-2xl shadow-lg border border-zinc-200 dark:border-zinc-850"
                referrerPolicy="no-referrer"
              />
            )}

            <div className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap font-sans">
              {selectedPost.content}
            </div>

            {/* Comments Area */}
            <div className="border-t border-zinc-200 dark:border-zinc-800 mt-12 pt-8">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-6 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-red-500" />
                Comentários ({selectedPost.comments?.length || 0})
              </h3>

              {/* Comments List */}
              <div className="flex flex-col gap-4 mb-8">
                {selectedPost.comments && selectedPost.comments.length > 0 ? (
                  selectedPost.comments.map((comment) => (
                    <div 
                      key={comment.id} 
                      className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-850"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-zinc-900 dark:text-white font-mono">{comment.authorName}</span>
                        <span className="text-[10px] text-zinc-500 font-mono">
                          {new Date(comment.createdAt).toLocaleDateString("pt-BR")} às {new Date(comment.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed font-sans">{comment.content}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono italic">Nenhum comentário ainda. Seja o primeiro a comentar!</p>
                )}
              </div>

              {/* Leave a Comment Form */}
              <form onSubmit={handleCommentSubmit} className="flex flex-col gap-4">
                <h4 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider">Deixe seu comentário</h4>
                
                {commentSuccess && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30 rounded-lg text-xs font-semibold flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <span>Seu comentário foi publicado com sucesso!</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Seu Nome</label>
                    <input
                      type="text"
                      required
                      value={commentName}
                      onChange={(e) => setCommentName(e.target.value)}
                      placeholder="Ex: Carlos Silva"
                      className="w-full px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-500"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Mensagem</label>
                  <textarea
                    required
                    rows={4}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Escreva seu comentário respeitoso..."
                    className="w-full px-4 py-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-500 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="self-start h-9 bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-5 rounded-lg shadow cursor-pointer"
                >
                  Enviar Comentário
                </button>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-6">
            {/* Meta SEO Box */}
            <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850">
              <h3 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                <Globe className="w-4 h-4 text-red-500" /> Metadados SEO do Post
              </h3>
              <div className="flex flex-col gap-3 font-mono text-[10px] text-zinc-600 dark:text-zinc-400">
                <div>
                  <strong className="text-zinc-900 dark:text-white">Title:</strong> {selectedPost.seoTitle || selectedPost.title}
                </div>
                <div>
                  <strong className="text-zinc-900 dark:text-white">Description:</strong> {selectedPost.seoDescription || "No description configured."}
                </div>
                <div>
                  <strong className="text-zinc-900 dark:text-white">Keywords:</strong> {selectedPost.seoKeywords || "No keywords configured."}
                </div>
                <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex items-center gap-1.5 text-[9px] text-emerald-600 dark:text-emerald-400">
                  <CheckCircle className="w-3.5 h-3.5" /> Google Search Engines Indexable
                </div>
              </div>
            </div>

            {/* Read estimation */}
            <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850">
              <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-red-500" /> Tempo de Leitura
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Aproximadamente {Math.ceil(selectedPost.content.split(/\s+/).length / 200)} minutos de leitura informativa de elite.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Blog List View */
        <div className="flex flex-col gap-10 animate-fade-in">
          
          {/* Header section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-zinc-200 dark:border-zinc-850">
            <div>
              <h2 className="text-3xl font-extrabold text-zinc-900 dark:text-white">Blog de Inteligência Artificial</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Fique por dentro das últimas atualizações, tutoriais e hacks de IA.
              </p>
            </div>
            
            {/* Search Input */}
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Pesquisar artigos..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>
          </div>

          {/* Categories select filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap cursor-pointer transition-colors ${
                  selectedCategory === cat 
                    ? "bg-red-600 text-white" 
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Posts grid */}
          {filteredPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPosts.map((post) => (
                <article
                  key={post.id}
                  onClick={() => setSelectedPost(post)}
                  className="group flex flex-col h-full bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-850 overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer"
                >
                  {post.imageUrl && (
                    <div className="aspect-video w-full overflow-hidden relative">
                      <img
                        src={post.imageUrl}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute top-3 left-3 bg-red-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        {post.category}
                      </span>
                    </div>
                  )}

                  <div className="p-6 flex flex-col gap-3 flex-1">
                    <span className="text-[10px] text-zinc-500 font-mono flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(post.createdAt).toLocaleDateString("pt-BR")}
                    </span>

                    <h3 className="text-base font-bold text-zinc-900 dark:text-white group-hover:text-red-500 transition-colors line-clamp-2 leading-snug">
                      {post.title}
                    </h3>

                    <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-3 leading-relaxed flex-1">
                      {post.content}
                    </p>

                    <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-900 pt-4 mt-2">
                      <span className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300 font-mono">Por {post.author}</span>
                      <span className="text-xs font-bold text-red-500 group-hover:translate-x-1 transition-transform flex items-center gap-1 uppercase tracking-wider">
                        Ler post <ChevronRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
              <p className="text-sm text-zinc-500 dark:text-zinc-400 font-mono">Nenhum post publicado com esses filtros no momento.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
