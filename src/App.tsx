import React, { useState } from "react";
import { AppProvider, useApp } from "./context/AppContext";
import Intro from "./components/Intro";
import Header from "./components/Header";
import Footer from "./components/Footer";
import LandingPage from "./components/LandingPage";
import Blog from "./components/Blog";
import UserPanel from "./components/UserPanel";
import AdminPanel from "./components/AdminPanel";
import AITools from "./components/AITools";
import Auth from "./components/Auth";

function MainApp() {
  const { introFinished, activeView, user, profile } = useApp();
  const [authOpen, setAuthOpen] = useState(false);
  const [authType, setAuthType] = useState<"login" | "register">("login");

  const openAuth = (type: "login" | "register") => {
    setAuthType(type);
    setAuthOpen(true);
  };

  // If 6-second intro is not finished, display the tech boot screen
  if (!introFinished) {
    return <Intro />;
  }

  // Active View Orchestration
  const renderActiveView = () => {
    switch (activeView) {
      case "blog":
        return <Blog />;
      
      case "user-dashboard":
        if (user) {
          return <UserPanel />;
        } else {
          // If trying to access user-dashboard anonymously, force login
          return (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center animate-fade-in min-h-[60vh]">
              <h2 className="text-xl font-bold uppercase font-mono mb-2">Acesso Restrito</h2>
              <p className="text-xs text-zinc-500 mb-6">Por favor, efetue seu login para acessar o painel do assinante BackHat AI.</p>
              <button
                onClick={() => openAuth("login")}
                className="h-10 bg-red-600 hover:bg-red-500 text-white font-bold text-xs px-6 rounded-xl shadow cursor-pointer"
              >
                Acessar Minha Conta
              </button>
            </div>
          );
        }

      case "admin-dashboard":
        if (user && profile?.role === "admin") {
          return <AdminPanel />;
        } else {
          // Deny access
          return (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center animate-fade-in min-h-[60vh]">
              <h2 className="text-xl font-bold uppercase font-mono text-red-500 mb-2">Acesso Negado</h2>
              <p className="text-xs text-zinc-500 mb-6">Esta área é restrita aos Engenheiros de Operações da BackHat AI.</p>
              <button
                onClick={() => openAuth("login")}
                className="h-10 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold px-6 rounded-xl cursor-pointer"
              >
                Identificar-se como Administrador
              </button>
            </div>
          );
        }

      case "tools-info":
        if (user) {
          // If logged in, let them access the fully-functional tools area
          return <AITools />;
        } else {
          // If not logged in, show landing with a scroll down or prompt login
          return <LandingPage onOpenAuth={openAuth} />;
        }

      case "landing":
      default:
        return <LandingPage onOpenAuth={openAuth} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-300">
      <Header onOpenAuth={openAuth} />
      
      {/* Dynamic Viewport */}
      <main className="flex-grow">
        {renderActiveView()}
      </main>

      <Footer />

      {/* Persistent Auth Modal Overlays */}
      {authOpen && (
        <Auth 
          isOpen={authOpen} 
          onClose={() => setAuthOpen(false)} 
          initialType={authType} 
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
