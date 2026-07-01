import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { Sun, Moon, Menu, X, Shield, Sparkles, User, LogOut, Settings } from "lucide-react";

interface HeaderProps {
  onOpenAuth: (type: "login" | "register") => void;
}

export default function Header({ onOpenAuth }: HeaderProps) {
  const { 
    theme, 
    toggleTheme, 
    user, 
    profile, 
    logout, 
    activeView, 
    setActiveView 
  } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (view: string) => {
    setActiveView(view);
    setMobileMenuOpen(false);
    
    // Smooth scroll to sections if on landing page
    if (view === "landing" || view === "plans" || view === "tools-info") {
      setTimeout(() => {
        const element = document.getElementById(view);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200 bg-white/85 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:border-white/5 dark:bg-black/40 dark:backdrop-blur-md transition-colors duration-300">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        
        {/* Brand Logo */}
        <button 
          onClick={() => handleNavClick("landing")}
          className="flex items-center gap-2 font-black tracking-widest text-lg md:text-xl text-zinc-900 dark:text-white uppercase group"
          id="logo-button"
        >
          <div className="relative w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.4)] group-hover:scale-105 transition-transform shrink-0">
            <div className="w-4 h-4 bg-black rounded-sm transform rotate-45 flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></div>
            </div>
          </div>
          <span className="font-sans font-bold tracking-tighter shrink-0">
            BackHat <span className="text-cyan-500 dark:text-cyan-400 group-hover:text-cyan-300 transition-colors">AI</span>
          </span>
          <span className="hidden sm:inline-block ml-3 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-[10px] text-cyan-500 dark:text-cyan-400 font-mono">PROD_v2.4</span>
        </button>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-600 dark:text-slate-400">
          <button 
            onClick={() => handleNavClick("landing")}
            className={`hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors cursor-pointer ${activeView === "landing" ? "text-cyan-500 dark:text-cyan-400 font-bold" : ""}`}
          >
            Home
          </button>
          <button 
            onClick={() => handleNavClick("tools-info")}
            className="hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors cursor-pointer"
          >
            Ferramentas
          </button>
          <button 
            onClick={() => handleNavClick("plans")}
            className="hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors cursor-pointer"
          >
            Planos
          </button>
          <button 
            onClick={() => handleNavClick("blog")}
            className={`hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors cursor-pointer ${activeView === "blog" ? "text-cyan-500 dark:text-cyan-400 font-bold" : ""}`}
          >
            Blog
          </button>
          <button 
            onClick={() => handleNavClick("contact")}
            className="hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors cursor-pointer"
          >
            Contato
          </button>
        </nav>

        {/* Actions Menu */}
        <div className="hidden md:flex items-center gap-4">
          {/* Theme Switcher */}
          <button 
            onClick={toggleTheme}
            className="rounded-lg p-2 hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-500 dark:text-zinc-400 cursor-pointer"
            aria-label="Alternar tema"
          >
            {theme === "dark" ? <Sun className="w-5 h-5 text-cyan-400" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* User Section */}
          {user ? (
            <div className="flex items-center gap-3 border-l border-zinc-200 dark:border-white/10 pl-4">
              <div className="text-right mr-1 hidden lg:block">
                <div className="text-xs font-bold text-zinc-900 dark:text-white">{profile?.displayName || "Admin User"}</div>
                <div className="text-[10px] text-zinc-500 dark:text-slate-500">{profile?.email}</div>
              </div>
              <button 
                onClick={() => setActiveView(profile?.role === "admin" ? "admin-dashboard" : "user-dashboard")}
                className="flex items-center gap-2 text-xs font-bold bg-zinc-950 text-white hover:bg-zinc-900 dark:bg-gradient-to-tr dark:from-cyan-950 dark:to-zinc-900 dark:hover:from-cyan-900 dark:border dark:border-cyan-500/30 px-4 h-9 rounded-full shadow transition-all cursor-pointer"
              >
                {profile?.role === "admin" ? <Settings className="w-3.5 h-3.5 animate-spin-slow text-cyan-400" /> : <User className="w-3.5 h-3.5" />}
                <span>Painel {profile?.role === "admin" ? "Admin" : "Cliente"}</span>
              </button>
              <button 
                onClick={logout}
                className="rounded-lg p-2 hover:bg-red-50 text-zinc-500 hover:text-red-500 dark:hover:bg-white/5 cursor-pointer"
                title="Sair"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 border-l border-zinc-200 dark:border-white/10 pl-4">
              <button 
                onClick={() => onOpenAuth("login")}
                className="text-sm font-medium text-zinc-700 hover:text-cyan-500 dark:text-zinc-300 dark:hover:text-cyan-400 px-3 py-1.5 rounded transition-colors cursor-pointer"
              >
                Login
              </button>
              <button 
                onClick={() => onOpenAuth("register")}
                className="relative inline-flex items-center justify-center p-0.5 overflow-hidden text-xs font-bold text-white rounded-full group bg-gradient-to-br from-cyan-500 to-blue-600 hover:text-white dark:text-white cursor-pointer"
              >
                <span className="relative px-4 py-2 transition-all ease-in duration-75 bg-zinc-950 rounded-full group-hover:bg-opacity-0">
                  Cadastrar
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Mobile menu trigger */}
        <div className="flex items-center gap-2 md:hidden">
          {/* Mobile Theme Switcher */}
          <button 
            onClick={toggleTheme}
            className="rounded-lg p-2 hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-500 dark:text-zinc-400 cursor-pointer"
          >
            {theme === "dark" ? <Sun className="w-5 h-5 text-cyan-400" /> : <Moon className="w-5 h-5" />}
          </button>
          
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-2 hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-500 dark:text-zinc-400 cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-zinc-200 dark:border-white/5 bg-white dark:bg-black px-6 py-4 flex flex-col gap-4 animate-fade-in">
          <button 
            onClick={() => handleNavClick("landing")}
            className="text-left py-2 font-medium text-zinc-800 dark:text-zinc-200 border-b border-zinc-100 dark:border-white/5"
          >
            Home
          </button>
          <button 
            onClick={() => handleNavClick("tools-info")}
            className="text-left py-2 font-medium text-zinc-800 dark:text-zinc-200 border-b border-zinc-100 dark:border-white/5"
          >
            Ferramentas
          </button>
          <button 
            onClick={() => handleNavClick("plans")}
            className="text-left py-2 font-medium text-zinc-800 dark:text-zinc-200 border-b border-zinc-100 dark:border-white/5"
          >
            Planos
          </button>
          <button 
            onClick={() => handleNavClick("blog")}
            className="text-left py-2 font-medium text-zinc-800 dark:text-zinc-200 border-b border-zinc-100 dark:border-white/5"
          >
            Blog
          </button>
          <button 
            onClick={() => handleNavClick("contact")}
            className="text-left py-2 font-medium text-zinc-800 dark:text-zinc-200 border-b border-zinc-100 dark:border-white/5"
          >
            Contato
          </button>

          {user ? (
            <div className="flex flex-col gap-3 pt-2">
              <button 
                onClick={() => {
                  setActiveView(profile?.role === "admin" ? "admin-dashboard" : "user-dashboard");
                  setMobileMenuOpen(false);
                }}
                className="flex items-center justify-center gap-2 w-full bg-zinc-950 text-white dark:bg-gradient-to-tr dark:from-cyan-950 dark:to-zinc-900 border dark:border-cyan-500/30 py-2.5 rounded-xl font-bold text-sm shadow cursor-pointer"
              >
                <span>Painel {profile?.role === "admin" ? "Admin" : "Cliente"}</span>
              </button>
              <button 
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center justify-center gap-2 w-full bg-red-50 text-red-600 dark:bg-white/5 dark:text-zinc-400 py-2.5 rounded-xl font-bold text-sm cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Desconectar</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2 pt-2">
              <button 
                onClick={() => {
                  onOpenAuth("login");
                  setMobileMenuOpen(false);
                }}
                className="w-full text-center py-2.5 rounded-xl border border-zinc-200 dark:border-white/5 text-zinc-800 dark:text-zinc-200 font-semibold text-sm cursor-pointer"
              >
                Login
              </button>
              <button 
                onClick={() => {
                  onOpenAuth("register");
                  setMobileMenuOpen(false);
                }}
                className="w-full text-center py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-sm shadow cursor-pointer"
              >
                Cadastrar
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
