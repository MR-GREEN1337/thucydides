"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp } from "lucide-react";
import AnimatedGradientBackground from "@/components/global/animated-gradient-background";

const showcasePrompts = [
  "Ask Marcus Aurelius about Stoicism...",
  "Ask Sun Tzu about the art of war...",
  "Ask Cleopatra about ruling Egypt...",
  "Ask Leonardo da Vinci about invention...",
  "Ask Isaac Newton about gravity...",
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const [promptIndex, setPromptIndex] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setPromptIndex((prevIndex) => (prevIndex + 1) % showcasePrompts.length);
    }, 4000); // Cycle every 4 seconds

    return () => clearInterval(intervalId); // Cleanup on unmount
  }, []);

  return (
    <main className="grid grid-cols-1 md:grid-cols-2 min-h-screen bg-zinc-950">
      {/* Left Panel: Auth Form (Children) */}
      <div className="flex justify-center items-start p-8 pt-20 md:pt-24 lg:pt-32">
        <motion.div
          key={children?.toString()} // Animate when children change
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="w-full"
        >
          {children}
        </motion.div>
      </div>

      {/* Right Panel: Showcase */}
      <div className="hidden md:flex relative items-center justify-center overflow-hidden p-12">
        <AnimatedGradientBackground
          gradientColors={["#111827", "#1E40AF", "#B91C1C"]}
          gradientStops={[20, 50, 100]}
        />
        <div className="relative z-10 flex items-center w-full max-w-md rounded-full bg-black/20 p-2 text-lg font-medium text-white shadow-lg backdrop-blur-lg border border-white/10">
          <div className="pl-4 text-zinc-300 text-base h-6 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.p
                key={promptIndex}
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: "0%", opacity: 1 }}
                exit={{ y: "-100%", opacity: 0 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              >
                {showcasePrompts[promptIndex]}
              </motion.p>
            </AnimatePresence>
          </div>
          <div className="ml-auto flex-shrink-0 rounded-full bg-white p-2">
            <ArrowUp className="size-5 text-black"/>
          </div>
        </div>
      </div>
    </main>
  );
}
