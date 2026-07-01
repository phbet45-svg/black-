import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useApp } from "../context/AppContext";
import { Shield, Sparkles, Terminal } from "lucide-react";

export default function Intro() {
  const { setIntroFinished } = useApp();
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState(0);

  useEffect(() => {
    // Stage updates for technological "booting" feel
    const stageTimer1 = setTimeout(() => setStage(1), 1200);
    const stageTimer2 = setTimeout(() => setStage(2), 2500);
    const stageTimer3 = setTimeout(() => setStage(3), 4200);

    // Progress bar increments to exactly 100% over 6 seconds
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 1.67; // approx 100 / (6000 / 100ms)
      });
    }, 100);

    // Fade out and finish exactly at 6000ms
    const finishTimer = setTimeout(() => {
      setProgress(100);
      setIntroFinished(true);
    }, 6000);

    return () => {
      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);
      clearTimeout(stageTimer3);
      clearTimeout(finishTimer);
      clearInterval(interval);
    };
  }, [setIntroFinished]);

  const bootMessages = [
    "INITIALIZING CORE SYSTEM PROTOCOLS...",
    "ESTABLISHING SECURE CRYPTOGRAPHIC NODE...",
    "LOADING NEURAL ENGINE AND LANGUAGE MODELS...",
    "BACKHAT AI IS READY. INGRESS GRANTED."
  ];

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center overflow-hidden z-50 font-mono select-none">
      {/* Background cyber grid */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))] pointer-events-none" />
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none" 
        style={{
          backgroundImage: `radial-gradient(circle, #ffffff 1px, transparent 1px)`,
          backgroundSize: "24px 24px"
        }}
      />

      <div className="w-full max-w-xl px-8 flex flex-col items-center relative z-10">
        {/* Animated Cyber Shield and sparkles */}
        <motion.div
          initial={{ scale: 0, rotate: -180, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 80, delay: 0.2 }}
          className="relative mb-6"
        >
          <div className="absolute inset-0 bg-cyan-500 rounded-full blur-xl opacity-30 animate-pulse" />
          <div className="relative bg-zinc-900 border border-cyan-500/30 p-5 rounded-full flex items-center justify-center">
            <Shield className="w-12 h-12 text-cyan-400" />
            <Sparkles className="w-5 h-5 text-cyan-300 absolute top-2 right-2 animate-bounce" />
          </div>
        </motion.div>

        {/* Title Brand - Animating letters */}
        <motion.div
          initial={{ letterSpacing: "0.1em", opacity: 0 }}
          animate={{ letterSpacing: "0.4em", opacity: 1 }}
          transition={{ duration: 2, ease: "easeOut" }}
          className="text-center"
        >
          <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-400 to-blue-500 tracking-widest uppercase">
            BackHat AI
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="text-xs text-zinc-500 tracking-widest mt-2 uppercase font-semibold"
        >
          ADVANCED COGNITIVE SUITE • VERSION 2.4.0
        </motion.p>

        {/* Console loading logs */}
        <div className="w-full h-12 bg-zinc-950/80 border border-zinc-800/60 rounded p-3 mt-12 text-left flex items-center gap-3">
          <Terminal className="w-4 h-4 text-cyan-400 shrink-0 animate-pulse" />
          <AnimatePresence mode="wait">
            <motion.span
              key={stage}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.3 }}
              className="text-[10px] md:text-xs text-zinc-400 font-mono tracking-wider truncate"
            >
              {bootMessages[stage]}
            </motion.span>
          </AnimatePresence>
        </div>

        {/* Progress Bar Container */}
        <div className="w-full bg-zinc-900 h-[3px] rounded-full overflow-hidden mt-6 relative border border-zinc-850">
          <motion.div
            className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-white"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>

        {/* Loading details */}
        <div className="w-full flex justify-between text-[10px] text-zinc-600 mt-2">
          <span>SECURE PROTOCOL ACTIVE</span>
          <span>{Math.min(Math.round(progress), 100)}%</span>
        </div>
      </div>
    </div>
  );
}
