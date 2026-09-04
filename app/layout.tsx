import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";
import Navbar from "@/components/Navbar";
import ChatbotFab from "@/components/ChatbotFab";
import ChatbotPanel from "@/components/ChatbotPanel";
import EmailModal from "@/components/EmailModal";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces" });

export const metadata: Metadata = {
  title: "Vidya — Ask anything. Understand everything.",
  description:
    "Vidya is an AI academic companion: a Code Explanation Tutor and Lab Experiment Prep Assistant under one calm chat interface.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${fraunces.variable} font-sans`}>
        <AppProvider>
          <div className="min-h-screen flex flex-col bg-cream dark:bg-stone-950 text-ink dark:text-stone-100 transition-colors">
            <Navbar />
            <main className="flex-1">{children}</main>
            <footer className="border-t border-stone-200/70 dark:border-stone-800 mt-10">
              <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row gap-3 items-center justify-between text-[13px] text-ink-soft dark:text-stone-400">
                <p className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-spruce-600 text-white grid place-items-center font-serif text-sm">वि</span>
                  <span><strong className="font-serif text-ink dark:text-white">Vidya</strong> · study calmly, understand deeply.</span>
                </p>

              </div>
            </footer>
            <ChatbotFab />
            <ChatbotPanel />
            <EmailModal />
          </div>
        </AppProvider>
      </body>
    </html>
  );
}
